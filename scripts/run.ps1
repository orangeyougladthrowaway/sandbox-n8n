param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Command
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Ensure-NodeOnPath {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        return
    }
    $nodeDir = 'C:\Program Files\nodejs'
    if (Test-Path (Join-Path $nodeDir 'npm.cmd')) {
        $env:PATH = "$nodeDir;$env:PATH"
        return
    }
    throw 'npm not found. Install Node.js or add it to PATH.'
}

function Ensure-NpmGlobalOnPath {
    $npmBin = Join-Path $env:APPDATA 'npm'
    if ((Test-Path $npmBin) -and ($env:PATH -notlike "*$npmBin*")) {
        $env:PATH = "$npmBin;$env:PATH"
    }
}

function Ensure-NpmInstall {
    if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
        Write-Host 'Running npm install...'
        npm install
    }
}

function Get-RepoRoot {
    return $RepoRoot
}

function Get-DataRoot {
    if ($env:N8N_DATA_ROOT) { return $env:N8N_DATA_ROOT }
    return 'C:\sandbox-dir\sandbox-n8n'
}

function Set-SandboxEnv {
    $env:N8N_REPO_ROOT = Get-RepoRoot
    $env:N8N_DATA_ROOT = Get-DataRoot
    $env:MOCK_API_BASE_URL = if ($env:MOCK_API_BASE_URL) { $env:MOCK_API_BASE_URL } else { 'http://localhost:3099' }
}

function Enable-MockApiIfRunning {
    try {
        Invoke-RestMethod -Uri "$($env:MOCK_API_BASE_URL)/health" -TimeoutSec 2 | Out-Null
        $env:N8N_MOCK_API_ENABLED = '1'
        Write-Host 'Mock API detected — HTTP integrations enabled for this session.'
    } catch {
        Remove-Item Env:N8N_MOCK_API_ENABLED -ErrorAction SilentlyContinue
        Write-Host 'Mock API not running — using in-process simulators only (run mock-api in another terminal for HTTP demo).'
    }
}

switch ($Command.ToLower()) {
    'test' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        npm test
    }
    'smoke-complaints' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        Set-SandboxEnv
        & node (Join-Path $PSScriptRoot 'smoke-complaints.js')
    }
    'smoke-servicedesk' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        Set-SandboxEnv
        & node (Join-Path $PSScriptRoot 'smoke-servicedesk.js')
    }
    'smoke-daily-checks' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        Set-SandboxEnv
        & node (Join-Path $PSScriptRoot 'smoke-daily-checks.js')
    }
    'smoke-daily-ops' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        Set-SandboxEnv
        & node (Join-Path $PSScriptRoot 'smoke-daily-ops.js')
    }
    'process-complaints' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        Set-SandboxEnv
        & node (Join-Path $PSScriptRoot 'process-complaints.js')
    }
    'process-servicedesk' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        Set-SandboxEnv
        & node (Join-Path $PSScriptRoot 'process-servicedesk.js')
    }
    'mock-api' {
        Ensure-NodeOnPath
        Set-SandboxEnv
        $env:N8N_MOCK_API_ENABLED = '1'
        Write-Host "Mock API: $($env:MOCK_API_BASE_URL) (localhost only, Ctrl+C to stop)"
        & node (Join-Path $RepoRoot 'sandbox-services\server.js')
    }
    'import-workflows' {
        Ensure-NodeOnPath
        Ensure-NpmGlobalOnPath
        if (-not (Get-Command n8n -ErrorAction SilentlyContinue)) {
            throw 'n8n CLI not found. Install: npm install -g n8n@1.80.0'
        }
        Get-ChildItem -Path (Join-Path $RepoRoot 'workflows') -Filter '*.json' -Recurse | ForEach-Object {
            Write-Host "Import: $($_.FullName)"
            n8n import:workflow --input=$($_.FullName)
        }
        Write-Host 'Workflows imported into local n8n.'
    }
    'n8n' {
        Ensure-NodeOnPath
        Ensure-NpmGlobalOnPath
        Set-SandboxEnv
        Enable-MockApiIfRunning
        if (-not (Get-Command n8n -ErrorAction SilentlyContinue)) {
            throw 'n8n CLI not found. Install: npm install -g n8n@1.80.0'
        }
        Write-Host "N8N_REPO_ROOT=$($env:N8N_REPO_ROOT)"
        Write-Host "N8N_DATA_ROOT=$($env:N8N_DATA_ROOT)"
        Write-Host 'n8n UI: http://localhost:5678'
        n8n
    }
    'demo' {
        Ensure-NodeOnPath
        Ensure-NpmInstall
        Set-SandboxEnv
        Write-Host '=== Complaints smoke ==='
        & node (Join-Path $PSScriptRoot 'smoke-complaints.js')
        Write-Host '=== Service desk smoke ==='
        & node (Join-Path $PSScriptRoot 'smoke-servicedesk.js')
        Write-Host '=== Daily checks smoke ==='
        & node (Join-Path $PSScriptRoot 'smoke-daily-checks.js')
        Write-Host '=== Daily ops smoke ==='
        & node (Join-Path $PSScriptRoot 'smoke-daily-ops.js')
        Write-Host ''
        Write-Host 'Demo complete (no containers).'
        Write-Host '  Terminal 1: .\scripts\run.ps1 mock-api'
        Write-Host '  Terminal 2: .\scripts\run.ps1 n8n'
        Write-Host '  Import once: .\scripts\run.ps1 import-workflows'
    }
    default {
        Write-Error @"
Unknown command: $Command
Use: test, demo, smoke-complaints, smoke-servicedesk, smoke-daily-checks, smoke-daily-ops,
     process-complaints, process-servicedesk, mock-api, import-workflows, n8n
"@
    }
}
