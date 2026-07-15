#!/usr/bin/env bash
# Start empty Orchestrator on 8787 (for Py/Java demos).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
npm run build
node dist/../examples/cross-lang/ts/start-orch-only.ts 2>/dev/null || npx --yes tsx examples/cross-lang/ts/start-orch-only.ts
