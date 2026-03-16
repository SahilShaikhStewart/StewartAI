namespace StewartAI.Application.DTOs.Documents;

/// <summary>
/// Request model for document analysis — the file is uploaded via multipart form.
/// </summary>
public class DocumentAnalysisRequest
{
    /// <summary>Optional display name override. If not provided, the original filename is used.</summary>
    public string? DisplayName { get; set; }
}
