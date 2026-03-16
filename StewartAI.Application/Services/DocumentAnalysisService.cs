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
    private readonly AppDbContext _db;
    private readonly ILogger<DocumentAnalysisService> _logger;

    public DocumentAnalysisService(IGeminiService geminiService, AppDbContext db, ILogger<DocumentAnalysisService> logger)
    {
        _geminiService = geminiService;
        _db = db;
        _logger = logger;
    }

    public async Task<DocumentAnalysisResponse> AnalyzeDocumentAsync(Stream pdfStream, string fileName)
    {
        // Step 1: Extract text from PDF using iText7
        var extractedText = ExtractTextFromPdf(pdfStream);
        _logger.LogInformation("Extracted {Length} characters from {FileName}", extractedText.Length, fileName);

        if (string.IsNullOrWhiteSpace(extractedText))
        {
            throw new InvalidOperationException("Could not extract any text from the uploaded PDF. The file may be image-based or empty.");
        }

        // Step 2: Send to Gemini for analysis
        var prompt = BuildAnalysisPrompt(extractedText);
        var aiResponse = await _geminiService.GenerateContentAsync(prompt, temperature: 0.3, responseMimeType: "application/json");

        _logger.LogDebug("Gemini raw response: {Response}", aiResponse);

        // Step 3: Parse the AI response
        var analysis = ParseAiResponse(aiResponse);

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
        await _db.SaveChangesAsync();

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

    private static string ExtractTextFromPdf(Stream pdfStream)
    {
        var sb = new StringBuilder();
        using var reader = new PdfReader(pdfStream);
        using var pdfDoc = new PdfDocument(reader);

        for (var i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
        {
            var page = pdfDoc.GetPage(i);
            var strategy = new SimpleTextExtractionStrategy();
            var pageText = PdfTextExtractor.GetTextFromPage(page, strategy);
            sb.AppendLine(pageText);
        }

        return sb.ToString().Trim();
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
}
