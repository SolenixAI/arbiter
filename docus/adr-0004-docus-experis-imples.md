# ADR 0004: The repo is Docus, Experis and Imples

Status: accepted, 2026-10-09.

## Context

AGENTS.md has three parts in each section: Docus (what is known and why), Experis (the rules as formulas) and Imples (the rules as a diagram). A repo layout should show the same three parts. Deep folder trees hide what is known.

## Decision

The repo root holds three terminal folders:

- `docus/`: what is known and why.
- `experis/`: experiments: proofs and checks.
- `imples/`: implementation: tooling and code.

Terminal folders are flat. They have no subfolders, and every file has a self-describing name. Every level has at most 9 visible children. Dot-folders that tools require do not count, and AGENTS.md is exempt.

The source of this layout is the founder's theory of recursive completeness.

## Consequences

- Engine conventions map into `docus/` with flat names: `docus/agents-*.md` and `docus/adr-NNNN-*.md`. `docus/agents-domain.md` records the map, so the skills find the files.
- `scripts/unlock-skills.sh` moved to `imples/unlock-skills.sh`. CI runs it from there.
- `experis/checks.md` lists the checks that the repo runs.
- The root shows 9 visible children: AGENTS.md, LICENSE, README.md, PRODUCT.md, release-please-config.json, skills-lock.json, docus, experis and imples. The level is full. A tenth visible child needs a decision first.
- The viewer tooling moves into `imples/` and `experis/` in a later pull request.
