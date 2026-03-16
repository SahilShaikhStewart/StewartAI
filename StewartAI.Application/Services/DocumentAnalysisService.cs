using System.Text;
using System.Text.Json;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StewartAI.Application.DTOs.Documents;
using StewartAI.Domain.Entities;
using StewartAI.Infrastructure.Persistence;

namespace StewartAI.Application.Services;

public class DocumentAnalysisService : IDocumentAnalysisService
{
    private readonly IGeminiService _geminiService;
    private readonly IKnowledgeBaseService _knowledgeBaseService;
    private readonly AppDbContext _db;
    private readonly ILogger<DocumentAnalysisService> _logger;

    /// <summary>Image/photo MIME types that Gemini Vision can process natively.</summary>
    private static readonly HashSet<string> ImageMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/tiff", "image/gif"
    };

    /// <summary>File extensions that are images (photos, scans, screenshots).</summary>
    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".gif"
    };

    public DocumentAnalysisService(
        IGeminiService geminiService,
        IKnowledgeBaseService knowledgeBaseService,
        AppDbContext db,
        ILogger<DocumentAnalysisService> logger)
    {
        _geminiService = geminiService;
        _knowledgeBaseService = knowledgeBaseService;
        _db = db;
        _logger = logger;
    }

    public async Task<DocumentAnalysisResponse> AnalyzeDocumentAsync(Stream fileStream, string fileName)
    {
        // Step 1: Determine file type and extract/process accordingly
        var isImage = IsImageFile(fileName);
        var isPdf = fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);

        string extractedText;
        bool usedVision = false;

        if (isImage)
        {
            // ─── IMAGE FILE: Use Gemini Vision directly ───────────────────────
            _logger.LogInformation("Processing image file via Gemini Vision: {FileName}", fileName);
            var imageBytes = await ReadStreamToBytes(fileStream);
            var mimeType = GetMimeType(fileName);

            extractedText = await ExtractTextFromImageAsync(imageBytes, mimeType, fileName);
            usedVision = true;
        }
        else if (isPdf)
        {
            // ─── PDF: Try text extraction first, fall back to Vision for scanned PDFs ──
            var pdfBytes = await ReadStreamToBytes(fileStream);
            using var pdfStream = new MemoryStream(pdfBytes);
            extractedText = ExtractTextFromPdf(pdfStream);

            // If PDF has very little text, it's likely a scanned/image-based PDF
            if (extractedText.Length < 50)
            {
                _logger.LogInformation(
                    "PDF has minimal text ({Length} chars) — treating as scanned PDF, using Gemini Vision: {FileName}",
                    extractedText.Length, fileName);

                extractedText = await ExtractTextFromImageAsync(pdfBytes, "application/pdf", fileName);
                usedVision = true;
            }
        }
        else
        {
            // ─── TXT: Direct text read ────────────────────────────────────────
            extractedText = await ExtractTextFromStream(fileStream);
        }

        _logger.LogInformation(
            "Extracted {Length} characters from {FileName} (vision={UsedVision})",
            extractedText.Length, fileName, usedVision);

        if (string.IsNullOrWhiteSpace(extractedText))
        {
            throw new InvalidOperationException(
                "Could not extract any text from the uploaded document. " +
                "The file may be empty or in an unsupported format.");
        }

        // Step 2: Send to Gemini for analysis
        var prompt = BuildAnalysisPrompt(extractedText);
        var aiResponse = await _geminiService.GenerateContentAsync(prompt, temperature: 0.3, responseMimeType: "application/json");

        _logger.LogDebug("Gemini raw response: {Response}", aiResponse);

        // Step 3: Parse the AI response
        var analysis = ParseAiResponse(aiResponse);

        // Tag if vision was used (useful for demo/presentation)
        if (usedVision)
        {
            analysis.Summary = $"[📷 Processed via AI Vision] {analysis.Summary}";
        }

        // Step 4: Store in database
        var entity = new DocumentAnalysis
        {
            FileName = fileName,
            DocumentType = analysis.DocumentType,
            RiskLevel = analysis.RiskLevel,
            Summary = analysis.Summary,
            EntitiesJson = JsonSerializer.Serialize(analysis.Entities),
            DefectsJson = JsonSerializer.Serialize(analysis.Defects),
            RiskExplanation = analysis.RiskExplanation,
            ExtractedText = extractedText.Length > 10000 ? extractedText[..10000] : extractedText,
            RawAiResponse = aiResponse,
            AnalyzedAt = DateTime.UtcNow
        };

        _db.DocumentAnalyses.Add(entity);

        // ─── INTELLIGENCE LOOP: Auto-create risk record from analysis ────────
        var riskRecord = CreateRiskRecordFromAnalysis(entity, analysis);
        _db.RiskRecords.Add(riskRecord);
        _logger.LogInformation("Created risk record from document analysis: {FileName} → Risk Score {Score}",
            fileName, riskRecord.RiskScore);

        await _db.SaveChangesAsync();

        // ─── INTELLIGENCE LOOP: Auto-ingest into knowledge base (fire-and-forget) ──
        _ = Task.Run(async () =>
        {
            try
            {
                var analysisText = $"Document: {fileName}\nType: {analysis.DocumentType}\nRisk: {analysis.RiskLevel}\n" +
                                   $"Summary: {analysis.Summary}\n\n{extractedText}";
                using var memStream = new MemoryStream(Encoding.UTF8.GetBytes(analysisText));
                await _knowledgeBaseService.IngestDocumentAsync(memStream, $"analyzed-{fileName}");
                _logger.LogInformation("Auto-ingested analyzed document into knowledge base: {FileName}", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to auto-ingest {FileName} into knowledge base (non-critical)", fileName);
            }
        });

        analysis.Id = entity.Id;
        analysis.FileName = fileName;
        analysis.AnalyzedAt = entity.AnalyzedAt;

        return analysis;
    }

    public async Task<DocumentAnalysisResponse?> GetAnalysisAsync(Guid id)
    {
        var entity = await _db.DocumentAnalyses.FindAsync(id);
        if (entity is null) return null;
        return MapToResponse(entity);
    }

    public async Task<List<DocumentAnalysisResponse>> GetAllAnalysesAsync()
    {
        var entities = await _db.DocumentAnalyses
            .OrderByDescending(d => d.AnalyzedAt)
            .Take(50)
            .ToListAsync();

        return entities.Select(MapToResponse).ToList();
    }

    // ─── TEXT EXTRACTION METHODS ──────────────────────────────────────────────

    /// <summary>
    /// Uses Gemini Vision to extract text from an image or scanned PDF.
    /// This handles: photos of documents, handwritten text, scanned PDFs, screenshots.
    /// </summary>
    private async Task<string> ExtractTextFromImageAsync(byte[] fileBytes, string mimeType, string fileName)
    {
        var ocrPrompt = """
            You are an expert document OCR and text extraction system for Stewart Title Insurance.
            
            Extract ALL text from this document image as accurately as possible.
            Preserve the document structure, including:
            - Headers and titles
            - Paragraph breaks
            - Table layouts (use plain text formatting)
            - Numbered/bulleted lists
            - Signatures (note as [SIGNATURE] or [HANDWRITTEN SIGNATURE])
            - Handwritten annotations (transcribe and mark as [HANDWRITTEN: ...])
            - Stamps or seals (note as [OFFICIAL SEAL] or [STAMP: ...])
            
            If the document contains handwritten text, transcribe it as accurately as possible.
            If any text is illegible, mark it as [ILLEGIBLE].
            
            Return ONLY the extracted text, no commentary.
            """;

        var extractedText = await _geminiService.GenerateContentFromImageAsync(
            fileBytes, mimeType, ocrPrompt, temperature: 0.1);

        _logger.LogInformation(
            "Gemini Vision extracted {Length} chars from {FileName} ({MimeType})",
            extractedText.Length, fileName, mimeType);

        return extractedText;
    }

    /// <summary>Extract text from a PDF using iText7 (for text-based PDFs).</summary>
    private static string ExtractTextFromPdf(Stream stream)
    {
        var sb = new StringBuilder();
        using var pdfReader = new PdfReader(stream);
        using var pdfDoc = new PdfDocument(pdfReader);

        for (var i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
        {
            var page = pdfDoc.GetPage(i);
            var strategy = new SimpleTextExtractionStrategy();
            var pageText = PdfTextExtractor.GetTextFromPage(page, strategy);
            sb.AppendLine(pageText);
        }

        return sb.ToString().Trim();
    }

    /// <summary>Extract text from a plain text stream (TXT files).</summary>
    private static async Task<string> ExtractTextFromStream(Stream stream)
    {
        using var reader = new StreamReader(stream);
        var text = await reader.ReadToEndAsync();
        return text.Trim();
    }

    // ─── HELPER METHODS ──────────────────────────────────────────────────────

    /// <summary>Check if a filename is an image type.</summary>
    public static bool IsImageFile(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        return ImageExtensions.Contains(ext);
    }

    /// <summary>Get MIME type from file extension.</summary>
    public static string GetMimeType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".tiff" or ".tif" => "image/tiff",
            ".gif" => "image/gif",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
    }

    /// <summary>Read a stream into a byte array.</summary>
    private static async Task<byte[]> ReadStreamToBytes(Stream stream)
    {
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        return ms.ToArray();
    }

    private static string BuildAnalysisPrompt(string extractedText)
    {
        // Truncate if too long to stay within token limits
        var text = extractedText.Length > 6000 ? extractedText[..6000] + "\n\n[... text truncated ...]" : extractedText;

        return $$"""
            You are an expert title insurance document analyst at Stewart Title.
            Analyze the following text extracted from a real estate document.

            EXTRACTED TEXT:
            ---
            {{text}}
            ---

            Provide your analysis as a JSON object with exactly this structure:
            {
                "documentType": "one of: Deed, Mortgage, Lien, Title Commitment, Closing Disclosure, Promissory Note, Survey, Tax Certificate, Lien Release, Judgment, Other",
                "riskLevel": "Low, Medium, or High",
                "summary": "2-3 sentence summary of the document",
                "entities": [
                    { "type": "Property Address", "value": "extracted value" },
                    { "type": "Grantor/Borrower", "value": "extracted value" },
                    { "type": "Grantee/Lender", "value": "extracted value" },
                    { "type": "Date", "value": "extracted value" },
                    { "type": "Amount", "value": "extracted value" },
                    { "type": "Legal Description", "value": "extracted value" }
                ],
                "defects": [
                    {
                        "description": "description of the potential title defect",
                        "severity": "Low, Medium, or High",
                        "suggestedAction": "recommended curative action"
                    }
                ],
                "riskExplanation": "explanation of the overall risk assessment"
            }

            If no defects are found, return an empty defects array.
            Only include entities that are actually present in the document.
            Be thorough but concise.
            """;
    }

    private static DocumentAnalysisResponse ParseAiResponse(string aiResponse)
    {
        try
        {
            // Clean up the response — Gemini sometimes wraps JSON in markdown code blocks
            var json = aiResponse.Trim();
            if (json.StartsWith("```json")) json = json[7..];
            if (json.StartsWith("```")) json = json[3..];
            if (json.EndsWith("```")) json = json[..^3];
            json = json.Trim();

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var response = new DocumentAnalysisResponse
            {
                DocumentType = root.GetProperty("documentType").GetString() ?? "Unknown",
                RiskLevel = root.GetProperty("riskLevel").GetString() ?? "Unknown",
                Summary = root.GetProperty("summary").GetString() ?? string.Empty,
                RiskExplanation = root.GetProperty("riskExplanation").GetString() ?? string.Empty,
                Entities = [],
                Defects = []
            };

            if (root.TryGetProperty("entities", out var entities))
            {
                foreach (var entity in entities.EnumerateArray())
                {
                    response.Entities.Add(new ExtractedEntity
                    {
                        Type = entity.GetProperty("type").GetString() ?? string.Empty,
                        Value = entity.GetProperty("value").GetString() ?? string.Empty
                    });
                }
            }

            if (root.TryGetProperty("defects", out var defects))
            {
                foreach (var defect in defects.EnumerateArray())
                {
                    response.Defects.Add(new TitleDefect
                    {
                        Description = defect.GetProperty("description").GetString() ?? string.Empty,
                        Severity = defect.GetProperty("severity").GetString() ?? string.Empty,
                        SuggestedAction = defect.GetProperty("suggestedAction").GetString() ?? string.Empty
                    });
                }
            }

            return response;
        }
        catch (JsonException ex)
        {
            // If parsing fails, return a basic response with the raw text
            return new DocumentAnalysisResponse
            {
                DocumentType = "Unknown",
                RiskLevel = "Unknown",
                Summary = $"AI analysis completed but response parsing failed: {ex.Message}",
                RiskExplanation = aiResponse
            };
        }
    }

    private static DocumentAnalysisResponse MapToResponse(DocumentAnalysis entity)
    {
        return new DocumentAnalysisResponse
        {
            Id = entity.Id,
            FileName = entity.FileName,
            DocumentType = entity.DocumentType,
            RiskLevel = entity.RiskLevel,
            Summary = entity.Summary,
            RiskExplanation = entity.RiskExplanation,
            Entities = JsonSerializer.Deserialize<List<ExtractedEntity>>(entity.EntitiesJson) ?? [],
            Defects = JsonSerializer.Deserialize<List<TitleDefect>>(entity.DefectsJson) ?? [],
            AnalyzedAt = entity.AnalyzedAt
        };
    }

    /// <summary>
    /// INTELLIGENCE LOOP: Creates a RiskRecord from document analysis results,
    /// connecting Document Intelligence → Risk Dashboard automatically.
    /// </summary>
    private static RiskRecord CreateRiskRecordFromAnalysis(DocumentAnalysis doc, DocumentAnalysisResponse analysis)
    {
        // Map risk level to numeric score
        var riskScore = analysis.RiskLevel.ToLower() switch
        {
            "high" => 75.0 + Random.Shared.Next(0, 25),   // 75-100
            "medium" => 40.0 + Random.Shared.Next(0, 35),  // 40-75
            "low" => 5.0 + Random.Shared.Next(0, 35),      // 5-40
            _ => 50.0
        };

        // Extract state from entities if available
        var addressEntity = analysis.Entities.FirstOrDefault(e =>
            e.Type.Contains("Address", StringComparison.OrdinalIgnoreCase));
        var state = "TX"; // Default to TX (our demo docs are Houston, TX)
        var stateCode = "TX";
        var county = "Harris";

        if (addressEntity != null)
        {
            var addr = addressEntity.Value;
            // Simple state extraction from address
            if (addr.Contains("Texas", StringComparison.OrdinalIgnoreCase) || addr.Contains(", TX", StringComparison.OrdinalIgnoreCase))
            { state = "Texas"; stateCode = "TX"; }
            else if (addr.Contains("California", StringComparison.OrdinalIgnoreCase) || addr.Contains(", CA", StringComparison.OrdinalIgnoreCase))
            { state = "California"; stateCode = "CA"; }
            else if (addr.Contains("Florida", StringComparison.OrdinalIgnoreCase) || addr.Contains(", FL", StringComparison.OrdinalIgnoreCase))
            { state = "Florida"; stateCode = "FL"; }
            else if (addr.Contains("New York", StringComparison.OrdinalIgnoreCase) || addr.Contains(", NY", StringComparison.OrdinalIgnoreCase))
            { state = "New York"; stateCode = "NY"; }
        }

        // Extract amount from entities
        var amountEntity = analysis.Entities.FirstOrDefault(e =>
            e.Type.Contains("Amount", StringComparison.OrdinalIgnoreCase) ||
            e.Type.Contains("Price", StringComparison.OrdinalIgnoreCase));
        var amount = 350000m;
        if (amountEntity != null)
        {
            var cleaned = new string(amountEntity.Value.Where(c => char.IsDigit(c) || c == '.').ToArray());
            if (decimal.TryParse(cleaned, out var parsed) && parsed > 0)
                amount = parsed;
        }

        // Determine if this should be flagged as a claim based on defects
        var hasClaim = analysis.Defects.Any(d =>
            d.Severity.Equals("High", StringComparison.OrdinalIgnoreCase));
        var claimReason = hasClaim
            ? string.Join("; ", analysis.Defects
                .Where(d => d.Severity.Equals("High", StringComparison.OrdinalIgnoreCase))
                .Select(d => d.Description)
                .Take(3))
            : null;

        return new RiskRecord
        {
            State = state,
            StateCode = stateCode,
            County = county,
            PropertyType = doc.DocumentType.Contains("Commercial", StringComparison.OrdinalIgnoreCase)
                ? "Commercial" : "Residential",
            TransactionType = doc.DocumentType.Contains("Mortgage", StringComparison.OrdinalIgnoreCase)
                || doc.DocumentType.Contains("Deed of Trust", StringComparison.OrdinalIgnoreCase)
                ? "Refinance" : "Purchase",
            PurchasePrice = amount,
            LoanAmount = amount * 0.8m,
            RiskScore = riskScore,
            HasClaim = hasClaim,
            ClaimReason = claimReason
        };
    }
}
