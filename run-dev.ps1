$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nextCli = Join-Path $projectRoot "node_modules\next\dist\bin\next"
$bundledNode = "C:\Users\SeanA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

function Get-WorkingNode {
  try {
    $cmd = Get-Command node -ErrorAction Stop
    & $cmd.Source -v *> $null
    return $cmd.Source
  } catch {
    if (Test-Path $bundledNode) {
      return $bundledNode
    }

    throw "No working Node.js runtime was found. Install Node.js or restore the bundled Codex runtime."
  }
}

if (-not (Test-Path $nextCli)) {
  throw "Next.js CLI not found at $nextCli. Run dependency install first."
}

$nodePath = Get-WorkingNode
Write-Host "Using Node: $nodePath"
Write-Host "Starting LandlordForge on http://localhost:3000"

& $nodePath $nextCli dev --port 3000
