# cross-lang-demos

## Purpose

Lightweight TS / Python / Java demos proving the same Workflow YAML can validate, register, and run end-to-end.

## Requirements

### Requirement: Shared greeter workflow YAML
The repository SHALL include a shared minimal Workflow YAML under `examples/cross-lang/` (sequential single unit with a `demo.greeter` or equivalent remote uses) used by all three demos.

#### Scenario: YAML validates
- **WHEN** `uniflow validate` (or SDK validate) runs on the shared YAML
- **THEN** validation succeeds

### Requirement: Three language demos with startup help
The repository SHALL provide TS, Python, and Java demo entrypoints that: start or assume Orchestrator, expose or bind a minimal HTTP greeter unit, register the shared YAML, run once, and print output. README (or cross-lang README) MUST document a three-step flow and scripts that reduce Orchestrator startup friction.

#### Scenario: Documented three-step path exists
- **WHEN** a newcomer opens the cross-lang demo docs
- **THEN** they can identify steps: start orchestrator → start unit → run SDK demo
