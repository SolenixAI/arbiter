# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-10-09

## Product Overview
**One-liner:** Arbiter is one file, AGENTS.md: give it to any AI agent, and the agent learns how before it acts, decides from live data, and finishes with nothing left open.
**What it does:** It is a single instructions file for AI agents. Each rule is stated as text, as a formula and as a diagram, and the three forms must agree. Any agent that reads the file works the same way.
**Product category:** AI agent instructions file (the agents.md format).
**Product type:** Open-source text file (MIT) with a README. No app and no service.
**Business model:** Free and open source (MIT). [NEED: any revenue model, or none.]

## Target Audience
**Target companies:** Not company-based. The audience is individuals.
**Decision-makers:** The individual who uses the agent. [NEED: any team or organization buyer.]
**Primary use case:** Make an AI agent work right the first time, with nothing left open.
**Jobs to be done:**
- Give an agent one file that tells it how to work.
- Keep the agent from guessing when live data exists.
- Finish a task with no open loose ends.

**Use cases:** [NEED: concrete examples from real users.]

Ideal customer profile: anyone who uses an AI agent or AI assistant, technical or not.

## Personas
Skipped: the product is for individuals (B2C).

## Problems & Pain Points
**Core problem:** An AI agent acts before it learns how, guesses where live data exists, and leaves work open.
**Why alternatives fall short:** [NEED: named alternatives and their gaps.]
- [NEED: each alternative and the gap it leaves.]

**What it costs them:** [NEED: measured cost, such as rework time.]
**Emotional tension:** [NEED: the feeling of an agent that is confidently wrong.]

## Competitive Landscape
**Direct:** [NEED: other AGENTS.md and CLAUDE.md templates for agents, named with their gaps.]
**Secondary:** [NEED: general prompt libraries and agent rule packs, named with their gaps.]
**Indirect:** [NEED: working without any instructions file.]

## Differentiation
**Key differentiators:**
- One file for every agent.
- Each rule in three forms (text, formula, diagram) that must agree.
- Gates that check each rule's size and form (`experis/checks.md`).

**How we do it differently:** A disagreement between the three forms is a contradiction, and the file's own gates catch it.
**Why that's better:** Drift between copies and between forms is caught, not hoped away.
**Why customers choose us:** [NEED: measured proof from users.]

## Objections
| Objection | Response |
|-----------|----------|
| [NEED: objections heard in use.] | [NEED] |

**Anti-persona:** [NEED: who is not a good fit.]

## Switching Dynamics
**Push:** [NEED]
**Pull:** One file, free, MIT, with the reasoning of each rule shown.
**Habit:** [NEED: what people use now.]
**Anxiety:** [NEED: length of the file, and whether it fits their agent.]

## Customer Language
**How they describe the problem:**
- [NEED: verbatim phrases from users.]

**How they describe us:**
- [NEED: verbatim phrases from users.]

**Words to use:** arbitrary success, one file, the three forms (text, formula, diagram), fragment, 5:0.
**Words to avoid:** "Arbiter" alone, because other agent tools share the name. Write "Arbiter by Solenix".
**Glossary:** see `docus/glossary.md`.

## Brand Voice
**Tone:** Plain and direct.
**Style:** Simplified Technical English (ASD-STE100): one meaning per word, active voice, 20 words or fewer per sentence.
**Personality:** [NEED: three to five adjectives chosen by the founder.]

## Proof Points
**Metrics:** No public metric yet. The file's internal rating is PVI 84 (2026-10-08), recorded in the project tracker. It is an internal rating, not a market metric.
**Customers:** [NEED: none yet.]
**Testimonials:** [NEED: none yet. Do not invent any.]
**Value themes:**

| Theme | Proof |
|-------|-------|
| One file for every agent | The repo's single source rule (ADR 0001) |
| Each rule in three forms | `experis/checks.md`: triplet and formula gates |
| Repo checks pass | CI: skills job, link check, PR-title check |

## Goals
**Business goal:** [NEED: the founder's goal for the launch.]
**Conversion action:** A copy of the file: the `curl` command in the README.
**Current metrics:** [NEED: any measured count of copies or users.]

**Launch:** Quiet: the repo and friends, no directories. MIT license.
**Engines:** The three engines are credited, not affiliated: Impeccable Design, Matt's Engineering and Corey's Marketing.
**Setup:** Installed by the engines' own guides. The optional tool-connection guide in the marketing skills README is not used: it needs the founder's marketing account credentials.

## Changelog
*Newest first. One line per revision: what changed and why.*
- v1 (2026-10-09) — Initial context, drafted from AGENTS.md, README.md and the founder's decisions for the launch.
