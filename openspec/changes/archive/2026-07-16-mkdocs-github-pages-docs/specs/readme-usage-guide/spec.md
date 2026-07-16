## MODIFIED Requirements

### Requirement: Root README exists with usage guide structure
The repository SHALL provide a root `README.md` written primarily in Simplified Chinese that acts as a **portal**: project overview and one-liner, install steps, a minimal quick-start example, links to the MkDocs documentation site for full-pipeline diagrams / tutorials / API reference, pointers to examples and design docs, and license. Exhaustive end-to-end tutorials and large Mermaid galleries MUST live on the documentation site (not duplicated in full inside README).

#### Scenario: Newcomer can find quick start
- **WHEN** a reader opens `README.md`
- **THEN** they can locate install commands and a minimal runnable example, and a clear link to the documentation site for deeper guides

#### Scenario: Full pipeline lives in docs site
- **WHEN** a reader needs the system panorama and unit execution pipeline diagrams
- **THEN** README directs them to the MkDocs architecture/getting-started pages rather than requiring the former long README sections to remain the only source
