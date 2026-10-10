# Domain docs

This repo is single-context. Its domain docs live in `docus/`, as flat files with self-describing names (ADR 0004).

The engine skills use default paths at the repo root. Read them through this map:

| Skill default | This repo |
| --- | --- |
| `GLOSSARY.md` at the root | `docus/glossary.md` |
| `GLOSSARY-MAP.md` | not used (single context) |
| `docs/adr/NNNN-<slug>.md` | `docus/adr-NNNN-<slug>.md` |
| `docs/agents/issue-tracker.md` | `docus/agents-issue-tracker.md` |
| `docs/agents/triage-labels.md` | `docus/agents-triage-labels.md` |
| `docs/agents/domain.md` | `docus/agents-domain.md` (this file) |

## Before exploring, read these

- **`docus/glossary.md`**: the terms of this repo, one meaning each.
- **`docus/adr-*.md`**: read the ADRs that touch the area you are about to work in.

If any of these files does not exist, proceed silently. Do not flag its absence.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis or a test name), use the term as defined in `docus/glossary.md`. Do not drift to synonyms the glossary avoids.

If the concept you need is not in the glossary, either you are inventing language the project does not use, or there is a real gap. Note the gap for the glossary.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than override it silently:

> _Contradicts ADR 0003 (repo config outside the core file), but worth reopening because..._
