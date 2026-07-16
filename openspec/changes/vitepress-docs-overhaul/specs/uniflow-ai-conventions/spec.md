## ADDED Requirements

### Requirement: AGENTS points to VitePress narrative
`AGENTS.md` SHALL remain the short hard-rules source for YAML-first discipline and SHALL point coding agents to the VitePress documentation site architecture/Why paths (not MkDocs `docs-site/` as the live narrative source).

#### Scenario: Agent finds VitePress docs entry
- **WHEN** a coding agent opens `AGENTS.md`
- **THEN** it can find a path under `docs-web/` (or documented Pages URL) for human narrative / architecture in addition to schema / validate / templates paths
