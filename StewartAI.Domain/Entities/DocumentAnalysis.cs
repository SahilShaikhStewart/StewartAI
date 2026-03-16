using System.ComponentModel.DataAnnotations;

namespace StewartAI.Domain.Entities;

public class DocumentAnalysis
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string EntitiesJson { get; set; } = "[]";
    public string DefectsJson { get; set; } = "[]";
    public string RiskExplanation { get; set; } = string.Empty;
    public string ExtractedText { get; set; } = string.Empty;
    public string RawAiResponse { get; set; } = string.Empty;
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}
