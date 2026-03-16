using StewartAI.Api;
using StewartAI.Api.Middleware;
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
app.MapControllers();
app.MapHealthChecks("/health");

// ─── Startup Info ───────────────────────────────────────────────────────────
app.Logger.LogInformation("Stewart AI Platform starting...");
app.Logger.LogInformation("Swagger UI: http://localhost:{Port}/swagger",
    builder.Configuration["ASPNETCORE_URLS"]?.Split(':').LastOrDefault()?.TrimEnd('/') ?? "5000");

app.Run();
