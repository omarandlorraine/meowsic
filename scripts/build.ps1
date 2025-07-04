# Save current directory
$originalLocation = Get-Location

# Set up paths
$projectRoot = (Resolve-Path "$PSScriptRoot/..").Path
$backendPath = Join-Path $projectRoot "backend"
$releasePath = Join-Path $projectRoot "release"
$binPath = Join-Path $projectRoot "bin"
$exeName = "meowsic.exe"

# Run build
Set-Location $projectRoot
pnpm build

# Get version from Cargo.toml
$versionLine = Select-String -Path "$backendPath/Cargo.toml" -Pattern '^version\s*=\s*".+"'
if ($versionLine -match '"(.+)"') {
    $version = $Matches[1]
}
else {
    Write-Error "Version not found in Cargo.toml"
    exit 1
}

# Paths
$compiledBinary = Join-Path "$backendPath/target/release" $exeName
$releaseBinary = Join-Path $releasePath "meowsic-$version.exe"
$latestBinary = Join-Path $binPath $exeName

# Ensure output directories exist
New-Item -ItemType Directory -Force -Path $releasePath, $binPath | Out-Null

# Copy the binary
Copy-Item -Force -Path $compiledBinary -Destination $releaseBinary
Copy-Item -Force -Path $compiledBinary -Destination $latestBinary

# Restore original location
Set-Location $originalLocation
Write-Host "Build complete: $releaseBinary and $latestBinary created."
