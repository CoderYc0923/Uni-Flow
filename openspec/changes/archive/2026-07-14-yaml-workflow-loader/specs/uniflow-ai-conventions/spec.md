## ADDED Requirements

### Requirement: Cursor rule for orchestration discipline
The repository SHALL provide `.cursor/rules/uni-flow.mdc` (or equivalent Cursor rule) stating that: (1) workflow topology changes belong in YAML; (2) new domain capability is added as a `uses` plugin and registered; (3) hand-written for/while multi-agent scheduling MUST NOT replace ControlFlow/YAML; (4) after YAML edits, run `uniflow validate`.

#### Scenario: Rule file present
- **WHEN** an agent reads the Uni-Flow Cursor rule
- **THEN** the four discipline rules above are explicitly stated

### Requirement: AGENTS guidance pointer
The repository SHALL document the same conventions for non-Cursor agents via `AGENTS.md` or a clearly linked section, pointing to the schema, validate CLI, and templates.

#### Scenario: Agent discovers conventions
- **WHEN** a coding agent opens AGENTS.md (or the linked section)
- **THEN** it can find how to validate YAML and where templates live

### Requirement: Example workflow templates
The repository SHALL include `examples/templates/` with at least four YAML templates covering: qa, rag, vertical-transaction, and media-pipeline, each valid against the published schema when placeholders/registry notes are followed.

#### Scenario: Templates validate
- **WHEN** `uniflow validate` is run on each template (with any documented placeholder substitutions if required for pure schema validity)
- **THEN** each template passes schema validation

### Requirement: Runnable YAML example
The repository SHALL provide at least one end-to-end example that loads YAML via `createEngineFromYaml` with `builtin.mock` (and/or minimal registry) and successfully runs.

#### Scenario: Example run succeeds
- **WHEN** the documented runnable example is executed in the test or examples suite
- **THEN** the engine completes without load or schema errors
