using Microsoft.AspNetCore.Mvc;
using StewartAI.Application.DTOs.Risk;
using StewartAI.Application.Services;

namespace StewartAI.Api.Controllers;

[ApiController]
[Route("api/risk")]
public class RiskController : ControllerBase
{
    private readonly IRiskService _riskService;
    private readonly ILogger<RiskController> _logger;

    public RiskController(IRiskService riskService, ILogger<RiskController> logger)
    {
        _riskService = riskService;
        _logger = logger;
    }

    /// <summary>Assess title insurance risk for a given property transaction using AI.</summary>
    [HttpPost("assess")]
    public async Task<IActionResult> AssessRisk([FromBody] RiskAssessmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.State))
            return BadRequest(new { error = "State is required" });

        _logger.LogInformation("Risk assessment for {State}, {TransactionType}", request.State, request.TransactionType);

        var result = await _riskService.AssessRiskAsync(request);
        return Ok(result);
    }

    /// <summary>Get aggregated risk summary from synthetic data.</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _riskService.GetSummaryAsync();
        return Ok(summary);
    }

    /// <summary>Get risk scores grouped by state (for heatmap).</summary>
    [HttpGet("by-state")]
    public async Task<IActionResult> GetRiskByState()
    {
        var stateRisks = await _riskService.GetRiskByStateAsync();
        return Ok(stateRisks);
    }

    /// <summary>Seed synthetic risk data (call once to populate dashboard).</summary>
    [HttpPost("seed")]
    public async Task<IActionResult> SeedData()
    {
        await _riskService.SeedSyntheticDataAsync();
        return Ok(new { message = "Synthetic risk data seeded successfully" });
    }
}
