# Project

<!-- Replace this section with a description of your project -->
This is a web project with Playwright for frontend testing.

## Stack

<!-- List your tech stack here, e.g.: -->
- Framework: (e.g. Next.js / SvelteKit / plain HTML)
- Styling: (e.g. Tailwind / CSS modules)
- Testing: Playwright (headless Chromium)

## Key Commands

```bash
npm run dev          # Start dev server
npx playwright test  # Run all tests (headless)
npx playwright test --reporter=line  # Compact output
npx playwright show-report           # View HTML report (local only)
```

## Development Principles

### Test-Driven Development
Always write the test first. The sequence is: write a failing test → confirm it fails → write the minimum code to make it pass → refactor. Do not write implementation code without a corresponding test already in place.

### Fail Loudly — No Silent Failures
Never swallow errors or insert graceful fallbacks that hide failures. If an API call fails, throw. If a database connection fails, throw. If an expected value is missing, throw. The program should crash visibly rather than limp forward in a broken state. Do not use patterns like `catch (e) { return null }` or `catch (e) { console.error(e) }` without re-throwing or explicitly halting execution. I need to know immediately when something goes wrong.

### Keep Code Simple
Prefer the simplest solution that works. Short functions with a single clear purpose. No abstraction before it's needed. If a function is getting long, that's a signal to stop and ask whether it should be split — not to keep adding to it.

### Debug Logging
Place concise, informative log statements at key points: after API calls return, after database operations complete, at the entry/exit of non-trivial functions, and wherever control flow branches in a way that isn't obvious. Logs should confirm success as well as failure — e.g. `console.log('[auth] token fetched for user', userId)` not just error logs. Use a consistent prefix format like `[module-name]` so logs are easy to scan.

## Testing Guidelines

- Tests live in `tests/`
- Always run headless (`headless: true` is set in playwright.config.ts)
- Target Chromium only to keep things fast
- When writing a new test, run it immediately to confirm it fails before writing the implementation
- Prefer `getByRole` and `getByLabel` selectors over CSS selectors

## Code Conventions

- Language: TypeScript — no `any` types
- `type` over `interface` unless declaration merging is needed
- Boolean variables: `is`, `has`, or `can` prefix — `isLoading`, `hasError`, `canSubmit`
- Event handlers: `handle` prefix — `handleSubmit`, `handleClick`
- Data fetching functions: `fetch` prefix — `fetchUser`, `fetchOrders`
- File naming: kebab-case — `user-profile.ts`, `auth-service.ts`
- Types: co-located in the same file unless shared, then `src/types/`
- Constants: SCREAMING_SNAKE_CASE for true constants, camelCase for config objects

## Command System

This project has a full set of slash commands in `.claude/commands/`.
Use `/help` to see all of them. When a command covers what is being
asked, suggest or use it rather than working ad hoc — the commands
encode the project's workflow and quality standards.

### Session lifecycle
- Start every session with `/pickup` to orient before doing anything
- End every session with `/ship` — this runs review, tests, debug
  loop, security audit, commit, and context snapshot in sequence
- Never commit manually — always use `/commit` or `/ship`

### Project lifecycle
- New project: `/kickoff` (once)
- Each sprint: `/sprint` (plans, builds, debugs, snapshots in one go)
- Opening a PR: `/pr`

### Orchestrators vs. primitives
The orchestrators (`/kickoff`, `/sprint`, `/ship`, `/execute`) chain
the primitives together. Reach for an orchestrator first. Drop down
to a primitive (`/tdd`, `/test`, `/debugloop`) when you need
fine-grained control mid-sprint.

| Orchestrators | Primitives |
|---|---|
| `/kickoff`, `/sprint`, `/ship`, `/execute` | `/tdd`, `/feature`, `/test`, `/debugloop` |
| `/persona` | `/review`, `/commit`, `/context` |

### Quality gates — always enforced
These run automatically inside `/ship` and `/sprint`. You can also
run them on demand:
- `/review` — checks against the four principles in this file
- `/debugloop` — deep type/logic/spec/coverage audit
- `/audit` — npm vulnerabilities + secrets + OWASP Top 10
- `/refactor` — complexity and duplication pass (run after 2–3 sprints)

### Full command reference

| Command | When to use it |
|---|---|
| `/pickup` | First thing every session — orients you instantly |
| `/kickoff` | Once, on a brand new project |
| `/interview` | Flesh out a new project idea → produces `ARCHITECTURE.md` |
| `/planfunction` | Plan all function signatures for the sprint → produces `SPRINT.md` |
| `/sprint` | Start of each sprint — plan + build + debug + snapshot |
| `/execute` | Build the current sprint plan using TDD throughout |
| `/feature` | Scaffold a new feature with failing tests first |
| `/tdd` | One focused TDD cycle for a single function |
| `/persona` | UX validation through user personas → Playwright tests → fixes |
| `/test` | Quick: run tests and fix failures (mid-work) |
| `/debugloop` | Deep: types + logic + spec + coverage audit (end of session) |
| `/review` | Pre-commit check against the four principles |
| `/refactor` | Complexity and duplication pass across the codebase |
| `/audit` | Security: npm vulnerabilities + secrets + OWASP Top 10 |
| `/ship` | End of session — review + test + debug + audit + commit + context |
| `/commit` | Conventional commit from current diff |
| `/pr` | Generate PR description from branch diff |
| `/context` | Snapshot full project state to `CONTEXT.md` |
