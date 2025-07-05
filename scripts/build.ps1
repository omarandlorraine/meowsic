# Save current directory
$originalLocation = Get-Location

# Set up paths
$rootPath = (Resolve-Path "$PSScriptRoot/..").Path
$backendPath = Join-Path $rootPath "backend"
$releasePath = Join-Path $rootPath "release"
$binPath = Join-Path $rootPath "bin"

# Run build
Set-Location $rootPath
pnpm build

# Read name and version from Cargo.toml
$cargoTomlPath = Join-Path $backendPath "Cargo.toml"
$nameLine = Select-String -Path $cargoTomlPath -Pattern '^\s*name\s*=\s*".+"'
$versionLine = Select-String -Path $cargoTomlPath -Pattern '^\s*version\s*=\s*".+"'

if ($nameLine -match '"([^"]+)"') {
    $appName = $Matches[1]
}
else {
    Write-Error "Package name not found in Cargo.toml"
    exit 1
}

if ($versionLine -match '"([^"]+)"') {
    $version = $Matches[1]
}
else {
    Write-Error "Version not found in Cargo.toml"
    exit 1
}

$exeName = "$appName.exe"

# Paths
$compiledBinary = Join-Path "$backendPath/target/release" $exeName
$releaseBinary = Join-Path $releasePath "$appName-$version.exe"
$latestBinary = Join-Path $binPath $exeName

# Ensure output directories
New-Item -ItemType Directory -Force -Path $releasePath, $binPath | Out-Null

# Copy executables
Copy-Item -Force -Path $compiledBinary -Destination $releaseBinary
Copy-Item -Force -Path $compiledBinary -Destination $latestBinary

# Copy NSIS installer
$nsisSource = Join-Path $backendPath "/target/release/bundle/nsis/${appName}_${version}_x64-setup.exe"
if (Test-Path $nsisSource) {
    Copy-Item -Force -Path $nsisSource -Destination $releasePath
}
else {
    Write-Warning "NSIS installer not found: $nsisSource"
}

# Restore original directory
Set-Location $originalLocation

Write-Host "Build complete: $releaseBinary, $latestBinary, and NSIS installer copied to release folder."
