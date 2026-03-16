using System.ComponentModel.DataAnnotations;

namespace StewartAI.Domain.Entities;

/// <summary>
/// Synthetic title insurance risk record for dashboard analytics.
/// </summary>
public class RiskRecord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public decimal PurchasePrice { get; set; }
    public decimal LoanAmount { get; set; }
    public double RiskScore { get; set; }
    public bool HasClaim { get; set; }
    public string? ClaimReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
