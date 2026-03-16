namespace StewartAI.Application.Services;

public interface IGeminiService
{
    /// <summary>Send a prompt to Gemini and get a text response.</summary>
    Task<string> GenerateContentAsync(string prompt, double temperature = 0.7, string? responseMimeType = null);

    /// <summary>
    /// Send an image (or scanned PDF) to Gemini's multimodal vision API along with a text prompt.
    /// Gemini 2.5 Flash natively processes images, handwritten text, photos of documents, etc.
    /// </summary>
    Task<string> GenerateContentFromImageAsync(byte[] fileBytes, string mimeType, string prompt, double temperature = 0.3, string? responseMimeType = null);

    /// <summary>Generate an embedding vector for the given text (for RAG vector search).</summary>
    Task<float[]> GenerateEmbeddingAsync(string text);
}
