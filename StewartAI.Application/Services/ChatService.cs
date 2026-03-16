using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StewartAI.Application.DTOs.Chat;
using StewartAI.Domain.Entities;
using StewartAI.Infrastructure.Persistence;

namespace StewartAI.Application.Services;

public class ChatService : IChatService
{
    private readonly IGeminiService _geminiService;
    private readonly IKnowledgeBaseService _knowledgeBaseService;
    private readonly AppDbContext _db;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        IGeminiService geminiService,
        IKnowledgeBaseService knowledgeBaseService,
        AppDbContext db,
        ILogger<ChatService> logger)
    {
        _geminiService = geminiService;
        _knowledgeBaseService = knowledgeBaseService;
        _db = db;
        _logger = logger;
    }

    public async Task<ChatResponse> AskAsync(ChatRequest request)
    {
        // Step 1: Get or create conversation
        Conversation conversation;
        if (request.ConversationId.HasValue)
        {
            conversation = await _db.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value)
                ?? new Conversation();
        }
        else
        {
            conversation = new Conversation();
            _db.Conversations.Add(conversation);
        }

        // Step 2: Store user message
        var userMessage = new ConversationMessage
        {
            ConversationId = conversation.Id,
            Role = "user",
            Content = request.Message
        };
        _db.ConversationMessages.Add(userMessage);

        // Step 3: Retrieve relevant knowledge base chunks (RAG)
        var relevantChunks = await _knowledgeBaseService.SearchAsync(request.Message, topK: 5);
        _logger.LogInformation("Found {Count} relevant knowledge chunks for query", relevantChunks.Count);

        // Step 4: Build prompt with context
        var contextText = string.Join("\n\n---\n\n", relevantChunks.Select(c =>
            $"Source: {c.DocumentName}\n{c.Content}"));

        // Include recent conversation history for context
        var recentMessages = conversation.Messages
            .OrderByDescending(m => m.Timestamp)
            .Take(6)
            .OrderBy(m => m.Timestamp)
            .Select(m => $"{m.Role}: {m.Content}")
            .ToList();

        var conversationContext = recentMessages.Count > 0
            ? "Previous conversation:\n" + string.Join("\n", recentMessages) + "\n\n"
            : "";

        var prompt = $"""
            You are Stewart AI, an expert knowledge assistant for Stewart Title — a major US title insurance company.
            Answer questions about title insurance, real estate closings, escrow, underwriting, compliance, and related topics.

            {conversationContext}RELEVANT KNOWLEDGE BASE CONTEXT:
            {contextText}

            USER QUESTION: {request.Message}

            Instructions:
            - Answer based on the provided context when available
            - If the context doesn't contain relevant information, use your general knowledge about title insurance
            - Be accurate, professional, and helpful
            - Cite sources when using information from the knowledge base context
            - If you're unsure about something, say so rather than guessing
            - Keep answers concise but thorough
            """;

        var answer = await _geminiService.GenerateContentAsync(prompt, temperature: 0.5);

        // Step 5: Build source citations
        var sources = relevantChunks.Select(c => new SourceCitation
        {
            DocumentName = c.DocumentName,
            Excerpt = c.Content.Length > 200 ? c.Content[..200] + "..." : c.Content,
            RelevanceScore = c.Score
        }).ToList();

        // Step 6: Store assistant message
        var assistantMessage = new ConversationMessage
        {
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = answer,
            SourcesJson = JsonSerializer.Serialize(sources)
        };
        _db.ConversationMessages.Add(assistantMessage);
        await _db.SaveChangesAsync();

        return new ChatResponse
        {
            ConversationId = conversation.Id,
            Answer = answer,
            Sources = sources,
            Timestamp = DateTime.UtcNow
        };
    }

    public async Task<List<ConversationHistoryResponse>> GetConversationHistoryAsync()
    {
        var conversations = await _db.Conversations
            .Include(c => c.Messages)
            .OrderByDescending(c => c.CreatedAt)
            .Take(20)
            .ToListAsync();

        return conversations.Select(c => new ConversationHistoryResponse
        {
            ConversationId = c.Id,
            CreatedAt = c.CreatedAt,
            Messages = c.Messages.OrderBy(m => m.Timestamp).Select(m => new ChatMessage
            {
                Role = m.Role,
                Content = m.Content,
                Timestamp = m.Timestamp
            }).ToList()
        }).ToList();
    }

    public async Task<ConversationHistoryResponse?> GetConversationAsync(Guid conversationId)
    {
        var conversation = await _db.Conversations
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation is null) return null;

        return new ConversationHistoryResponse
        {
            ConversationId = conversation.Id,
            CreatedAt = conversation.CreatedAt,
            Messages = conversation.Messages.OrderBy(m => m.Timestamp).Select(m => new ChatMessage
            {
                Role = m.Role,
                Content = m.Content,
                Timestamp = m.Timestamp
            }).ToList()
        };
    }
}
