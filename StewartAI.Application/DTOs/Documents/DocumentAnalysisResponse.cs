namespace StewartAI.Application.DTOs.Documents;

public class DocumentAnalysisResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<ExtractedEntity> Entities { get; set; } = [];
    public List<TitleDefect> Defects { get; set; } = [];
    public string RiskExplanation { get; set; } = string.Empty;
    public DateTime AnalyzedAt { get; set; }
}

public class ExtractedEntity
{
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class TitleDefect
{
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string SuggestedAction { get; set; } = string.Empty;
}
