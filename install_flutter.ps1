$ErrorActionPreference = "Stop"
Write-Host "Downloading Flutter..."
$url = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.3-stable.zip"

# Use the user's home directory instead of C:\ to avoid permission issues
$srcDir = Join-Path $HOME "src"
$dest = Join-Path $srcDir "flutter.zip"
$flutterDir = Join-Path $srcDir "flutter"

if (-not (Test-Path $srcDir)) {
    New-Item -ItemType Directory -Force -Path $srcDir | Out-Null
}

Invoke-WebRequest -Uri $url -OutFile $dest
Write-Host "Extracting Flutter (this might take a few minutes)..."
Expand-Archive -Path $dest -DestinationPath $srcDir -Force
Remove-Item $dest

Write-Host "Adding Flutter to User PATH..."
$flutterBin = Join-Path $flutterDir "bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($userPath -notmatch [regex]::Escape($flutterBin)) {
    $newPath = $userPath + ";" + $flutterBin
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Flutter ($flutterBin) added to PATH."
} else {
    Write-Host "Flutter is already in PATH."
}

Write-Host "Done!"
