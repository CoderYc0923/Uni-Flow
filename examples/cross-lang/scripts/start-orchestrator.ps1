# Start empty Orchestrator on 8787 (for Py/Java demos).
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")
npm run build
npx --yes tsx examples/cross-lang/ts/start-orch-only.ts
