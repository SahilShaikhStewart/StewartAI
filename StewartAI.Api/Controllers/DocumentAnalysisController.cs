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

    /// <summary>
    /// Upload and analyze a title document.
    /// Supports: PDF, TXT, and image files (JPG, PNG, WEBP, TIFF, GIF).
    /// Images and scanned PDFs are processed via Gemini Vision AI (multimodal).
    /// </summary>
    [HttpPost("analyze")]
    [RequestSizeLimit(15 * 1024 * 1024)] // 15MB max (images can be larger than text docs)
    public async Task<IActionResult> AnalyzeDocument(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        var allowedExtensions = new[] { ".pdf", ".txt", ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".gif" };
        if (!allowedExtensions.Any(ext => file.FileName.EndsWith(ext, StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new { error = "Unsupported file type. Supported: PDF, TXT, JPG, PNG, WEBP, TIFF, GIF" });

        var isImage = DocumentAnalysisService.IsImageFile(file.FileName);
        _logger.LogInformation(
            "Analyzing document: {FileName} ({Size} bytes, image={IsImage})",
            file.FileName, file.Length, isImage);

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

    /// <summary>List available demo documents for quick testing.</summary>
    [HttpGet("demo")]
    public IActionResult GetDemoDocuments()
    {
        var demoPath = Path.Combine(AppContext.BaseDirectory, "SeedData", "DemoDocuments");

        if (!Directory.Exists(demoPath))
            return Ok(Array.Empty<object>());

        var files = Directory.GetFiles(demoPath, "*.txt")
            .Select(f => new
            {
                fileName = Path.GetFileName(f),
                displayName = Path.GetFileNameWithoutExtension(f)
                    .Replace("sample-", "")
                    .Replace("-", " ")
                    .ToUpperInvariant(),
                sizeBytes = new FileInfo(f).Length
            })
            .ToArray();

        return Ok(files);
    }

    /// <summary>Analyze a built-in demo document by filename.</summary>
    [HttpPost("demo/analyze/{fileName}")]
    public async Task<IActionResult> AnalyzeDemoDocument(string fileName)
    {
        var demoPath = Path.Combine(AppContext.BaseDirectory, "SeedData", "DemoDocuments", fileName);

        if (!System.IO.File.Exists(demoPath))
            return NotFound(new { error = $"Demo document '{fileName}' not found" });

        _logger.LogInformation("Analyzing demo document: {FileName}", fileName);

        await using var stream = System.IO.File.OpenRead(demoPath);
        var result = await _documentService.AnalyzeDocumentAsync(stream, fileName);

        return Ok(result);
    }
}
