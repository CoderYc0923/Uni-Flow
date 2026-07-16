## ADDED Requirements

### Requirement: README serves as a short portal
The root `README.md` SHALL be a concise portal in Simplified Chinese that includes: project one-liner, link to the documentation site (local path and/or deployed URL), install commands, a minimal runnable quick-start snippet, pointers to examples and key repo paths, and license. It MUST NOT be the sole home for full-pipeline tutorials or exhaustive API guides after this change.

#### Scenario: First screen answers what and where next
- **WHEN** a reader opens `README.md`
- **THEN** they can identify what Uni-Flow is, how to install, how to run a tiny example, and where to open the full docs

### Requirement: README and docs site division of labor
Detailed architecture diagrams, extended tutorials, and long FAQs SHALL live primarily on the MkDocs site; the README MAY keep a short capability summary and MUST link to the corresponding docs pages to avoid duplicating long Mermaid/tutorial blocks.

#### Scenario: Deep content linked out
- **WHEN** a reader wants the full pipeline diagram or YAML deep dive
- **THEN** README points them to the documentation site rather than embedding the full former README body
