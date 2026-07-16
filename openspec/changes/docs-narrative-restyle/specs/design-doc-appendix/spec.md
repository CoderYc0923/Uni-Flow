## ADDED Requirements

### Requirement: Design longform is an appendix
The root design document `Agent统一工作流模式设计.md` SHALL begin with a short reader guide stating that human onboarding starts on the MkDocs docs site (“先懂它”), and that this file is an appendix for the unified-model derivation—not the primary getting-started path.

#### Scenario: Opening the longform shows the guide
- **WHEN** a reader opens `Agent统一工作流模式设计.md` at the top
- **THEN** they see an explicit pointer to the docs-site Understand path before deep theory sections

### Requirement: Accounting story related in appendix
The design longform SHALL include or prioritize an accounting / Router illustration for relating ControlFlow patterns to the public narrative (code-review may remain as a secondary example).

#### Scenario: Reader finds accounting illustration
- **WHEN** a reader looks for a business mapping inside the design longform
- **THEN** they can find an accounting intent-routing illustration without treating code-review as the only end-to-end story
