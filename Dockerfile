# ═══════════════════════════════════════════════════════════════════════════════
# Stewart Title Intelligence Platform — Combined Dockerfile
# Builds both .NET 9 backend and React frontend into a single container.
# The .NET API serves the React SPA as static files + API endpoints.
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build React Frontend ────────────────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY StewartAI.Web/package.json StewartAI.Web/package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY StewartAI.Web/ ./
RUN npm run build

# ─── Stage 2: Build .NET Backend ─────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build

WORKDIR /src

# Copy solution and project files first for restore caching
COPY StewartAI.sln ./
COPY StewartAI.Api/StewartAI.Api.csproj StewartAI.Api/
COPY StewartAI.Application/StewartAI.Application.csproj StewartAI.Application/
COPY StewartAI.Domain/StewartAI.Domain.csproj StewartAI.Domain/
COPY StewartAI.Infrastructure/StewartAI.Infrastructure.csproj StewartAI.Infrastructure/

RUN dotnet restore

# Copy all source and publish
COPY . .
RUN dotnet publish StewartAI.Api/StewartAI.Api.csproj -c Release -o /app/publish --no-restore

# ─── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime

WORKDIR /app

# Copy published .NET app
COPY --from=backend-build /app/publish .

# Copy React build output into wwwroot (served as static files)
COPY --from=frontend-build /app/frontend/dist ./wwwroot

# Cloud Run uses PORT env variable
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "StewartAI.Api.dll"]
