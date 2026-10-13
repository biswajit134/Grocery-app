# Install GroceryHub Root CA to Windows Current User Trusted Root store
$CertPath = Join-Path $PSScriptRoot "groceryhub-root-ca.crt"

if (-not (Test-Path $CertPath)) {
    Write-Error "Certificate file not found at: $CertPath"
    exit 1
}

Write-Host "Installing GroceryHub Root CA into Windows Trusted Root store..." -ForegroundColor Cyan
Write-Host "A Windows confirmation prompt may appear on your screen. Click 'Yes' to accept." -ForegroundColor Yellow

certutil -user -addstore Root $CertPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccessfully installed GroceryHub Local Root CA!" -ForegroundColor Green
    Write-Host "Please restart or refresh your browser (Chrome/Edge) to see the secure lock." -ForegroundColor Green
} else {
    Write-Warning "Installation returned code $LASTEXITCODE. Try running the script as Administrator or install manually via GUI."
}
