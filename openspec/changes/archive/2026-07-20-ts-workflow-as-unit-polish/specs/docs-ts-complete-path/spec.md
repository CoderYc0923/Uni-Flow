## ADDED Requirements

### Requirement: TS consumer install for full engine
The install and quickstart guides SHALL document how a separate TypeScript application depends on `uni-flow` (npm when published, or documented path/Git interim) and runs a Workflow YAML in-process via `createEngineFromYaml` (or equivalent), without requiring cloning the Uni-Flow monorepo as the only path.

#### Scenario: TS app runs yaml in-process
- **WHEN** a reader follows the TS complete-path install + quickstart
- **THEN** they can run a minimal Sequential (or mock) workflow using the package API in their own project layout description

### Requirement: Orchestrator optional for single-project
Docs SHALL clarify that in-process Engine is sufficient for a single TS project, while Orchestrator HTTP is for multi-process registration/runs and for parents that load YAML remotely—without implying Orchestrator is required for every TS app.

#### Scenario: Single project without Orchestrator
- **WHEN** a reader only needs one TS process
- **THEN** docs show an in-process path that does not require starting Orchestrator
