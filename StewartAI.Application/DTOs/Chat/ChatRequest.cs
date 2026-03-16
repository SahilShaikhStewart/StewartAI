namespace StewartAI.Application.DTOs.Chat;

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public Guid? ConversationId { get; set; }
}
