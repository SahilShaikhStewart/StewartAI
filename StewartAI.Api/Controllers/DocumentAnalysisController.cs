using Microsoft.AspNetCore.Mvc;
using StewartAI.Application.Services;

namespace StewartAI.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentAnalysisController : ControllerBase
{
    private readonly IDocumentAnalysisService _documentService;
    private readonly ILogger<DocumentAnalysisController> _logger;

    public DocumentAnalysisController(IDocumentAnalysisService documentService, ILogger<DocumentAnalysisController> logger)
    {
        _documentService = documentService;
        _logger = logger;
    }

    /// <summary>Upload and analyze a title document (PDF).</summary>
    [HttpPost("analyze")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB max
    public async Task<IActionResult> AnalyzeDocument(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only PDF files are supported" });

        _logger.LogInformation("Analyzing document: {FileName} ({Size} bytes)", file.FileName, file.Length);

        using var stream = file.OpenReadStream();
        var result = await _documentService.AnalyzeDocumentAsync(stream, file.FileName);

        return Ok(result);
    }

    /// <summary>Get a specific document analysis by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAnalysis(Guid id)
    {
        var result = await _documentService.GetAnalysisAsync(id);
        if (result is null)
            return NotFound(new { error = "Analysis not found" });

        return Ok(result);
    }

    /// <summary>List all document analyses.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAllAnalyses()
    {
        var results = await _documentService.GetAllAnalysesAsync();
        return Ok(results);
    }
}
