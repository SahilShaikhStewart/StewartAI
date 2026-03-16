namespace StewartAI.Application.DTOs.Risk;

public class RiskAssessmentRequest
{
    public string State { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public decimal PurchasePrice { get; set; }
    public decimal LoanAmount { get; set; }
    public string? AdditionalContext { get; set; }
}

public class RiskAssessmentResponse
{
    public string OverallRisk { get; set; } = string.Empty; // Low, Medium, High
    public double RiskScore { get; set; } // 0-100
    public string Summary { get; set; } = string.Empty;
    public List<RiskFactor> RiskFactors { get; set; } = [];
    public List<string> Recommendations { get; set; } = [];
    public DateTime AssessedAt { get; set; }
}

public class RiskFactor
{
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Impact { get; set; } = string.Empty; // Low, Medium, High
}

public class RiskSummaryResponse
{
    public int TotalRecords { get; set; }
    public double AverageRiskScore { get; set; }
    public int HighRiskCount { get; set; }
    public int MediumRiskCount { get; set; }
    public int LowRiskCount { get; set; }
    public int ClaimCount { get; set; }
    public double ClaimRate { get; set; }
}

public class StateRiskResponse
{
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public double RiskScore { get; set; }
    public int TotalFiles { get; set; }
    public int ClaimCount { get; set; }
    public double ClaimRate { get; set; }
}
