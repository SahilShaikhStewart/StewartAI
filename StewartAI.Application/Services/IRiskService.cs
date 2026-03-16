using StewartAI.Application.DTOs.Risk;

namespace StewartAI.Application.Services;

public interface IRiskService
{
    Task<RiskAssessmentResponse> AssessRiskAsync(RiskAssessmentRequest request);
    Task<RiskSummaryResponse> GetSummaryAsync();
    Task<List<StateRiskResponse>> GetRiskByStateAsync();
    Task SeedSyntheticDataAsync();
}
