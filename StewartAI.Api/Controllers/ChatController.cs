using Microsoft.AspNetCore.Mvc;
using StewartAI.Application.DTOs.Chat;
using StewartAI.Application.Services;

namespace StewartAI.Api.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IKnowledgeBaseService _knowledgeBaseService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, IKnowledgeBaseService knowledgeBaseService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _knowledgeBaseService = knowledgeBaseService;
        _logger = logger;
    }

    /// <summary>Send a message to the Stewart AI Knowledge Assistant.</summary>
    [HttpPost]
    public async Task<IActionResult> Ask([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { error = "Message is required" });

        _logger.LogInformation("Chat request: {Message}", request.Message[..Math.Min(100, request.Message.Length)]);

        var response = await _chatService.AskAsync(request);
        return Ok(response);
    }

    /// <summary>Get conversation history (list of recent conversations).</summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _chatService.GetConversationHistoryAsync();
        return Ok(history);
    }

    /// <summary>Get a specific conversation by ID.</summary>
    [HttpGet("history/{conversationId:guid}")]
    public async Task<IActionResult> GetConversation(Guid conversationId)
    {
        var conversation = await _chatService.GetConversationAsync(conversationId);
        if (conversation is null)
            return NotFound(new { error = "Conversation not found" });

        return Ok(conversation);
    }

    /// <summary>Ingest a document into the knowledge base for RAG.</summary>
    [HttpPost("knowledge-base/ingest")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> IngestDocument(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        var allowedExtensions = new[] { ".pdf", ".txt" };
        if (!allowedExtensions.Any(ext => file.FileName.EndsWith(ext, StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new { error = "Only PDF and TXT files are supported" });

        _logger.LogInformation("Ingesting knowledge base document: {FileName}", file.FileName);

        using var stream = file.OpenReadStream();
        await _knowledgeBaseService.IngestDocumentAsync(stream, file.FileName);

        var chunkCount = await _knowledgeBaseService.GetChunkCountAsync();
        return Ok(new { message = $"Document '{file.FileName}' ingested successfully", totalChunks = chunkCount });
    }

    /// <summary>Get knowledge base stats.</summary>
    [HttpGet("knowledge-base/stats")]
    public async Task<IActionResult> GetKnowledgeBaseStats()
    {
        var chunkCount = await _knowledgeBaseService.GetChunkCountAsync();
        return Ok(new { totalChunks = chunkCount });
    }
}
