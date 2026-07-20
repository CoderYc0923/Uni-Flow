# docs-typedoc-zh-api

## Purpose

Chinese JSDoc standards for the public TypeScript surface and TypeDoc-generated appendix readability for end users.

## Requirements

### Requirement: Public API JSDoc in Chinese
Exported TypeScript symbols that appear in the TypeDoc appendix (via `src/index.ts` re-exports) SHALL have Chinese documentation comments describing purpose. P0 entrypoints (`createWorkflowEngine`, `createEngineFromYaml`, validate helpers, Workflow-as-Unit helpers, primary adapter factories, `UniFlowClient`, and user-facing `AgentInput` / `AgentOutput` / engine options types) SHALL document parameters, return values, and user-editable fields in Chinese (`@param` / `@returns` / `@property` or equivalent member comments).

#### Scenario: P0 factory has Chinese params
- **WHEN** a reader opens the generated appendix page for `createEngineFromYaml` (or equivalent primary YAML entry)
- **THEN** they see Chinese text for the symbol purpose and for each documented parameter / option field

### Requirement: Generated appendix is user-facing
The TypeDoc markdown appendix SHALL be treated as a user-facing reference: after `docs:api`, key P0 symbols MUST NOT appear as bare English names with empty or placeholder-only descriptions.

#### Scenario: Empty stub rejected for P0
- **WHEN** a maintainer spot-checks generated pages for listed P0 symbols after `docs:api`
- **THEN** each checked symbol has a non-empty Chinese summary (not only the identifier)

### Requirement: JSDoc language convention
Documentation comments for the public appendix SHALL use Chinese for prose; code identifiers and type names remain as in source. Short `@example` blocks MAY be included for P0 symbols and MUST NOT require a live LLM.

#### Scenario: Example is mock-friendly
- **WHEN** a P0 symbol includes `@example`
- **THEN** the example uses in-process / Mock-style APIs or clearly marked placeholders, not a mandatory cloud LLM key
