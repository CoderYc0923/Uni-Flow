## ADDED Requirements

### Requirement: Cross-project lead example is TS-to-TS
The cross-project guide SHALL lead with a TypeScript parent embedding a TypeScript child Unit before discussing other languages, and SHALL NOT present Python/Java as having a complete in-process Engine today.

#### Scenario: Opening example is TS
- **WHEN** a reader opens the cross-project guide
- **THEN** the primary worked example is TS↔TS Workflow-as-Unit (or equivalent wording)

### Requirement: Future Engine ports acknowledged
The cross-project (or linked capability) docs MAY mention future Python/Java Engine ports as a roadmap note without documenting them as available install paths for full orchestration.

#### Scenario: No false pip-full-engine claim
- **WHEN** a reader scans install-related links from the cross-project page
- **THEN** they are not told that `pip install` yields a full in-process Uni-Flow Engine
