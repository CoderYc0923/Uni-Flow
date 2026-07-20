## ADDED Requirements

### Requirement: Complete public API inventory
The documentation site SHALL provide an API inventory (dedicated page or substantially enhanced reference index) that lists all public Orchestrator HTTP routes, primary TypeScript in-process exports used by integrators (Engine/YAML/ControlFlow factories and client), and primary Python/Java SDK methods. Each inventory row MUST include a one-line purpose (what the API is for) and a link to the handbook page or TypeDoc appendix when available.

#### Scenario: Reader finds purpose for every listed API
- **WHEN** a reader opens the API inventory
- **THEN** every listed entry has a non-empty purpose statement and a navigable link

### Requirement: Inventory coverage vs code
The inventory MUST be checked against `src/orchestrator/server.ts` routes and the package public export surface (`src/index.ts` / published entry) plus documented SDK methods, so newly added public routes/methods are not omitted without an explicit "internal/experimental" note.

#### Scenario: HTTP routes match server
- **WHEN** a maintainer compares the inventory HTTP section to Orchestrator server handlers
- **THEN** every public route appears in the inventory (or is explicitly marked out of scope)

### Requirement: Gaps are closed or tracked
If an inventory entry lacks a handbook page, the change SHALL either add a minimal handbook stub (definition + purpose + signature/params/returns) or link TypeDoc with a clear purpose line on the inventory—MUST NOT leave a bare name with no purpose.

#### Scenario: No purposeless orphan symbols on inventory
- **WHEN** a reader scans the inventory
- **THEN** they do not encounter a public entry that has neither purpose text nor a linked doc explaining purpose
