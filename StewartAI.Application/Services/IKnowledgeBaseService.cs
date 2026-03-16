namespace StewartAI.Application.Services;

public interface IKnowledgeBaseService
{
    Task IngestDocumentAsync(Stream documentStream, string fileName);
    Task<List<KnowledgeSearchResult>> SearchAsync(string query, int topK = 5);
    Task<int> GetChunkCountAsync();
    Task<KnowledgeSeedResult> SeedKnowledgeBaseAsync(string seedDataPath);
}

public class KnowledgeSearchResult
{
    public string DocumentName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public double Score { get; set; }
}

public class KnowledgeSeedResult
{
    public int FilesProcessed { get; set; }
    public int FilesSkipped { get; set; }
    public int TotalChunks { get; set; }
    public List<string> ProcessedFiles { get; set; } = [];
    public List<string> SkippedFiles { get; set; } = [];
    public List<string> Errors { get; set; } = [];
}
