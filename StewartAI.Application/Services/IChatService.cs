using StewartAI.Application.DTOs.Chat;

namespace StewartAI.Application.Services;

public interface IChatService
{
    Task<ChatResponse> AskAsync(ChatRequest request);
    Task<List<ConversationHistoryResponse>> GetConversationHistoryAsync();
    Task<ConversationHistoryResponse?> GetConversationAsync(Guid conversationId);
}
