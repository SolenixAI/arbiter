<!-- impeccable:product-schema 1 -->

# Product

## Platform

web

## Users

Anyone who uses an AI agent or AI assistant, technical or not. The job: make the agent work right the first time, with no step left open.

The first reader is a consumer who knows nothing about AI. Solenix exists to bridge the gap between the technology that already exists and these people. When the file works for them, it works for everyone in between.

Readers of this product work in Read mode: the AGENTS.md file, and the README on GitHub. The first reader adds the file to a chat app's project instructions; a developer adds it to a project root.

## Product Purpose

Arbiter is one file, AGENTS.md. Give it to any AI agent. The agent learns how before it acts, decides from live data, and finishes with nothing left open.

North star: arbitrary success for any creator, in any environment or system, in any frontier space.

Success for v1: every CI gate passes, the founder approves, and at least one event the founder values happens: a use, a reply, a listing or a win.

## Positioning

Each rule is stated three ways: as text, as a formula and as a diagram. The three forms must agree, and a disagreement shows up as a contradiction.

Named alternatives: the agents.md examples, OpenAI's Codex AGENTS.md guide, Anthropic's CLAUDE.md guidance, and no file at all. The first three tell an agent about one repo: its build, its style, its tests. Arbiter tells any agent how to work, in any place. The claim that no other file states its rules in three agreeing forms is not yet measured against them.

## Operating Context

- The file is copied into a project root for coding agents (Codex, Cursor, Copilot, Gemini CLI, Claude Code and others), or added as project instructions or a project file in chat apps (ChatGPT, Claude, Gemini).
- The repo runs on GitHub with CI: the gates job (STE, triplets, 9-slot, PVI², pointers, diagrams), the skills job, the link check and the PR-title check. See `experis/checks.md`.
- The repo has no app UI and no runtime. Its surfaces are the file and the README.

## Capabilities and Constraints

- The product is text: AGENTS.md (one file) and README.md.
- Chat apps may cap instruction length. The README says to add the file as a project file when the cap is hit.
- Terminology: the name "Arbiter" is shared with other agent tools. Write "Arbiter by Solenix" in full.
- Decided: the Read-mode critique and audit (Impeccable Design) run on the README, desktop and mobile, in one batch.

## Brand Commitments

- Name: Arbiter by Solenix. Repo: SolenixAI/arbiter, public, MIT.
- Personality: plain, exact, ambitious, warm.
- The three engines are credited, not affiliated: Impeccable Design (pbakaus), Matt's Engineering (mattpocock), Corey's Marketing (coreyhaines31).
- Launch: quiet. The repo, friends, and the first listing on the Solenix agents marketplace (solenix.dev). No other directories.

## Evidence on Hand

- AGENTS.md and README.md in this repo.
- The vendored engine skills under `.agents`, `.claude` and `.cursor`, with their licenses in `.agents/skills/THIRD_PARTY_LICENSES.md`.
- Use: Solenix runs every one of its agents on the file. Arbiter also refined itself: each change had 5 searches, a fresh review and the gates.
- No outside users, testimonials, customers or benchmark results exist yet. Do not invent any.

## Product Principles

1. One file, one source. No second copy of a rule.
2. Every rule in three forms that agree.
3. Repo config stays out of AGENTS.md, so every copy of it stays identical.
4. Keep only the change that beats the last version beyond noise.
