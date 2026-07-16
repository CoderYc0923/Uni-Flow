## ADDED Requirements

### Requirement: AGENTS points to human narrative docs
`AGENTS.md` SHALL remain the short hard-rules source for YAML-first discipline and SHALL include a pointer to the MkDocs docs-site Understand/Hands-on narrative (so agents and humans know where conceptual explanation lives without duplicating long rationale inside AGENTS).

#### Scenario: Agent finds docs site narrative entry
- **WHEN** a coding agent opens `AGENTS.md`
- **THEN** it can find a path or link to the documentation site narrative entry in addition to schema / validate / templates paths
