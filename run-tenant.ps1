# run-tenant.ps1
# Helper script for running the dedicated Tenant Portal (TENANT branch)
# Uses the Codex bundled Node runtime for environments where npm/pnpm are not in PATH.

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundledNode = "C:\Users\bruh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$nextCli = Join-Path $projectRoot "node_modules\next\dist\bin\next"

$TENANT_PORT = 3002
$EXPECTED_BRANCH = "TENANT"

function Get-NodePath {
    if (Test-Path $bundledNode) {
        return $bundledNode
    }
    try {
        $cmd = Get-Command node -ErrorAction Stop
        & $cmd.Source -v *> $null
        return $cmd.Source
    } catch {
        throw "No working Node.js runtime found. Expected bundled at: $bundledNode"
    }
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  LandlordForge — Tenant Portal" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Branch check
$currentBranch = (git branch --show-current).Trim()
if ($currentBranch -ne $EXPECTED_BRANCH) {
    Write-Host "WARNING: You are on branch '$currentBranch' (expected: $EXPECTED_BRANCH)" -ForegroundColor Yellow
    Write-Host "Switching to $EXPECTED_BRANCH for you..." -ForegroundColor Yellow
    git checkout $EXPECTED_BRANCH
}

$nodePath = Get-NodePath
Write-Host "Using Node: $nodePath" -ForegroundColor Green
Write-Host "Branch: $EXPECTED_BRANCH" -ForegroundColor Green
Write-Host "Port: $TENANT_PORT" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $nextCli)) {
    Write-Host "node_modules/next not found." -ForegroundColor Red
    Write-Host "You need to install dependencies first (use a full terminal with npm/pnpm, or the original run-dev.ps1 after install)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Once dependencies are installed, re-run this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Tenant Portal on http://localhost:$TENANT_PORT" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

& $nodePath $nextCli dev --port $TENANT_PORT