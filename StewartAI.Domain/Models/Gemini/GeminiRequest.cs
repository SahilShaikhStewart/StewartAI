namespace StewartAI.Domain.Models.Gemini;

public class GeminiRequest
{
    public GeminiContent[] Contents { get; set; } = [];
    public GenerationConfig? GenerationConfig { get; set; }
}

public class GeminiContent
{
    public string Role { get; set; } = "user";
    public GeminiPart[] Parts { get; set; } = [];
}

public class GeminiPart
{
    public string Text { get; set; } = string.Empty;
}

public class GenerationConfig
{
    public double Temperature { get; set; } = 0.7;
    public int MaxOutputTokens { get; set; } = 4096;
    public string? ResponseMimeType { get; set; }
}
