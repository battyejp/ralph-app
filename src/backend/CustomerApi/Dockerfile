# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY CustomerApi.csproj .
RUN dotnet restore

# Copy everything else and build
COPY . .
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5000

# Copy published files from publish stage
COPY --from=publish /app/publish .

# Set environment to listen on port 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "CustomerApi.dll"]
