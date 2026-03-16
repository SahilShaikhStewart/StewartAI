using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StewartAI.Application.Services;
using StewartAI.Infrastructure.Persistence;

namespace StewartAI.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly IGeminiService _geminiService;
    private readonly AppDbContext _db;
    private readonly ILogger<HealthController> _logger;

    public HealthController(IGeminiService geminiService, AppDbContext db, ILogger<HealthController> logger)
    {
        _geminiService = geminiService;
        _db = db;
        _logger = logger;
    }

    /// <summary>Basic health check.</summary>
    [HttpGet]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "healthy",
            service = "Stewart AI Platform",
            version = "1.0.0",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Platform metrics — aggregated stats from all features.
    /// Used by the Audit Trail / Metrics page to show enterprise-grade processing data.
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        // Document Analysis metrics
        var totalDocuments = await _db.DocumentAnalyses.CountAsync();
        var recentDocuments = await _db.DocumentAnalyses
            .OrderByDescending(d => d.AnalyzedAt)
            .Take(20)
            .Select(d => new
            {
                d.Id,
                d.FileName,
                d.DocumentType,
                d.RiskLevel,
                d.AnalyzedAt,
                textLength = d.ExtractedText != null ? d.ExtractedText.Length : 0,
                isVision = d.Summary != null && d.Summary.Contains("[📷")
            })
            .ToListAsync();

        var docsByType = await _db.DocumentAnalyses
            .GroupBy(d => d.DocumentType)
            .Select(g => new { type = g.Key, count = g.Count() })
            .ToListAsync();

        var docsByRisk = await _db.DocumentAnalyses
            .GroupBy(d => d.RiskLevel)
            .Select(g => new { level = g.Key, count = g.Count() })
            .ToListAsync();

        // Knowledge Base metrics
        var totalChunks = await _db.KnowledgeChunks.CountAsync();
        var uniqueDocuments = await _db.KnowledgeChunks
            .Select(k => k.DocumentName)
            .Distinct()
            .CountAsync();
        var knowledgeDocNames = await _db.KnowledgeChunks
            .Select(k => k.DocumentName)
            .Distinct()
            .ToListAsync();

        // Chat / Conversation metrics
        var totalConversations = await _db.Conversations.CountAsync();
        var totalMessages = await _db.ConversationMessages.CountAsync();
        var recentConversations = await _db.Conversations
            .OrderByDescending(c => c.CreatedAt)
            .Take(10)
            .Select(c => new
            {
                c.Id,
                c.CreatedAt,
                messageCount = c.Messages.Count
            })
            .ToListAsync();

        // Risk metrics
        var totalRiskRecords = await _db.RiskRecords.CountAsync();
        var avgRiskScore = totalRiskRecords > 0
            ? await _db.RiskRecords.AverageAsync(r => r.RiskScore)
            : 0;
        var claimCount = await _db.RiskRecords.CountAsync(r => r.HasClaim);

        var riskByState = await _db.RiskRecords
            .GroupBy(r => r.StateCode)
            .Select(g => new { state = g.Key, count = g.Count(), avgScore = g.Average(r => r.RiskScore) })
            .OrderByDescending(g => g.count)
            .Take(10)
            .ToListAsync();

        return Ok(new
        {
            timestamp = DateTime.UtcNow,
            platform = new
            {
                name = "Stewart Title Intelligence Platform",
                version = "1.0.0",
                aiModel = "gemini-2.5-flash",
                embeddingModel = "gemini-embedding-001"
            },
            documentAnalysis = new
            {
                totalDocuments,
                documentsByType = docsByType,
                documentsByRisk = docsByRisk,
                recentDocuments
            },
            knowledgeBase = new
            {
                totalChunks,
                uniqueDocuments,
                documentNames = knowledgeDocNames
            },
            chat = new
            {
                totalConversations,
                totalMessages,
                recentConversations
            },
            risk = new
            {
                totalRiskRecords,
                averageRiskScore = Math.Round(avgRiskScore, 1),
                claimCount,
                riskByState
            }
        });
    }

    /// <summary>Test Gemini API connectivity — proves the AI integration works.</summary>
    [HttpGet("gemini")]
    public async Task<IActionResult> TestGemini()
    {
        try
        {
            var response = await _geminiService.GenerateContentAsync(
                "Respond with exactly: 'Stewart AI is online and ready.' Nothing else.");

            return Ok(new
            {
                status = "connected",
                geminiResponse = response.Trim(),
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini connectivity test failed");
            return StatusCode(503, new
            {
                status = "disconnected",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>Test embedding API connectivity.</summary>
    [HttpGet("embedding")]
    public async Task<IActionResult> TestEmbedding()
    {
        try
        {
            var embedding = await _geminiService.GenerateEmbeddingAsync("test embedding for title insurance");

            return Ok(new
            {
                status = "connected",
                dimensions = embedding.Length,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Embedding API connectivity test failed");
            return StatusCode(503, new
            {
                status = "disconnected",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
