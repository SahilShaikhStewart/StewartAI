using System.ComponentModel.DataAnnotations;

namespace StewartAI.Domain.Entities;

public class Conversation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<ConversationMessage> Messages { get; set; } = [];
}

public class ConversationMessage
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public string? SourcesJson { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Conversation Conversation { get; set; } = null!;
}
