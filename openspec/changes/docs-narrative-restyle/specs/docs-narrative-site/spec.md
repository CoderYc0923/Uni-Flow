## ADDED Requirements

### Requirement: Narrative information architecture
The documentation site SHALL organize navigation primarily as: Home → Understand (先懂它) → Hands-on (动手) → Dig deeper (深挖) → Reference, such that a newcomer can reach purpose and practicality before API/cross-lang pages.

#### Scenario: Primary path before reference
- **WHEN** a newcomer opens the docs site sidebar
- **THEN** they see Understand and Hands-on groups before Reference topics such as remote Unit contract or cross-lang details

### Requirement: Accounting routing as spine story
The Understand and Hands-on sections SHALL use an accounting / intent-routing business story (user utterance → Router Unit → record vs general) as the primary explanatory example for what Uni-Flow orchestrates.

#### Scenario: Story appears on purpose page
- **WHEN** a reader opens the page that explains what Uni-Flow solves
- **THEN** they see the accounting routing story (pain without orchestration, clear flow with Router) before abstract mode catalogs

### Requirement: Dual-column maturity template
Principle pages on the docs site SHALL present design rationale alongside repository reality (usable / demo / convention-only with paths) in a dual-column or equivalent paired layout, and SHALL avoid terminology-only pages without the accounting story or maturity pairing.

#### Scenario: Empty-shell page exists
- **WHEN** a reader opens the maturity / “is it just a shell” page
- **THEN** they can distinguish engine/ControlFlow/YAML/validate capabilities that are runnable from business plugins or optional Layer-4 pieces that must be supplied or opted in

### Requirement: Success criterion for clarity
After reading Understand (purpose, core formula, maturity) a reader MUST be able to state in plain language what Uni-Flow orchestrates and what the project still expects the application to provide; Hands-on MUST include a Mock path that runs without an LLM API key.

#### Scenario: Mock hands-on without API key
- **WHEN** a reader follows the minimal Hands-on guide
- **THEN** they can run a Mock-based Sequential or Router demonstration without configuring a model API key
