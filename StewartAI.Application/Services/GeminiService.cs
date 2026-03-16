using System.Net;
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
    private const int MaxRetries = 3;

    public GeminiService(HttpClient httpClient, IConfiguration config, ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["GCP:ApiKey"] ?? throw new InvalidOperationException("GCP:ApiKey is not configured");
        _model = config["GCP:Model"] ?? "gemini-2.5-flash";
        _embeddingModel = config["GCP:EmbeddingModel"] ?? "gemini-embedding-001";
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

        var response = await SendWithRetryAsync(url, requestBody);

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

    /// <summary>
    /// Sends an image/document to Gemini's multimodal vision API.
    /// Uses the inlineData format with base64-encoded bytes.
    /// Supports: JPEG, PNG, WEBP, TIFF, GIF, and PDF (scanned/handwritten).
    /// </summary>
    public async Task<string> GenerateContentFromImageAsync(
        byte[] fileBytes,
        string mimeType,
        string prompt,
        double temperature = 0.3,
        string? responseMimeType = null)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

        var base64Data = Convert.ToBase64String(fileBytes);

        _logger.LogInformation(
            "Calling Gemini Vision API: {MimeType}, {SizeKB}KB, model={Model}",
            mimeType, fileBytes.Length / 1024, _model);

        // Gemini multimodal request: parts array with both inlineData (image) and text (prompt)
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new
                        {
                            inlineData = new
                            {
                                mimeType,
                                data = base64Data
                            }
                        },
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature,
                maxOutputTokens = 8192,
                responseMimeType = responseMimeType ?? "text/plain"
            }
        };

        var response = await SendWithRetryAsync(url, requestBody);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Gemini Vision API error: {StatusCode} - {Body}", response.StatusCode, errorBody);
            throw new HttpRequestException($"Gemini Vision API returned {response.StatusCode}: {errorBody}");
        }

        var result = await response.Content.ReadFromJsonAsync<GeminiResponse>();

        if (result?.Candidates is null || result.Candidates.Length == 0)
        {
            _logger.LogWarning("Gemini Vision returned no candidates");
            return string.Empty;
        }

        var text = result.Candidates[0].Content.Parts.FirstOrDefault()?.Text ?? string.Empty;
        _logger.LogInformation("Gemini Vision response length: {Length} chars", text.Length);

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

        var response = await SendWithRetryAsync(url, requestBody);

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

    /// <summary>
    /// Sends an HTTP POST with automatic retry on 429 (TooManyRequests) responses.
    /// Uses exponential backoff: 5s, 15s, 30s between retries.
    /// </summary>
    private async Task<HttpResponseMessage> SendWithRetryAsync(string url, object requestBody)
    {
        int[] delaySeconds = [5, 15, 30];

        for (var attempt = 0; attempt <= MaxRetries; attempt++)
        {
            var response = await _httpClient.PostAsJsonAsync(url, requestBody);

            if (response.StatusCode != HttpStatusCode.TooManyRequests || attempt == MaxRetries)
                return response;

            var delay = delaySeconds[attempt];
            _logger.LogWarning(
                "Gemini API rate limited (429). Retry {Attempt}/{MaxRetries} after {Delay}s delay",
                attempt + 1, MaxRetries, delay);

            await Task.Delay(TimeSpan.FromSeconds(delay));
        }

        // Should never reach here, but just in case
        throw new HttpRequestException("Gemini API rate limit exceeded after all retries");
    }
}
