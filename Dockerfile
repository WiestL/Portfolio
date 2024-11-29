# Base image for runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
EXPOSE 10000

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["ProjectPortfolio.csproj", "."]
RUN dotnet restore "./ProjectPortfolio.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "./ProjectPortfolio.csproj" -c ${BUILD_CONFIGURATION} -o /app/build

# Publish stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ProjectPortfolio.csproj" -c ${BUILD_CONFIGURATION} -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ConnectionStrings__DefaultConnection=${CONNECTION_STRING}
# Bind to the port provided by Render
ENV ASPNETCORE_URLS=http://*:${PORT}
ENTRYPOINT ["dotnet", "ProjectPortfolio.dll"]
