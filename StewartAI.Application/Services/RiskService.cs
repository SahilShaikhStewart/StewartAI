using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StewartAI.Application.DTOs.Risk;
using StewartAI.Domain.Entities;
using StewartAI.Infrastructure.Persistence;

namespace StewartAI.Application.Services;

public class RiskService : IRiskService
{
    private readonly IGeminiService _geminiService;
    private readonly AppDbContext _db;
    private readonly ILogger<RiskService> _logger;

    public RiskService(IGeminiService geminiService, AppDbContext db, ILogger<RiskService> logger)
    {
        _geminiService = geminiService;
        _db = db;
        _logger = logger;
    }

    public async Task<RiskAssessmentResponse> AssessRiskAsync(RiskAssessmentRequest request)
    {
        var prompt = "You are a title insurance risk analyst at Stewart Title.\n" +
            "Assess the title insurance risk for the following property transaction:\n\n" +
            $"State: {request.State}\n" +
            $"County: {request.County}\n" +
            $"Property Type: {request.PropertyType}\n" +
            $"Transaction Type: {request.TransactionType}\n" +
            $"Purchase Price: ${request.PurchasePrice:N0}\n" +
            $"Loan Amount: ${request.LoanAmount:N0}\n" +
            $"Additional Context: {request.AdditionalContext ?? "None"}\n\n" +
            """
            Provide your assessment as a JSON object:
            {
                "overallRisk": "Low, Medium, or High",
                "riskScore": 0-100 numeric score,
                "summary": "2-3 sentence risk summary",
                "riskFactors": [
                    {
                        "category": "category name (e.g., Geographic, Transaction, Market, Legal)",
                        "description": "description of the risk factor",
                        "impact": "Low, Medium, or High"
                    }
                ],
                "recommendations": ["recommendation 1", "recommendation 2"]
            }
            """;

        var aiResponse = await _geminiService.GenerateContentAsync(prompt, temperature: 0.3, responseMimeType: "application/json");

        try
        {
            var json = aiResponse.Trim();
            if (json.StartsWith("```json")) json = json[7..];
            if (json.StartsWith("```")) json = json[3..];
            if (json.EndsWith("```")) json = json[..^3];
            json = json.Trim();

            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            var response = new RiskAssessmentResponse
            {
                OverallRisk = root.GetProperty("overallRisk").GetString() ?? "Unknown",
                RiskScore = root.GetProperty("riskScore").GetDouble(),
                Summary = root.GetProperty("summary").GetString() ?? string.Empty,
                AssessedAt = DateTime.UtcNow,
                RiskFactors = [],
                Recommendations = []
            };

            if (root.TryGetProperty("riskFactors", out var factors))
            {
                foreach (var f in factors.EnumerateArray())
                {
                    response.RiskFactors.Add(new RiskFactor
                    {
                        Category = f.GetProperty("category").GetString() ?? string.Empty,
                        Description = f.GetProperty("description").GetString() ?? string.Empty,
                        Impact = f.GetProperty("impact").GetString() ?? string.Empty
                    });
                }
            }

            if (root.TryGetProperty("recommendations", out var recs))
            {
                foreach (var r in recs.EnumerateArray())
                {
                    response.Recommendations.Add(r.GetString() ?? string.Empty);
                }
            }

            return response;
        }
        catch
        {
            return new RiskAssessmentResponse
            {
                OverallRisk = "Unknown",
                RiskScore = 50,
                Summary = "Risk assessment completed but response parsing failed.",
                AssessedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<RiskSummaryResponse> GetSummaryAsync()
    {
        var records = await _db.RiskRecords.ToListAsync();

        if (records.Count == 0)
            return new RiskSummaryResponse();

        return new RiskSummaryResponse
        {
            TotalRecords = records.Count,
            AverageRiskScore = records.Average(r => r.RiskScore),
            HighRiskCount = records.Count(r => r.RiskScore >= 70),
            MediumRiskCount = records.Count(r => r.RiskScore >= 40 && r.RiskScore < 70),
            LowRiskCount = records.Count(r => r.RiskScore < 40),
            ClaimCount = records.Count(r => r.HasClaim),
            ClaimRate = records.Count > 0 ? (double)records.Count(r => r.HasClaim) / records.Count * 100 : 0
        };
    }

    public async Task<List<StateRiskResponse>> GetRiskByStateAsync()
    {
        var records = await _db.RiskRecords.ToListAsync();

        return records
            .GroupBy(r => new { r.State, r.StateCode })
            .Select(g => new StateRiskResponse
            {
                State = g.Key.State,
                StateCode = g.Key.StateCode,
                RiskScore = g.Average(r => r.RiskScore),
                TotalFiles = g.Count(),
                ClaimCount = g.Count(r => r.HasClaim),
                ClaimRate = g.Count() > 0 ? (double)g.Count(r => r.HasClaim) / g.Count() * 100 : 0
            })
            .OrderByDescending(s => s.RiskScore)
            .ToList();
    }

    public async Task SeedSyntheticDataAsync()
    {
        if (await _db.RiskRecords.AnyAsync())
        {
            _logger.LogInformation("Risk records already seeded, skipping");
            return;
        }

        _logger.LogInformation("Seeding synthetic risk data...");

        var random = new Random(42); // Fixed seed for reproducibility
        var states = new (string Name, string Code, double BaseRisk)[]
        {
            ("Texas", "TX", 35), ("California", "CA", 55), ("Florida", "FL", 60),
            ("New York", "NY", 50), ("Pennsylvania", "PA", 30), ("Illinois", "IL", 45),
            ("Ohio", "OH", 25), ("Georgia", "GA", 40), ("North Carolina", "NC", 30),
            ("Michigan", "MI", 35), ("New Jersey", "NJ", 45), ("Virginia", "VA", 28),
            ("Washington", "WA", 38), ("Arizona", "AZ", 42), ("Massachusetts", "MA", 33),
            ("Tennessee", "TN", 32), ("Indiana", "IN", 27), ("Missouri", "MO", 30),
            ("Maryland", "MD", 36), ("Colorado", "CO", 34), ("Minnesota", "MN", 22),
            ("South Carolina", "SC", 38), ("Alabama", "AL", 40), ("Louisiana", "LA", 55),
            ("Kentucky", "KY", 33), ("Oregon", "OR", 36), ("Oklahoma", "OK", 30),
            ("Connecticut", "CT", 28), ("Nevada", "NV", 48), ("Mississippi", "MS", 45)
        };

        var propertyTypes = new[] { "Single Family", "Condo", "Townhouse", "Multi-Family", "Commercial", "Vacant Land" };
        var transactionTypes = new[] { "Purchase", "Refinance", "Cash Sale", "Short Sale", "Foreclosure", "New Construction" };
        var claimReasons = new[] { "Unreleased lien", "Boundary dispute", "Forged deed", "Missing heir", "Mechanic's lien", "Tax lien", "Easement issue", "Zoning violation" };

        var records = new List<RiskRecord>();

        for (var i = 0; i < 2000; i++)
        {
            var state = states[random.Next(states.Length)];
            var propertyType = propertyTypes[random.Next(propertyTypes.Length)];
            var transactionType = transactionTypes[random.Next(transactionTypes.Length)];
            var purchasePrice = (decimal)(random.Next(100, 2000) * 1000);
            var loanAmount = purchasePrice * (decimal)(0.5 + random.NextDouble() * 0.4);

            // Risk score influenced by state base risk + transaction type + random variance
            var riskScore = state.BaseRisk
                + (transactionType == "Foreclosure" ? 20 : transactionType == "Short Sale" ? 15 : 0)
                + (propertyType == "Vacant Land" ? 10 : propertyType == "Commercial" ? 8 : 0)
                + (random.NextDouble() * 20 - 10); // ±10 random variance

            riskScore = Math.Clamp(riskScore, 5, 95);

            // Claim probability based on risk score
            var hasClaim = random.NextDouble() < (riskScore / 200.0); // Higher risk = higher claim chance

            records.Add(new RiskRecord
            {
                State = state.Name,
                StateCode = state.Code,
                County = $"{state.Name} County {random.Next(1, 20)}",
                PropertyType = propertyType,
                TransactionType = transactionType,
                PurchasePrice = purchasePrice,
                LoanAmount = Math.Round(loanAmount, 2),
                RiskScore = Math.Round(riskScore, 1),
                HasClaim = hasClaim,
                ClaimReason = hasClaim ? claimReasons[random.Next(claimReasons.Length)] : null
            });
        }

        _db.RiskRecords.AddRange(records);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Seeded {Count} synthetic risk records", records.Count);
    }
}
