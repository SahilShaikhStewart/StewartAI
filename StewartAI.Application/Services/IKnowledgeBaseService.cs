namespace StewartAI.Application.Services;

public interface IKnowledgeBaseService
{
    Task IngestDocumentAsync(Stream documentStream, string fileName);
    Task<List<KnowledgeSearchResult>> SearchAsync(string query, int topK = 5);
    Task<int> GetChunkCountAsync();
}

public class KnowledgeSearchResult
{
    public string DocumentName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public double Score { get; set; }
}
