# docs-beginner-tutorials

## Purpose

Beginner step-by-step tutorials in the VitePress guides: install, quickstart, YAML, and cross-project follow-along depth for first-time Uni-Flow users.

## Requirements

### Requirement: Beginner tutorial skeleton
Guide tutorials for first-time users (at least install, quickstart, and yaml) SHALL follow a beginner skeleton: goal statement, prerequisites, numbered steps with full commands or file contents, expected results, common pitfalls, and a link to the next guide.

#### Scenario: Quickstart has numbered steps and expected result
- **WHEN** a beginner opens the quickstart guide
- **THEN** they can follow numbered steps and find an explicit “expected result” (or equivalent) for the primary path

### Requirement: Zero-to-one without assuming prior Uni-Flow knowledge
Beginner guides SHALL NOT assume the reader already knows ControlFlow vocabulary; terms such as Unit, SharedState, and `uses` MUST be introduced in plain language before first use, or linked to a one-screen glossary callout on the same page.

#### Scenario: Unit introduced before use
- **WHEN** a beginner reaches the first code or YAML that defines a unit
- **THEN** the page has already explained what a Unit is in one short plain-language sentence

### Requirement: Cross-project follow-along depth
The cross-project guide SHALL include a step-by-step follow-along for TS↔TS Workflow-as-Unit (start child, bindings, parent run, inspect `params` / result) with expected terminal or HTTP outcomes, suitable for a reader who has only finished single-project quickstart.

#### Scenario: Parent-child steps listed
- **WHEN** a beginner follows the cross-project TS↔TS section
- **THEN** they see ordered steps covering child `/execute`, parent bindings, and how to recognize a successful run
