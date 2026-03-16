FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["StewartAI.Api/StewartAI.Api.csproj", "StewartAI.Api/"]
COPY ["StewartAI.Application/StewartAI.Application.csproj", "StewartAI.Application/"]
COPY ["StewartAI.Infrastructure/StewartAI.Infrastructure.csproj", "StewartAI.Infrastructure/"]
COPY ["StewartAI.Domain/StewartAI.Domain.csproj", "StewartAI.Domain/"]
RUN dotnet restore "StewartAI.Api/StewartAI.Api.csproj"
COPY . .
WORKDIR "/src/StewartAI.Api"
RUN dotnet build "StewartAI.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StewartAI.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StewartAI.Api.dll"]
