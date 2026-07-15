# orchestrator-yaml-register

## Purpose

Register Workflow YAML documents on the Orchestrator over HTTP with optional `uses` bindings to remote HTTP units.

## Requirements

### Requirement: Register workflow from YAML over HTTP
The Orchestrator SHALL expose `POST /workflows/from-yaml` that accepts a Workflow YAML string (and optional bindings), validates it against the published JSON Schema, resolves `uses`, registers the workflow under `metadata.id`, and makes it available for subsequent run APIs.

#### Scenario: Successful registration
- **WHEN** a valid YAML and bindings covering every non-builtin `uses` are posted
- **THEN** the response indicates success with the workflow id and `GET/POST` run endpoints can use that id

#### Scenario: Schema-invalid YAML rejected
- **WHEN** the YAML fails schema validation
- **THEN** the server responds with a non-2xx status and structured validation errors without registering

### Requirement: Bindings resolve remote uses to HTTP units
When `bindings` map a `uses` name to `{ type: 'http', endpoint }`, the registration path MUST construct an HTTP-backed unit (via `builtin.http` / HttpAdapter) for that name. Missing bindings for a non-builtin `uses` MUST fail registration with an error naming the unresolved uses.

#### Scenario: Missing binding fails fast
- **WHEN** YAML references `uses: demo.greeter` and bindings omit that key
- **THEN** registration fails and no workflow id is activated

#### Scenario: Builtin mock needs no binding
- **WHEN** YAML only uses `builtin.mock`
- **THEN** registration succeeds without bindings
