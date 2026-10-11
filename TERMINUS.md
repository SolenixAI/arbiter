# Terminus

A terminus is unavoidable, uncontrollable and unpredictable ([AGENTS.md §7](AGENTS.md#7-time-matters)). This repo cannot remove these items. It can only push on their time to terminus from what it controls.

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
| `package.json`, `package-lock.json` | npm | npm reads them to install the experis tools. CI runs `npm ci`. |
| `tsconfig.json` | TypeScript | `tsc` reads it for the strict typecheck of `experis/`. |

## Events that others control

| Event | Controlled by | How this repo pushes on it |
|---|---|---|
| A new engine release | The engines' authors | CI checks the skills; `npx skills update` brings them current. |
| A change in how harnesses read `AGENTS.md` | Each harness vendor | The README names only the readers it has verified. |
| A usage or session limit of the agent doing the work | The model provider | Small pull requests, one at a time, so work never stops half-done. |
