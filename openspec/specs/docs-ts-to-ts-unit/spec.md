# docs-ts-to-ts-unit

## Purpose

Follow-along documentation for embedding one TypeScript Uni-Flow project inside another as a Unit (Workflow-as-Unit), including Engine portability boundary and normative demo link.

## Requirements

### Requirement: TS-to-TS Unit follow-along guide
The documentation SHALL provide a follow-along guide for embedding one TypeScript Uni-Flow project inside another as a Unit: child exposes `POST /execute` running an internal workflow; parent YAML uses bindings/`builtin.http` (or equivalent) and may pass `params`.

#### Scenario: Reader completes mental model
- **WHEN** a reader finishes the TS-to-TS Unit guide
- **THEN** they can name parent YAML, child `/execute` wrapper, and bindings endpoint without referring to Python/Java Engine

### Requirement: Engine portability boundary stated
Guides in this path SHALL state that a complete in-process Uni-Flow Engine exists for TypeScript today; Python/Java Engine ports are future work; non-TS languages may use HTTP SDKs or Unit contracts only.

#### Scenario: Boundary callout present
- **WHEN** a reader opens the cross-project or TS-to-TS guide
- **THEN** they see an explicit note that full Engine is TS-only for now

### Requirement: Demo linked as normative TS path
The guide SHALL link `examples/workflow-as-unit/` (or successor) as the normative TypeScript demonstration of Workflow-as-Unit.

#### Scenario: Demo link from guide
- **WHEN** a reader wants to run the pattern locally
- **THEN** docs point to the workflow-as-unit example commands
