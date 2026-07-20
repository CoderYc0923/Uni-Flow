## ADDED Requirements

### Requirement: Default install is npm registry
After `uni-flow` is published, the TS complete-path install guide SHALL present `npm install uni-flow` as the primary install path for application consumers, and SHALL move Git / `file:` path instructions to a secondary contributor or local-development section.

#### Scenario: Primary command is npm install
- **WHEN** a reader opens the install guide’s main consumer path
- **THEN** the first install command shown is `npm install uni-flow` (not Git-only)
