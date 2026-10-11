# Terminus

A terminus is a limit this repo cannot remove or control ([AGENTS.md §7](AGENTS.md#7-time-matters)). An avoidable hit is the failure. The repo cannot move these events; it keeps its work from hitting them through every vector it controls, and minimizes the harm of a hit it cannot avoid.

## Paths that other tools control

| Path | Controlled by | Why it sits here |
|---|---|---|
| `AGENTS.md` | Every agent harness | Harnesses read the instructions file at the root. |
| `README.md`, `LICENSE` | GitHub | GitHub shows them on the repo page. |
| `CHANGELOG.md`, `release-please-config.json`, `.release-please-manifest.json` | release-please | It writes releases and the changelog. |
| `PRODUCT.md` | Impeccable Design | Its skill reads product context at the root. |
| `skills-lock.json` | The `skills` CLI | It records the installed engine skills. |
| `.github/` | GitHub | Workflows, issue forms and Dependabot. |
| `.agents/`, `.claude/`, `.cursor/`, `.codex/` | Each agent harness | Each harness loads skills and hooks from its own folder. |
| `.gitignore` | git | git reads it at the root. |

## Events that others control

| Event | Controlled by | How this repo pushes on it |
|---|---|---|
| A new engine release | The engines' authors | CI checks the skills; `npx skills update` brings them current. |
| A change in how harnesses read `AGENTS.md` | Each harness vendor | The README names only the readers it has verified. |
| A usage or session limit of the agent doing the work | The model provider | Small pull requests, one at a time, so work never stops half-done. |
