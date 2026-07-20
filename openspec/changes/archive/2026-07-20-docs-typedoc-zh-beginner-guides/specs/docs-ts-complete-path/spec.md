## ADDED Requirements

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
