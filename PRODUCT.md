<!-- impeccable:product-schema 1 -->

# Product

## Platform

web

## Users

Anyone who uses an AI agent or AI assistant, technical or not. The job: make the agent work right the first time, with no step left open.

Readers of this product work in Read mode: the AGENTS.md file, and the README on GitHub. [NEED: the reader situation the founder wants first, for example a developer adding the file to a project, or a chat-app user adding it as project instructions.]

## Product Purpose

Arbiter is one file, AGENTS.md. Give it to any AI agent. The agent learns how before it acts, decides from live data, and finishes with nothing left open.

North star: arbitrary success for any creator, in any environment or system, in any frontier space.

Success for v1.0: the review finds 0 A findings, and a persona rating is recorded (the project's measurable success). [NEED: the rating bar the founder accepts for v1.0.]

## Positioning

Each rule is stated three ways: as text, as a formula and as a diagram. The three forms must agree, and a disagreement shows up as a contradiction. No other agent instruction file in this form is known to the repo; this claim is not yet measured against the alternatives. [NEED: named alternatives, so the claim can be tested.]

## Operating Context

- The file is copied into a project root for coding agents (Codex, Cursor, Copilot, Gemini CLI, Claude Code and others), or added as project instructions or a project file in chat apps (ChatGPT, Claude, Gemini).
- The repo runs on GitHub with CI: the skills job, the link check and the PR-title check. See `experis/checks.md`.
- The repo has no app UI and no runtime. Its surfaces are the file and the README.

## Capabilities and Constraints

- The product is text: AGENTS.md (one file) and README.md.
- Chat apps may cap instruction length. The README says to add the file as a project file when the cap is hit.
- Terminology: the name "Arbiter" is shared with other agent tools. Write "Arbiter by Solenix" in full.
- Undecided: whether the Read-mode critique (Impeccable Design) runs on the README. The README has no screenshots yet. [NEED]

## Brand Commitments

- Name: Arbiter by Solenix. Repo: SolenixAI/arbiter, public, MIT.
- The three engines are credited, not affiliated: Impeccable Design (pbakaus), Matt's Engineering (mattpocock), Corey's Marketing (coreyhaines31).
- Launch: quiet. The repo and friends, no directories.

## Evidence on Hand

- AGENTS.md and README.md in this repo.
- The vendored engine skills under `.agents`, `.claude` and `.cursor`, with their licenses in `.agents/skills/THIRD_PARTY_LICENSES.md`.
- No user data, testimonials, customers or benchmark results exist yet. Do not invent any. The only measured item is the internal file rating: PVI 84 on 2026-10-08, recorded in the project tracker.

## Product Principles

1. One file, one source. No second copy of a rule.
2. Every rule in three forms that agree.
3. Repo config stays out of AGENTS.md, so every copy of it stays identical.
4. Keep only the change that beats the last version beyond noise.
