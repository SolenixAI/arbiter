# Product Marketing Context

**Document version:** v3
**Last updated:** 2026-10-10

## Product Overview
**One-liner:** Arbiter is one file, AGENTS.md: give it to any AI agent, and the agent learns how before it acts, decides from live data, and finishes with nothing left open.
**What it does:** It is a single instructions file for AI agents. Each rule is stated as text, as a formula and as a diagram, and the three forms must agree. Any agent that reads the file works the same way.
**Product category:** AI agent instructions file (the agents.md format).
**Product type:** Open-source text file (MIT) with a README. No app and no service.
**Business model:** Free forever. It builds trust in Solenix, and it is the first listing on the Solenix agents marketplace (solenix.dev).

## Target Audience
**Target companies:** Not company-based. The audience is individuals.
**Decision-makers:** The individual who uses the agent. No team or organization buyer.
**Primary use case:** Make an AI agent work right the first time, with nothing left open.
**Jobs to be done:**
- Give an agent one file that tells it how to work.
- Keep the agent from guessing when live data exists.
- Finish a task with no open loose ends.

**Use cases:**
- Solenix runs every one of its agents on the file: each session, subagent and routine loads it.
- Arbiter refined itself: each change had 5 open searches, a fresh review and the gates.
- Outside use cases: none yet. Add them only when real users report them.

Ideal customer profile: anyone who uses an AI agent or AI assistant, technical or not. The first reader is a consumer who knows nothing about AI. Solenix exists to bridge the gap between the technology that already exists and these people.

## Personas
Skipped: the product is for individuals (B2C).

## Problems & Pain Points
**Core problem:** An AI agent acts before it learns how, guesses where live data exists, and leaves work open.
**Why alternatives fall short:**
- The agents.md examples, the Codex AGENTS.md guide and Anthropic's CLAUDE.md guidance describe one repo: its build, style and tests. They do not teach an agent how to work in general.
- No file at all leaves each agent to its defaults, which differ by product and by version.

**What it costs them:** Unmeasured (`<~>`). An outcome eval with and without the file will measure it. Do not state a number until then.
**Emotional tension:** An agent that is confidently wrong, and small errors that are left in place and multiply.

## Competitive Landscape
**Direct:** The agents.md examples, the Codex AGENTS.md guide and Anthropic's CLAUDE.md guidance. Each is short and repo-specific; none states a general method.
**Secondary:** Community prompt libraries and agent rule packs. They collect tips, but the tips are not checked against each other.
**Indirect:** Working without any instructions file.

## Differentiation
**Key differentiators:**
- One file for every agent, in any place.
- Each rule in three forms (text, formula, diagram) that must agree.
- Gates that check every change to the file in CI (`experis/checks.md`).

**How we do it differently:** A disagreement between the three forms is a contradiction, and the file's own gates catch it.
**Why that's better:** Drift between copies and between forms is caught, not hoped away.
**Why customers choose us:** No outside proof yet. Add it only when real users give it.

## Objections
| Objection | Response |
|-----------|----------|
| The file is long (about 11k tokens). | Each token carries a rule that a fresh reviewer checked. Chat apps that cap instructions take it as a project file. |
| Will it fit my agent? | It is plain text in the agents.md format, read by Codex, Cursor, Copilot, Gemini CLI, Claude Code and chat apps. |

**Anti-persona:** A person who wants only a short, repo-specific file with build commands and code style. Arbiter can sit beside that file, but it does not replace it.

## Switching Dynamics
**Push:** Agents that guess, act before they learn, and leave work open.
**Pull:** One file, free, MIT, with the reasoning of each rule shown.
**Habit:** No instructions file, or a short repo file.
**Anxiety:** The length of the file, and whether it fits their agent.

## Customer Language
**How they describe the problem:**
- None yet from outside users. Record their exact words when they come.

**How they describe us:**
- None yet from outside users. Record their exact words when they come.

**Words to use:** arbitrary success, one file, the three forms (text, formula, diagram), fragment, 5:0.
**Words to avoid:** "Arbiter" alone, because other agent tools share the name. Write "Arbiter by Solenix".
**Glossary:** see `docus/glossary.md`.

## Brand Voice
**Tone:** Plain and direct.
**Style:** Simplified Technical English (ASD-STE100): one meaning per word, active voice, 20 words or fewer per sentence.
**Personality:** Plain, exact, ambitious, warm.
**Layered depth:** Plain on top, deeper for whoever looks, like the Easter egg hunt in *Ready Player One* or the truths spread across *Silo*. Each layer rewards the reader who reaches it: the README for newcomers, the notation for insiders, the file for agents.

## Proof Points
**Metrics:** No public metric yet.
**Customers:** None yet.
**Testimonials:** None yet. Do not invent any.
**Value themes:**

| Theme | Proof |
|-------|-------|
| One file for every agent | The repo's single source rule (ADR 0001) |
| Each rule in three forms | `experis/checks.md`: the gates job checks every section in CI |
| Repo checks pass | CI: gates, skills, link check, PR title |

## Goals
**Business goal:** Trust in Solenix, and the first listing on the Solenix agents marketplace.
**Success for v1:** Every CI gate passes, the founder approves, and at least one event the founder values happens: a use, a reply, a listing or a win.
**Conversion action:** A copy of the file: the `curl` command in the README, or a paste into a chat app's project instructions.
**Current metrics:** None measured yet.

**Launch:** Quiet: the repo, friends, and the Solenix marketplace. No other directories. MIT license.
**Engines:** The three engines are credited, not affiliated: Impeccable Design, Matt's Engineering and Corey's Marketing.
**Setup:** Installed by the engines' own guides. The optional tool-connection guide in the marketing skills README is not used: it needs the founder's marketing account credentials.

## Changelog
*Newest first. One line per revision: what changed and why.*
- v3 (2026-10-10) — Layered depth added to the brand voice, from the founder.
- v2 (2026-10-10) — Every open gap filled from the founder's answers: first reader, business model, buyer, alternatives, use cases, voice, success bar. Gaps that need real users now say "none yet".
- v1 (2026-10-09) — Initial context, drafted from AGENTS.md, README.md and the founder's decisions for the launch.
