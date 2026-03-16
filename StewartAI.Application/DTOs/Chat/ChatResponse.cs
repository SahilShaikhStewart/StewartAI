namespace StewartAI.Application.DTOs.Chat;

public class ChatResponse
{
    public Guid ConversationId { get; set; }
    public string Answer { get; set; } = string.Empty;
    public List<SourceCitation> Sources { get; set; } = [];
    public DateTime Timestamp { get; set; }
}

public class SourceCitation
{
    public string DocumentName { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public double RelevanceScore { get; set; }
}

public class ConversationHistoryResponse
{
    public Guid ConversationId { get; set; }
    public List<ChatMessage> Messages { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class ChatMessage
{
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
