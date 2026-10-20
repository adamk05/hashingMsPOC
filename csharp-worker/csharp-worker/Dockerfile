FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /build

COPY *.csproj ./

RUN dotnet restore

COPY . ./

RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/runtime:10.0

WORKDIR /app

COPY --from=build /build/out .

ENTRYPOINT ["dotnet", "csharp-worker.dll"]