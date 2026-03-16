using Microsoft.AspNetCore.Mvc;
using StewartAI.Application.Services;

namespace StewartAI.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly IGeminiService _geminiService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(IGeminiService geminiService, ILogger<HealthController> logger)
    {
        _geminiService = geminiService;
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
