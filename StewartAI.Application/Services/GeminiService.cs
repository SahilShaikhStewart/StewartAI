using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StewartAI.Domain.Models.Gemini;

namespace StewartAI.Application.Services;

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiService> _logger;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly string _embeddingModel;

    public GeminiService(HttpClient httpClient, IConfiguration config, ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["GCP:ApiKey"] ?? throw new InvalidOperationException("GCP:ApiKey is not configured");
        _model = config["GCP:Model"] ?? "gemini-1.5-flash";
        _embeddingModel = config["GCP:EmbeddingModel"] ?? "text-embedding-004";
    }

    public async Task<string> GenerateContentAsync(string prompt, double temperature = 0.7, string? responseMimeType = null)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[] { new { text = prompt } }
                }
            },
            generationConfig = new
            {
                temperature,
                maxOutputTokens = 8192,
                responseMimeType = responseMimeType ?? "text/plain"
            }
        };

        _logger.LogDebug("Calling Gemini API with model {Model}, prompt length: {Length}", _model, prompt.Length);

        var response = await _httpClient.PostAsJsonAsync(url, requestBody);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Gemini API error: {StatusCode} - {Body}", response.StatusCode, errorBody);
            throw new HttpRequestException($"Gemini API returned {response.StatusCode}: {errorBody}");
        }

        var result = await response.Content.ReadFromJsonAsync<GeminiResponse>();

        if (result?.Candidates is null || result.Candidates.Length == 0)
        {
            _logger.LogWarning("Gemini returned no candidates");
            return string.Empty;
        }

        var text = result.Candidates[0].Content.Parts.FirstOrDefault()?.Text ?? string.Empty;
        _logger.LogDebug("Gemini response length: {Length}", text.Length);

        return text;
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_embeddingModel}:embedContent?key={_apiKey}";

        var requestBody = new
        {
            model = $"models/{_embeddingModel}",
            content = new
            {
                parts = new[] { new { text } }
            }
        };

        _logger.LogDebug("Generating embedding for text length: {Length}", text.Length);

        var response = await _httpClient.PostAsJsonAsync(url, requestBody);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Embedding API error: {StatusCode} - {Body}", response.StatusCode, errorBody);
            throw new HttpRequestException($"Embedding API returned {response.StatusCode}: {errorBody}");
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        var values = result.GetProperty("embedding").GetProperty("values");

        var embedding = new float[values.GetArrayLength()];
        var index = 0;
        foreach (var val in values.EnumerateArray())
        {
            embedding[index++] = val.GetSingle();
        }

        _logger.LogDebug("Generated embedding with {Dimensions} dimensions", embedding.Length);
        return embedding;
    }
}
