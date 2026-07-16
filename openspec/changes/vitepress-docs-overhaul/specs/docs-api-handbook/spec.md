## ADDED Requirements

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
