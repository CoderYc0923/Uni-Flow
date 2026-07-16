## ADDED Requirements

### Requirement: MkDocs Material project scaffolding
The repository SHALL provide a root `mkdocs.yml` configured for MkDocs Material, with `docs_dir` pointing at a dedicated documentation source tree (e.g. `docs-site/`), Chinese as the primary language for narrative pages, and a navigable sidebar covering at least: Home, Getting Started, Concepts/Architecture, Orchestration (YAML / cross-lang), Reference, FAQ.

#### Scenario: Local serve builds
- **WHEN** a maintainer installs docs dependencies and runs `mkdocs serve` (or documented equivalent)
- **THEN** the site builds without fatal config errors and the home page is reachable locally

### Requirement: Documentation content coverage
The documentation site SHALL include pages that explain: product purpose and dual-track (YAML + plugins), four-layer architecture and unit execution pipeline, install and quick start, YAML workflow usage and validate, cross-language Orchestrator usage, API/contract/example indexes, and FAQ. Long design specs MAY be summarized with links to in-repo files rather than duplicated verbatim.

#### Scenario: Newcomer path exists
- **WHEN** a reader opens Getting Started
- **THEN** they can install dependencies and run a minimal Sequential or YAML example without reading the full historical README

### Requirement: Mermaid or architecture diagrams
Architecture and pipeline explanations on the docs site SHALL include at least one diagram (Mermaid preferred) for the system panorama or unit execution pipeline, consistent with the engine's documented hook order.

#### Scenario: Pipeline order documented
- **WHEN** a reader opens the architecture/pipeline page
- **THEN** they can see Policy → Security → Context → Execute → post-hooks → record → checkpoint → observability → MessageBus order (or an explicit equivalent)
