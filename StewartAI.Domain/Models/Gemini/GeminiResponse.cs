using System.Text.Json.Serialization;

namespace StewartAI.Domain.Models.Gemini;

public class GeminiResponse
{
    [JsonPropertyName("candidates")]
    public GeminiCandidate[] Candidates { get; set; } = [];
}

public class GeminiCandidate
{
    [JsonPropertyName("content")]
    public GeminiResponseContent Content { get; set; } = new();
}

public class GeminiResponseContent
{
    [JsonPropertyName("parts")]
    public GeminiResponsePart[] Parts { get; set; } = [];

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;
}

public class GeminiResponsePart
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}
