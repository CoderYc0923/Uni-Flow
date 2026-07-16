## ADDED Requirements

### Requirement: VitePress site scaffolding
The repository SHALL provide a VitePress documentation site under `docs-web/` with Chinese narrative content, default theme plus light brand accent, and `base` configured for GitHub Pages project site `/Uni-Flow/`.

#### Scenario: Local dev builds
- **WHEN** a maintainer runs the documented `docs:dev` or `docs:build` command
- **THEN** the site builds without fatal config errors and the home page is reachable

### Requirement: Navigation information architecture
The VitePress sidebar/nav SHALL include top-level groups for: Why Uni-Flow, Architecture/Planning, Guides, Examples, API Reference (and contribution/AGENTS pointers), such that product Why and architecture precede deep API pages.

#### Scenario: Why before API in nav
- **WHEN** a newcomer opens the documentation navigation
- **THEN** they can reach product Why / architecture sections without first opening generated API appendix pages

### Requirement: GitHub Pages via Actions
The repository SHALL deploy the VitePress build output using GitHub Actions (`upload-pages-artifact` + `deploy-pages` or equivalent official Pages deploy), and SHALL NOT rely on MkDocs as the primary docs build for Pages.

#### Scenario: Docs workflow builds VitePress
- **WHEN** a maintainer inspects the docs GitHub Actions workflow
- **THEN** it installs Node dependencies, runs the VitePress docs build, and deploys the static output for Pages

### Requirement: MkDocs primary path retired
After migration, MkDocs SHALL NOT remain the documented primary documentation toolchain (root `mkdocs.yml` / `docs-site` as the live site source MUST be removed or clearly archived with README pointing only to VitePress).

#### Scenario: README points to VitePress
- **WHEN** a reader opens `README.md` documentation links
- **THEN** the primary docs CTA targets the VitePress site path or deployed URL, not MkDocs `docs-site/` as the live source of truth
