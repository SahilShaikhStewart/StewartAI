namespace StewartAI.Application.Services;

public interface IGeminiService
{
    /// <summary>Send a prompt to Gemini and get a text response.</summary>
    Task<string> GenerateContentAsync(string prompt, double temperature = 0.7, string? responseMimeType = null);

    /// <summary>Generate an embedding vector for the given text (for RAG vector search).</summary>
    Task<float[]> GenerateEmbeddingAsync(string text);
}
