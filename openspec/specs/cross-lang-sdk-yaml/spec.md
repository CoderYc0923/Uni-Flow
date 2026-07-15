# cross-lang-sdk-yaml

## Purpose

Cross-language SDK surface for Workflow YAML validate / register / run against a shared schema and Orchestrator.

## Requirements

### Requirement: Cross-language validate API
TypeScript (HTTP client path), Python, and Java SDKs SHALL provide `validate` that checks Workflow YAML against the same published JSON Schema and returns success or structured errors without executing a run.

#### Scenario: Shared valid document
- **WHEN** each language SDK validates the shared greeter (or fixture) YAML
- **THEN** all report success

#### Scenario: Shared invalid apiVersion
- **WHEN** each language SDK validates a document with wrong `apiVersion`
- **THEN** all report failure

### Requirement: load_and_register and run alignment
Python and Java SDKs SHALL provide `load_and_register` (or equivalent) that posts YAML and bindings to the Orchestrator `from-yaml` endpoint, and `run`/`start_workflow` semantics consistent with the existing TypeScript HTTP client (including optional sync).

#### Scenario: Python end-to-end register and run
- **WHEN** Orchestrator is available and Python SDK registers the greeter workflow with bindings then runs sync
- **THEN** the client receives a result containing non-empty unit output

#### Scenario: Orchestrator unreachable
- **WHEN** the base URL is unreachable
- **THEN** the SDK surfaces a clear connection/HTTP error without silent success
