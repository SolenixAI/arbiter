# Issue tracker: Linear

Issues and specs for this repo live in **Linear**: workspace `solenix`, team `SOL`, initiative **Arbiter**, project **AGENTS.md MVP**.

Public bug reports and suggestions arrive as GitHub issues. A maintainer copies each accepted one into Linear and closes the GitHub issue with a link to the Linear issue.

Use the Linear MCP tools when the agent has them. Otherwise use the GraphQL API at `https://api.linear.app/graphql` with a personal API key in `LINEAR_API_KEY`.

## Conventions

- **Create an issue**: `save_issue` (MCP) or `issueCreate` with `teamId`, `projectId` (AGENTS.md MVP), `title`, `description` (Markdown).
- **Read an issue**: `get_issue` with its identifier, plus `list_comments`.
- **List issues**: `list_issues` filtered by project AGENTS.md MVP, with state and label filters.
- **Make an issue a sub-issue of a parent**: set `parentId` on the child. Linear shows sub-issues natively.
- **Comment on an issue**: `save_comment` / `commentCreate`.
- **Apply / remove labels**: update the issue's `labelIds`.
- **Close**: move it to Done or Canceled, with a comment that says why.

Each issue keeps its sources in Resources as links. Start needs 5 web-search sources (AGENTS.md section 3).

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a Linear issue in project AGENTS.md MVP.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single Linear issue with **child** issues as tickets.

- **Map**: one issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (`parentId`), labelled `wayfinder:<type>` (`research`, `prototype`, `grilling` or `task`). Once claimed, it is assigned to the driving agent or person.
- **Blocking**: Linear's native `blocks` / `blocked by` relations (`issueRelationCreate` with `type: blocks`). A ticket is unblocked when every blocker is Done or Canceled.
- **Frontier query**: the map's open sub-issues with no open blocker and no assignee; first in the map's sort order wins.
- **Claim**: assign the ticket to yourself. This is the first write of the session.
- **Resolve**: comment the answer, move the ticket to Done, then append a context pointer (gist and link) to the map's Decisions-so-far.
