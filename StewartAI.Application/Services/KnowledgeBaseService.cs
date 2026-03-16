using System.Text;
using System.Text.Json;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StewartAI.Domain.Entities;
using StewartAI.Infrastructure.Persistence;

namespace StewartAI.Application.Services;

public class KnowledgeBaseService : IKnowledgeBaseService
{
    private readonly IGeminiService _geminiService;
    private readonly AppDbContext _db;
    private readonly ILogger<KnowledgeBaseService> _logger;

    private const int ChunkSize = 1000; // characters per chunk
    private const int ChunkOverlap = 200; // overlap between chunks

    public KnowledgeBaseService(IGeminiService geminiService, AppDbContext db, ILogger<KnowledgeBaseService> logger)
    {
        _geminiService = geminiService;
        _db = db;
        _logger = logger;
    }

    public async Task IngestDocumentAsync(Stream documentStream, string fileName)
    {
        // Step 1: Extract text from PDF
        var text = ExtractText(documentStream, fileName);
        _logger.LogInformation("Extracted {Length} chars from {FileName}", text.Length, fileName);

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException($"Could not extract text from {fileName}");
        }

        // Step 2: Split into chunks
        var chunks = SplitIntoChunks(text);
        _logger.LogInformation("Split into {Count} chunks", chunks.Count);

        // Step 3: Remove existing chunks for this document (re-ingest support)
        var existing = await _db.KnowledgeChunks.Where(k => k.DocumentName == fileName).ToListAsync();
        if (existing.Count > 0)
        {
            _db.KnowledgeChunks.RemoveRange(existing);
            _logger.LogInformation("Removed {Count} existing chunks for {FileName}", existing.Count, fileName);
        }

        // Step 4: Generate embeddings and store
        for (var i = 0; i < chunks.Count; i++)
        {
            var embedding = await _geminiService.GenerateEmbeddingAsync(chunks[i]);

            var entity = new KnowledgeChunk
            {
                DocumentName = fileName,
                Content = chunks[i],
                ChunkIndex = i,
                EmbeddingJson = JsonSerializer.Serialize(embedding)
            };

            _db.KnowledgeChunks.Add(entity);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Ingested {Count} chunks for {FileName}", chunks.Count, fileName);
    }

    public async Task<List<KnowledgeSearchResult>> SearchAsync(string query, int topK = 5)
    {
        // Step 1: Generate embedding for the query
        var queryEmbedding = await _geminiService.GenerateEmbeddingAsync(query);

        // Step 2: Load all chunks and compute cosine similarity (simple in-memory approach for prototype)
        var allChunks = await _db.KnowledgeChunks.ToListAsync();

        if (allChunks.Count == 0)
        {
            _logger.LogWarning("Knowledge base is empty — no chunks to search");
            return [];
        }

        // Step 3: Score and rank
        var scored = allChunks.Select(chunk =>
        {
            var chunkEmbedding = JsonSerializer.Deserialize<float[]>(chunk.EmbeddingJson) ?? [];
            var score = CosineSimilarity(queryEmbedding, chunkEmbedding);
            return new { Chunk = chunk, Score = score };
        })
        .OrderByDescending(x => x.Score)
        .Take(topK)
        .ToList();

        return scored.Select(x => new KnowledgeSearchResult
        {
            DocumentName = x.Chunk.DocumentName,
            Content = x.Chunk.Content,
            Score = x.Score
        }).ToList();
    }

    public async Task<int> GetChunkCountAsync()
    {
        return await _db.KnowledgeChunks.CountAsync();
    }

    public async Task<KnowledgeSeedResult> SeedKnowledgeBaseAsync(string seedDataPath)
    {
        var result = new KnowledgeSeedResult();

        if (!Directory.Exists(seedDataPath))
        {
            _logger.LogWarning("Seed data directory not found: {Path}", seedDataPath);
            result.Errors.Add($"Seed data directory not found: {seedDataPath}");
            return result;
        }

        var files = Directory.GetFiles(seedDataPath, "*.txt").OrderBy(f => f).ToArray();
        _logger.LogInformation("Found {Count} seed files in {Path}", files.Length, seedDataPath);

        foreach (var filePath in files)
        {
            var fileName = Path.GetFileName(filePath);

            try
            {
                // Check if already ingested (skip if chunks exist for this file)
                var existingCount = await _db.KnowledgeChunks.CountAsync(k => k.DocumentName == fileName);
                if (existingCount > 0)
                {
                    _logger.LogInformation("Skipping {FileName} — already ingested ({Count} chunks)", fileName, existingCount);
                    result.FilesSkipped++;
                    result.SkippedFiles.Add(fileName);
                    continue;
                }

                // Ingest the file
                await using var stream = File.OpenRead(filePath);
                await IngestDocumentAsync(stream, fileName);

                result.FilesProcessed++;
                result.ProcessedFiles.Add(fileName);
                _logger.LogInformation("Seeded {FileName} successfully", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to seed {FileName}", fileName);
                result.Errors.Add($"{fileName}: {ex.Message}");
            }
        }

        result.TotalChunks = await GetChunkCountAsync();
        _logger.LogInformation("Knowledge base seeding complete: {Processed} processed, {Skipped} skipped, {Total} total chunks",
            result.FilesProcessed, result.FilesSkipped, result.TotalChunks);

        return result;
    }

    private static string ExtractText(Stream stream, string fileName)
    {
        if (fileName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase))
        {
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }

        // PDF extraction
        var sb = new StringBuilder();
        using var pdfReader = new PdfReader(stream);
        using var pdfDoc = new PdfDocument(pdfReader);

        for (var i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
        {
            var page = pdfDoc.GetPage(i);
            var strategy = new SimpleTextExtractionStrategy();
            sb.AppendLine(PdfTextExtractor.GetTextFromPage(page, strategy));
        }

        return sb.ToString().Trim();
    }

    private static List<string> SplitIntoChunks(string text)
    {
        var chunks = new List<string>();
        var position = 0;

        while (position < text.Length)
        {
            var end = Math.Min(position + ChunkSize, text.Length);
            var chunk = text[position..end].Trim();

            if (!string.IsNullOrWhiteSpace(chunk))
            {
                chunks.Add(chunk);
            }

            position += ChunkSize - ChunkOverlap;
        }

        return chunks;
    }

    private static double CosineSimilarity(float[] a, float[] b)
    {
        if (a.Length != b.Length || a.Length == 0) return 0;

        double dotProduct = 0, normA = 0, normB = 0;
        for (var i = 0; i < a.Length; i++)
        {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        var denominator = Math.Sqrt(normA) * Math.Sqrt(normB);
        return denominator == 0 ? 0 : dotProduct / denominator;
    }
}
