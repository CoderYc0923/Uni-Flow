# docs-api-handbook

## Purpose

Handbook-style API documentation on the VitePress site: HTTP routes, SDK surfaces, and TypeDoc-generated appendix for exported TypeScript symbols.

## Requirements

### Requirement: Handbook-style API pages
The documentation site SHALL provide handbook-style pages for public surfaces covering: definition, purpose, signature or HTTP method/path, parameters, return/response fields, errors, and copy-paste examples—at least for Orchestrator HTTP routes, TypeScript `UniFlowClient` (and primary Engine/YAML entrypoints), and Python/Java SDK primary APIs.

#### Scenario: HTTP route is fully documented
- **WHEN** a reader opens an Orchestrator HTTP route page (e.g. `POST /workflows/from-yaml`)
- **THEN** they find method/path, request body fields, response shape, and an example

### Requirement: TypeDoc generated appendix
The repository SHALL provide a repeatable `docs:api` (or equivalent) script that generates a TypeDoc (or equivalent) appendix under the VitePress tree so exported TypeScript symbols remain discoverable beyond hand-written pages.

#### Scenario: Generated appendix builds
- **WHEN** a maintainer runs `docs:api` then `docs:build`
- **THEN** the build includes a generated API appendix without failing the site build

### Requirement: HTTP contract alignment
Hand-written Orchestrator HTTP documentation SHALL align with `src/orchestrator/server.ts` and SHALL link or summarize `docs/remote-unit-http-contract.md` for remote Unit behavior.

#### Scenario: Documented routes exist in server
- **WHEN** a reader lists HTTP routes on the docs HTTP overview
- **THEN** each listed route corresponds to a handler path implemented by the Orchestrator server

### Requirement: Handbook links to Chinese generated appendix
Hand-written API handbook pages for TypeScript entrypoints SHALL link to the corresponding TypeDoc generated appendix symbol when one exists, and SHALL NOT rely on an English-only stub as the sole documentation for P0 APIs.

#### Scenario: YAML API page links generated symbol
- **WHEN** a reader finishes the hand-written YAML API (or Engine) handbook section for a P0 function
- **THEN** they can navigate to the generated appendix entry for that symbol (or an explicit “生成附录” section pointing there)

### Requirement: Handbook purpose sections stay Chinese
Hand-written handbook pages covering TS public entrypoints SHALL keep purpose / parameters / returns sections in Chinese and consistent with source JSDoc meaning (field names remain English).

#### Scenario: Parameter table is Chinese
- **WHEN** a reader opens a hand-written page for `createEngineFromYaml` or `createWorkflowEngine`
- **THEN** parameter and options explanations are in Chinese
