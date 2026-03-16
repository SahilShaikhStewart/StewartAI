using StewartAI.Api;
using StewartAI.Api.Middleware;
using StewartAI.Application.Services;
using StewartAI.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ─── Register all services via ServiceRegistration extension ────────────────
builder.Services.AddStewartAIServices(builder.Configuration);

var app = builder.Build();

// ─── Database Migration (auto-create on startup) ────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// ─── Auto-Seed Knowledge Base (background, non-blocking) ────────────────────
_ = Task.Run(async () =>
{
    // Small delay to let the app fully start before seeding
    await Task.Delay(TimeSpan.FromSeconds(3));

    try
    {
        using var scope = app.Services.CreateScope();
        var knowledgeService = scope.ServiceProvider.GetRequiredService<IKnowledgeBaseService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        var seedPath = Path.Combine(AppContext.BaseDirectory, "SeedData", "KnowledgeBase");
        logger.LogInformation("Auto-seeding knowledge base from {Path}", seedPath);

        var result = await knowledgeService.SeedKnowledgeBaseAsync(seedPath);

        logger.LogInformation(
            "Knowledge base auto-seed complete: {Processed} files processed, {Skipped} skipped, {Total} total chunks, {Errors} errors",
            result.FilesProcessed, result.FilesSkipped, result.TotalChunks, result.Errors.Count);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Knowledge base auto-seed failed");
    }
});

// ─── Middleware Pipeline ────────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Stewart AI Platform v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseCors();

// ─── Serve React SPA from wwwroot (production Docker deployment) ────────────
// In production, the React build output is copied to wwwroot/ by the Dockerfile.
// UseDefaultFiles + UseStaticFiles serves index.html and all static assets.
// The fallback route ensures client-side routing works (e.g., /documents, /chat).
app.UseDefaultFiles(); // Serves index.html for /
app.UseStaticFiles();  // Serves JS, CSS, images from wwwroot

app.MapControllers();
app.MapHealthChecks("/health");

// ─── SPA Fallback: Any non-API, non-file route → index.html ────────────────
// This ensures React Router handles client-side routes like /documents, /chat, etc.
app.MapFallbackToFile("index.html");

// ─── Startup Info ───────────────────────────────────────────────────────────
app.Logger.LogInformation("Stewart AI Platform starting...");
app.Logger.LogInformation("Environment: {Env}", app.Environment.EnvironmentName);

if (app.Environment.IsDevelopment())
{
    app.Logger.LogInformation("Swagger UI: http://localhost:5264/swagger");
}

app.Run();
