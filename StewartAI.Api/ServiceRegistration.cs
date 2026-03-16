using Microsoft.EntityFrameworkCore;
using StewartAI.Application.Services;
using StewartAI.Infrastructure.Persistence;

namespace StewartAI.Api;

public static class ServiceRegistration
{
    /// <summary>
    /// Registers all services required for the Stewart AI Platform API.
    /// </summary>
    /// <param name="services">The service collection to register services with</param>
    /// <param name="configuration">The application configuration</param>
    /// <returns>The service collection for method chaining</returns>
    public static IServiceCollection AddStewartAIServices(this IServiceCollection services, IConfiguration configuration)
    {
        // ─── Database ───────────────────────────────────────────────────────────
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        // ─── HTTP Client for Gemini API ─────────────────────────────────────────
        services.AddHttpClient<IGeminiService, GeminiService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(120); // Gemini can take a while for large prompts
        });

        // ─── Application Services ───────────────────────────────────────────────
        services.AddScoped<IDocumentAnalysisService, DocumentAnalysisService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IKnowledgeBaseService, KnowledgeBaseService>();
        services.AddScoped<IRiskService, RiskService>();

        // ─── Controllers + Swagger ──────────────────────────────────────────────
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        // ─── CORS (for React frontend) ──────────────────────────────────────────
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        // ─── Health Checks ──────────────────────────────────────────────────────
        services.AddHealthChecks()
            .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

        return services;
    }
}
