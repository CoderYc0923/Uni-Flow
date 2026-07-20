## ADDED Requirements

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
