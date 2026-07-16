# AGENTS.md — Uni-Flow

Conventions for coding agents working in this repository.

**Human narrative (Who/Why/How, architecture, API handbooks):** VitePress site under `docs-web/` (`npm run docs:dev`). Do not treat retired MkDocs `docs-site/` as live docs. Keep this file as hard rules only.

## Orchestration (YAML-first)

1. Change workflow **topology** in Workflow YAML (`apiVersion: uniflow/v1`), not with a second hand-rolled scheduler.
2. Add new domain capability as a **`uses` plugin** and register it (`createEngineFromYaml` registry **or** Orchestrator `bindings`).
3. Do **not** replace ControlFlow/YAML with `for`/`while` multi-agent scheduling.
4. After editing YAML, run **`uniflow validate`**.

## `uses` decision (how to plug an Agent)

```text
Need Uni-Flow orchestration?
├─ TS in-process → createEngineFromYaml + registry[uses] = Adapter/factory
├─ Any language / remote Unit → HTTP Unit (see docs/remote-unit-http-contract.md)
│     + POST /workflows/from-yaml { yaml, bindings: { "name": { type:http, endpoint } } }
└─ Only want Checkpoint/Memory beside existing graph → Sidecar SDK (does NOT replace YAML topology)
```

Complex Composite topologies not in YAML v1 → use code API (`createWorkflowEngine`) for that subgraph; keep top-level YAML when possible.

## Cross-language

| Item | Path |
|------|------|
| Design | `docs/superpowers/specs/2026-07-14-uniflow-sdk-complete-design.md` |
| Demos | `examples/cross-lang/` (README: 起核 → 起 Unit → 跑 SDK) |
| Remote Unit contract | `docs/remote-unit-http-contract.md` |
| Python SDK | `sdk/python` — `validate` / `load_and_register` / `start_workflow` |
| Java SDK | `sdk/java` — same surface (structural validate + HTTP) |

**Registry memory:** Orchestrator registrations are in-process; restart ⇒ re-`from-yaml`. YAML files on disk are not deleted.

**Run result fields to surface to users:** `runId`, `status`, `result.completedUnits`, `result.state` (e.g. `output.<unitId>`).

## P3 `artifacts` (reserved)

`AgentOutput.metadata.artifacts` / SharedState key `artifacts` MAY hold `[{ id, uri?, mimeType?, label? }]`. Engine and SDKs **pass through only** — do not implement media pipelines or depend on engine processing.

## Key paths

| Artifact | Path |
|----------|------|
| JSON Schema | `schemas/uniflow.workflow.schema.json` |
| Loader | `src/yaml/` → `createEngineFromYaml` |
| CLI | `dist/cli/uniflow.js` |
| Templates | `examples/templates/` |
| Cursor rule | `.cursor/rules/uni-flow.mdc` |
| Docs site (VitePress) | `docs-web/` — Why: `docs-web/why/` · Architecture: `docs-web/architecture/` · API: `docs-web/reference/`（`npm run docs:dev` / `docs:build`） |
| Docs deploy | `.github/workflows/docs.yml` → GitHub Pages |
| Design appendix | `docs-web/architecture/design-longform.md` |

## Dual-track

- **YAML path**: default for new orchestration.
- **Code path**: `createWorkflowEngine` for tests and Composite edge cases; same Engine/Layer4.
