# ADR 0001: One file, one source

Status: accepted, 2026-10-09.

## Context

Every agent reads the rules from one file, AGENTS.md. A copy of the file that changes in one place and not in another gives two sets of rules. Two sets of rules disagree, and a disagreement is a divergence.

## Decision

The repo's `AGENTS.md` is the only source. A local core file links to it: a symlink to the repo file, on each maintainer's machine. No copy is edited. Other people copy the file from the `main` branch (README).

## Consequences

- Every copy matches the repo file, because each copy is the file itself or a fresh copy of it.
- A change to AGENTS.md goes through a pull request to `main`, with its checks green.
- Repo config for the engines does not go into AGENTS.md (ADR 0003).
