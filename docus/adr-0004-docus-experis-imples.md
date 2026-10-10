# ADR 0004: The repo is Docus, Experis and Imples

Status: accepted, 2026-10-09. Amended 2026-10-10 by the container law in the AGENTS.md root.

## Context

AGENTS.md has three parts in each section: Docus (what is known and why), Experis (the rules as formulas) and Imples (the rules as a diagram). A repo layout should show the same three parts. Deep folder trees hide what is known.

## Decision

The repo root holds three terminal folders:

- `docus/`: documentation. Understand it.
- `experis/`: experimentation. Prove it: the gates, the measurements, the checks.
- `imples/`: implementation. See that it exists: the tools that run.

Terminal folders hold files only, and every file has a self-describing name. A container depends only on its own contents, so one level explains it. Everything that other tools control is a terminus, listed in `TERMINUS.md` at the root.

The source of this layout is the founder's theory of recursive completeness.

## Consequences

- Engine conventions map into `docus/` with flat names: `docus/agents-*.md` and `docus/adr-NNNN-*.md`. `docus/agents-domain.md` records the map, so the skills find the files.
- `experis/` holds the proofs: `gates.py` (the CI gates), `measure.py` and `pvi.py` (token counts, ratings, checkpoints) and `checks.md`.
- `imples/` holds the tools that run: `AGENTS.html` (the viewer) and `unlock-skills.sh`.
- The root holds `docus/`, `experis/`, `imples/` and `TERMINUS.md`. Every other root file is a terminus, listed with the tool that requires it.
- Local state (ratings, checkpoints, measurements) is made on each machine and ignored by git.
- `experis/gates.py` checks the law on every pull request: terminal folders hold files only, and `TERMINUS.md` exists.
