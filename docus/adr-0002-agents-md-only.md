# ADR 0002: AGENTS.md only, no CLAUDE.md

Status: accepted, 2026-10-09. One point is open (see Evidence).

## Context

Claude Code reads `CLAUDE.md`. A repo with both `CLAUDE.md` and `AGENTS.md` has two instructions files, and they can drift apart.

Claude Code 2.1.277 and later fall back to `AGENTS.md` when no `CLAUDE.md` exists.

## Decision

This repo has no `CLAUDE.md`. `AGENTS.md` is the only instructions file.

## Evidence

- The installed Claude Code 2.1.295 binary states the fallback in its own option text.
- The official docs say otherwise.
- The fallback is not yet measured in an interactive session. This is an open unmeasured claim (`<~>`). Check it once in an interactive session that has `AGENTS.md` alone.

## Consequences

- One file serves every agent. No two files can drift apart.
- If the interactive check shows that the fallback does not work, this ADR needs a new decision.
