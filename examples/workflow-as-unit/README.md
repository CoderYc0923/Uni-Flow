# Workflow-as-Unit demo

Child project keeps a **full internal workflow**; parent embeds it as **one Unit** via `POST /execute`.

Contract: [`docs/remote-unit-http-contract.md`](../../docs/remote-unit-http-contract.md)  
Guide: VitePress `guide/cross-project`

## Files

| Path | Role |
|------|------|
| `child-internal.workflow.yaml` | Child's internal Sequential workflow |
| `parent.workflow.yaml` | Parent embeds `child.capability` |
| `ts/child-execute-server.ts` | Wrapper: `/execute` → run internal YAML → `AgentOutput` |
| `ts/run-demo.ts` | Orchestrator + binding + sync run with `params` |

## Three steps

```bash
# From repo root (one-shot demo; starts orch + child itself)
npx tsx examples/workflow-as-unit/ts/run-demo.ts

# Or via test
npx vitest run tests/workflow-as-unit-demo.test.ts
```

Manual split:

1. `npx tsx examples/workflow-as-unit/ts/child-execute-server.ts` → child on `:9201/execute`
2. Start Orchestrator (e.g. `npx tsx examples/cross-lang/ts/start-orch-only.ts`)
3. `from-yaml` parent with binding `child.capability` → `http://127.0.0.1:9201/execute`, then sync run with `{ task, params: { $profile, mode } }`

## What to notice

- Parent YAML has **one** unit — no child internal ids.
- Runtime `params` (`$profile`, `mode`, …) flow parent → HttpAdapter → child wrapper → optional metadata echo.
- Orchestrator `POST /workflows/:id/runs` remains for standalone jobs; **composition** uses Unit `/execute`.
