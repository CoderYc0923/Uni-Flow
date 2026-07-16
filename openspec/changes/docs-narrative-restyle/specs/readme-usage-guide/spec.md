## MODIFIED Requirements

### Requirement: Root README exists with usage guide structure
The repository SHALL provide a root `README.md` written primarily in Simplified Chinese that acts as a **portal**: project one-liner, a one-sentence accounting-routing pain/value hook, link to the MkDocs documentation site Understand/Hands-on paths, install steps, a minimal runnable quick-start snippet, pointers to examples and key repo paths, and license. Exhaustive end-to-end tutorials, large Mermaid galleries, and full API guides MUST live primarily on the documentation site (not duplicated in full inside README).

#### Scenario: Newcomer can find quick start
- **WHEN** a reader opens `README.md`
- **THEN** they can locate install commands and a minimal runnable example, and a clear link to the documentation site for deeper guides (先懂它 / 动手)

#### Scenario: Full pipeline lives in docs site
- **WHEN** a reader needs the system panorama and unit execution pipeline diagrams
- **THEN** README directs them to the MkDocs site rather than requiring large Mermaid blocks to remain the only source inside README

## ADDED Requirements

### Requirement: README CTA matches narrative spine
The README portal SHALL explicitly point newcomers to the docs-site pages that explain the accounting routing story and the dual-column maturity view (or the Understand group that contains them).

#### Scenario: Narrative link present
- **WHEN** a reader scans README “下一步 / 文档” links
- **THEN** at least one link targets the docs-site Understand (先懂它) narrative path
