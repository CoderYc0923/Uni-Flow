# docs-ts-complete-path

## Purpose

Documentation for consuming the full TypeScript Uni-Flow Engine in a separate TS application (install + in-process YAML), with Orchestrator positioned as optional for multi-process/remote cases.

## Requirements

### Requirement: TS consumer install for full engine
The install and quickstart guides SHALL document how a separate TypeScript application depends on `uni-flow` (npm when published, or documented path/Git interim) and runs a Workflow YAML in-process via `createEngineFromYaml` (or equivalent), without requiring cloning the Uni-Flow monorepo as the only path.

#### Scenario: TS app runs yaml in-process
- **WHEN** a reader follows the TS complete-path install + quickstart
- **THEN** they can run a minimal Sequential (or mock) workflow using the package API in their own project layout description

### Requirement: Orchestrator optional for single-project
Docs SHALL clarify that in-process Engine is sufficient for a single TS project, while Orchestrator HTTP is for multi-process registration/runs and for parents that load YAML remotely—without implying Orchestrator is required for every TS app.

#### Scenario: Single project without Orchestrator
- **WHEN** a reader only needs one TS process
- **THEN** docs show an in-process path that does not require starting Orchestrator

### Requirement: Install and quickstart are step-complete for beginners
The TS complete-path install and quickstart guides SHALL be detailed enough that a reader with general Node/TypeScript familiarity but no Uni-Flow experience can complete a first successful in-process run by following only those pages (including dependency install wording and where to put files).

#### Scenario: Beginner completes first run from guides alone
- **WHEN** a reader follows install then quickstart without prior Uni-Flow docs
- **THEN** the pages specify dependency, file layout, run command, and what success looks like for at least one Mock or Sequential path

### Requirement: Dual path explained without ambiguity
Quickstart SHALL present code-API and YAML paths as clearly labeled tracks (A/B or equivalent), each with its own steps and expected result, and SHALL state which track a beginner should pick first.

#### Scenario: Beginner knows which track to start
- **WHEN** a beginner opens quickstart
- **THEN** the page recommends one primary track first and still documents the second track as a separate numbered sequence
