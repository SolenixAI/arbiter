# ADR 0003: Repo config lives outside the core file

Status: accepted, 2026-10-09.

## Context

The engine setup guides suggest adding an `## Agent skills` block to AGENTS.md. That block names this repo's issue tracker, triage labels and domain docs. Those choices differ from repo to repo. If the block went into AGENTS.md, every copy of the file would differ from the others.

## Decision

This repo's agent config lives in `docus/`, in the `agents-*.md` files. AGENTS.md is not changed for it. The `## Agent skills` block that the guide adds is not added. The README points agents to `docus/`.

## Consequences

- Every copy of AGENTS.md stays identical.
- Skills that look for the `## Agent skills` block do not find it. They find the config through the map in `docus/agents-domain.md`. Whether each skill follows that map is open (`<?>`): check each engine skill once.
- AGENTS.md can change only with the user's approval, as the file itself states.
