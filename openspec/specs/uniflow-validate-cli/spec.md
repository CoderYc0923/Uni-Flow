# uniflow-validate-cli

## Purpose

CLI `uniflow validate` for schema-only validation of Workflow YAML documents without executing workflows.

## Requirements

### Requirement: Validate subcommand
The package SHALL expose a CLI entry `uniflow` with subcommand `validate <path>` that loads a Workflow YAML file and validates it against the published JSON Schema without executing the workflow.

#### Scenario: Valid file exits zero
- **WHEN** `uniflow validate` is run on a schema-valid Workflow YAML
- **THEN** the process exits with code 0 and prints a success indication

#### Scenario: Invalid file exits non-zero
- **WHEN** `uniflow validate` is run on an invalid YAML or schema-invalid document
- **THEN** the process exits with a non-zero code and prints one or more human-readable errors including path or schema pointer when available

### Requirement: Validate does not require registry
CLI validate MUST NOT require plugin registry entries; it validates document structure/schema only. Unresolved `uses` MAY be reported as warnings but MUST NOT be required to fail schema validation unless explicitly documented as a separate check mode.

#### Scenario: Unknown uses still schema-ok
- **WHEN** a document is schema-valid but references a custom `uses` string
- **THEN** `validate` succeeds on schema grounds (load-time registry checks remain Loader-only)

### Requirement: Package bin wiring
The package.json MUST declare a `bin` mapping so `npx uniflow` (or local bin) invokes the CLI after build/publish.

#### Scenario: Bin points to CLI
- **WHEN** a consumer inspects package.json `bin.uniflow`
- **THEN** it resolves to the shipped CLI module
