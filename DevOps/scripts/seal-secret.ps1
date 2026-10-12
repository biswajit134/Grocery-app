<#
.SYNOPSIS
    Encrypts a Kubernetes Secret into a Bitnami SealedSecret for safe Git storage.

.DESCRIPTION
    Uses kubeseal to encrypt sensitive plaintext values against the cluster's
    SealedSecrets controller public key. The generated manifest is 100% safe
    to commit to Git and deploy with ArgoCD.

.PARAMETER SecretName
    The name of the Kubernetes Secret to generate (e.g., mongodb-secret).

.PARAMETER Namespace
    The target Kubernetes namespace (e.g., grocery-database, grocery-backend).

.PARAMETER Kubeconfig
    Path to the kubeconfig file (defaults to kind-cilium-config).

.EXAMPLE
    # Seal a single key-value:
    .\seal-secret.ps1 -SecretName "my-secret" -Namespace "grocery-backend" -Literals @{ "API_KEY" = "super-secret-value" }

    # Seal from a plaintext YAML file:
    .\seal-secret.ps1 -InputFile "secret.yaml" -OutputFile "sealed-secret.yaml"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$SecretName,

    [Parameter(Mandatory = $false)]
    [string]$Namespace = "default",

    [Parameter(Mandatory = $false)]
    [hashtable]$Literals = @{},

    [Parameter(Mandatory = $false)]
    [string]$InputFile,

    [Parameter(Mandatory = $false)]
    [string]$OutputFile,

    [Parameter(Mandatory = $false)]
    [string]$Kubeconfig = "$PSScriptRoot\..\modules\kind-cluster\kind-cilium-config"
)

# 1. Resolve kubeseal executable
$kubeseal = (Get-Command kubeseal -ErrorAction SilentlyContinue).Source
if (-not $kubeseal) {
    $localBin = "$PSScriptRoot\..\bin\kubeseal.exe"
    if (Test-Path $localBin) {
        $kubeseal = $localBin
    } else {
        Write-Error "kubeseal not found in PATH or in DevOps\bin. Please install kubeseal."
        exit 1
    }
}

Write-Host "[INFO] Using kubeseal: $kubeseal" -ForegroundColor Cyan

# 2. Encrypt from input file
if ($InputFile) {
    if (-not (Test-Path $InputFile)) {
        Write-Error "Input file not found: $InputFile"
        exit 1
    }
    Write-Host "[INFO] Encrypting $InputFile..." -ForegroundColor Yellow
    if ($OutputFile) {
        Get-Content $InputFile | & $kubeseal --kubeconfig $Kubeconfig --controller-namespace kube-system --controller-name sealed-secrets-controller -o yaml | Set-Content $OutputFile
        Write-Host "[SUCCESS] SealedSecret written to $OutputFile" -ForegroundColor Green
    } else {
        Get-Content $InputFile | & $kubeseal --kubeconfig $Kubeconfig --controller-namespace kube-system --controller-name sealed-secrets-controller -o yaml
    }
    return
}

# 3. Encrypt from parameters
if (-not $SecretName) {
    Write-Error "Please specify -SecretName or -InputFile."
    exit 1
}

$stringDataBlock = ""
foreach ($key in $Literals.Keys) {
    $val = $Literals[$key]
    $stringDataBlock += "  $key: `"$val`"`n"
}

$plaintextYaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: $SecretName
  namespace: $Namespace
type: Opaque
stringData:
$stringDataBlock
"@

Write-Host "[INFO] Generating SealedSecret for $Namespace/$SecretName..." -ForegroundColor Yellow

$sealedYaml = $plaintextYaml | & $kubeseal --kubeconfig $Kubeconfig --controller-namespace kube-system --controller-name sealed-secrets-controller -o yaml

if ($OutputFile) {
    $sealedYaml | Set-Content $OutputFile
    Write-Host "[SUCCESS] SealedSecret written to $OutputFile" -ForegroundColor Green
} else {
    Write-Output $sealedYaml
}
