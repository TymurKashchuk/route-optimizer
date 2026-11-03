# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies (optimizes Docker layer caching)
COPY ["RouteWise.Api/RouteWise.Api.csproj", "RouteWise.Api/"]
RUN dotnet restore "RouteWise.Api/RouteWise.Api.csproj"

# Copy source code and publish
COPY ["RouteWise.Api/", "RouteWise.Api/"]
WORKDIR "/src/RouteWise.Api"
RUN dotnet publish "RouteWise.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "RouteWise.Api.dll"]
