## ADDED Requirements

### Requirement: Full YAML field reference
The documentation SHALL provide a field-level reference for Workflow YAML `apiVersion: uniflow/v1` covering top-level keys, `metadata`, `spec.units` (including `id`, `uses`, `config`, `contextPolicy`, `policyOverrides`), `spec.policy`, `spec.entry` when applicable, and each supported `spec.flow.type` with its required properties—aligned with `schemas/uniflow.workflow.schema.json`.

#### Scenario: Reader looks up a flow field
- **WHEN** a reader needs the meaning of a Router `routes` map or Sequential `order`
- **THEN** the YAML field reference documents that field's purpose and constraints

### Requirement: Validate principle documented
The YAML/validate guide SHALL explain that `uniflow validate` (and SDK `validate`) performs JSON Schema validation (e.g. Ajv against the published schema): what is checked (structure/enums/required fields) and what is NOT checked (plugin `uses` resolution, runtime execution, remote endpoint reachability).

#### Scenario: Reader distinguishes validate vs load
- **WHEN** a reader asks why validate passed but `createEngineFromYaml` failed on missing `uses`
- **THEN** docs state that validate is schema-only and load-time resolves plugins

### Requirement: Annotated example beside tables
The field reference or YAML guide SHALL include at least one fully annotated example YAML (inline comments or adjacent callouts) covering units + one non-sequential flow or policy block.

#### Scenario: Annotated example present
- **WHEN** a newcomer opens the YAML deep guide
- **THEN** they can map example lines to the field tables without leaving the docs site
