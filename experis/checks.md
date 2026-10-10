# Checks

The checks that this repo runs, and what each one proves. Each check must pass before a pull request merges.

| Check | Runs | Proves |
| --- | --- | --- |
| `skills` job, `.github/workflows/ci.yml` | `imples/unlock-skills.sh`, then `git diff --exit-code .agents .claude` | Every vendored skill can be invoked by the model, and the committed files already match the unlock. |
| `lychee` job, `.github/workflows/links.yml` | Checks every `*.md` and `*.json` link. Repo links map to the working tree. Vendored skill folders are excluded. | No broken link in this repo's own files. A link to a file that the same change adds passes. |
| `conventional` job, `.github/workflows/pr-title.yml` | Checks that the PR title is a Conventional Commit. | Release tooling can read the change. |
| `impeccable doctor` | `.claude/skills/impeccable/scripts/impeccable doctor` | The vendored Impeccable files match what this version reads. |
| Fresh-review rule (AGENTS.md section 10) | A fresh agent that did not do the work reviews the change. It gets the PVI, the check and the result, never the author's reasoning. | A problem the author cannot see is found by a reader with no stake in the change. This check is manual. |
| `gates` job, `.github/workflows/ci.yml` | `imples/gates.py`, then every mermaid block rendered with mermaid-cli | Every sentence has 20 words or fewer (STE). Each section has its text, formula and diagram. Each body holds 1 to 9 items. Each Docus opens with PVI². Every (§N) pointer resolves. No private tracker id. Every diagram renders. |
| measure.py (local viewer tooling) | Token counts, body ratings and checkpoints | The cost of each section and body in tokens. It moves into `imples/` and `experis/` in a later pull request. |
