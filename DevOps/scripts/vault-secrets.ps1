<#
.SYNOPSIS
    Manages HashiCorp Vault secrets for the GroceryHub platform.

.DESCRIPTION
    Interact with Vault KV-v2 secrets engine via REST API. Allows developers
    to view, write, and update secrets that are automatically synced to
    Kubernetes secrets via External Secrets Operator (ESO).

.PARAMETER Action
    Action to perform: 'Get', 'Set', 'List', or 'Status'.

.PARAMETER Path
    Subpath under the 'secret/' KV-v2 engine (e.g., 'grocery/database', 'grocery/backend').

.PARAMETER Data
    Hashtable of key-value pairs to write when Action is 'Set'.

.PARAMETER VaultUrl
    Vault API URL (defaults to http://localhost:31007).

.PARAMETER VaultToken
    Vault authentication token (defaults to 'root').

.EXAMPLE
    # Check Vault status:
    .\vault-secrets.ps1 -Action Status

    # Read backend secrets:
    .\vault-secrets.ps1 -Action Get -Path "grocery/backend"

    # Update or add a secret:
    .\vault-secrets.ps1 -Action Set -Path "grocery/database" -Data @{
        "MONGO_INITDB_ROOT_USERNAME" = "admin"
        "MONGO_INITDB_ROOT_PASSWORD" = "new-secure-password"
    }
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Get", "Set", "List", "Status")]
    [string]$Action,

    [Parameter(Mandatory = $false)]
    [string]$Path = "grocery/backend",

    [Parameter(Mandatory = $false)]
    [hashtable]$Data = @{},

    [Parameter(Mandatory = $false)]
    [string]$VaultUrl = "http://localhost:31007",

    [Parameter(Mandatory = $false)]
    [string]$VaultToken = "root"
)

$headers = @{
    "X-Vault-Token" = $VaultToken
    "Content-Type"  = "application/json"
}

switch ($Action) {
    "Status" {
        Write-Host "[INFO] Querying Vault status at $VaultUrl/v1/sys/health..." -ForegroundColor Cyan
        try {
            $resp = Invoke-RestMethod -Uri "$VaultUrl/v1/sys/health" -Method Get -ErrorAction Stop
            Write-Host "[SUCCESS] Vault is operational!" -ForegroundColor Green
            Write-Host "  Initialized: $($resp.initialized)"
            Write-Host "  Sealed:      $($resp.sealed)"
            Write-Host "  Version:     $($resp.version)"
        } catch {
            Write-Error "Failed to connect to Vault at $VaultUrl: $_"
        }
    }

    "Get" {
        $endpoint = "$VaultUrl/v1/secret/data/$Path"
        Write-Host "[INFO] Fetching secret from $endpoint..." -ForegroundColor Cyan
        try {
            $resp = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Get -ErrorAction Stop
            Write-Host "[SUCCESS] Secrets at 'secret/$Path':" -ForegroundColor Green
            $resp.data.data | Format-List
        } catch {
            Write-Error "Failed to retrieve secret from '$Path': $_"
        }
    }

    "Set" {
        if ($Data.Count -eq 0) {
            Write-Error "Please specify -Data with key-value pairs to write."
            return
        }
        $endpoint = "$VaultUrl/v1/secret/data/$Path"
        $body = @{ data = $Data } | ConvertTo-Json
        Write-Host "[INFO] Writing secrets to $endpoint..." -ForegroundColor Yellow
        try {
            $resp = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Post -Body $body -ErrorAction Stop
            Write-Host "[SUCCESS] Successfully saved secrets to 'secret/$Path' (Version: $($resp.data.version))" -ForegroundColor Green
            Write-Host "[NOTE] External Secrets Operator will automatically synchronize these to Kubernetes Secrets." -ForegroundColor Gray
        } catch {
            Write-Error "Failed to write secret to '$Path': $_"
        }
    }

    "List" {
        $endpoint = "$VaultUrl/v1/secret/metadata/$Path"
        Write-Host "[INFO] Listing secret keys under $endpoint..." -ForegroundColor Cyan
        try {
            $resp = Invoke-RestMethod -Uri "$endpoint?list=true" -Headers $headers -Method Get -ErrorAction Stop
            Write-Host "[SUCCESS] Keys under 'secret/$Path':" -ForegroundColor Green
            $resp.data.keys | ForEach-Object { Write-Host "  - $_" }
        } catch {
            Write-Error "Failed to list keys at '$Path': $_"
        }
    }
}
