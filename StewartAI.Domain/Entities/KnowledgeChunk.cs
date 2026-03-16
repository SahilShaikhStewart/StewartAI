using System.ComponentModel.DataAnnotations;

namespace StewartAI.Domain.Entities;

/// <summary>
/// A chunk of text from a knowledge base document, with its embedding for vector search.
/// </summary>
public class KnowledgeChunk
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DocumentName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int ChunkIndex { get; set; }

    /// <summary>Embedding vector stored as JSON array of floats (simple approach for SQLite).</summary>
    public string EmbeddingJson { get; set; } = "[]";

    public DateTime IngestedAt { get; set; } = DateTime.UtcNow;
}
