using StewartAI.Application.DTOs.Documents;

namespace StewartAI.Application.Services;

public interface IDocumentAnalysisService
{
    Task<DocumentAnalysisResponse> AnalyzeDocumentAsync(Stream pdfStream, string fileName);
    Task<DocumentAnalysisResponse?> GetAnalysisAsync(Guid id);
    Task<List<DocumentAnalysisResponse>> GetAllAnalysesAsync();
}
