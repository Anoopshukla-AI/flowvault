# FlowVault — Shared Agent Rules
# File: AGENTS.md (works across Antigravity, Cursor, Claude Code)
# Place at: your-project-root/AGENTS.md

## Project

**FlowVault** — transforms automation workflows into visual, sellable
digital products. Users connect workflows, watch them execute step-by-step
with cinematic animations, and export a packaged, monetizable product bundle.

## Agent Team

This project uses a 4-agent team defined in `.agents/agents.md`.
Each agent has a role. Read that file before starting any task.

## Coding Standards

### TypeScript
- `strict: true` in tsconfig.json — no exceptions
- Explicit return types on all exported functions
- No `any` — use `unknown` and narrow properly
- Interface names: PascalCase, prefix `I` only for class contracts

### React
- Functional components only — no class components
- Custom hooks in `/src/hooks/` prefixed with `use`
- Props interfaces defined above each component
- No inline styles — Tailwind utility classes only
- All interactive elements need ARIA labels

### Node/Express
- Async/await only — no raw Promise chains or callbacks
- All route handlers wrapped in try/catch → centralized error handler
- Input validation with Zod on all request bodies
- Response shape: `{ data, error, meta }` — consistent across all routes

### File Naming
- Components: PascalCase (`WorkflowVisualizer.tsx`)
- Hooks: camelCase with `use` prefix (`useWorkflowExecution.ts`)
- Utils/lib: camelCase (`redact.ts`, `api.ts`)
- Types: PascalCase in `/src/types/` (`workflow.ts`)
- Routes: kebab-case (`/routes/workflow-export.ts`)

## Security Rules (non-negotiable)

- Redact engine must run server-side before any DB write
- Redact engine must run client-side before any display of returned data
- Patterns to catch:
  - `/sk-[A-Za-z0-9]{20,}/g` → API keys
  - `/Bearer\s[A-Za-z0-9\-._~+\/]+=*/g` → Bearer tokens
  - `/-----BEGIN[^-]+-----[\s\S]+?-----END[^-]+-----/g` → Private keys
  - `/AKIA[0-9A-Z]{16}/g` → AWS access keys
  - `/"type":\s*"service_account"/` → GCP service account JSON
  - `/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g` → Emails
  - `/\b\d{16}\b/g` → Card numbers

## Docker Rules

- Final image MUST be < 150MB — check with `docker images` after build
- nginx must listen on port 8080
- Health check: `GET /health` → `200 { "status": "ok" }`
- `.dockerignore` must exclude: `node_modules .git .env* *.log dist`
- Multi-stage: builder (`node:20-alpine`) → serve (`nginx:alpine`)

## Git Commit Format

```
type(scope): subject

body (optional)

BREAKING CHANGE: (if applicable)
```
Types: feat, fix, chore, docs, style, refactor, test, ci

## Definition of Done

A task is NOT done until:
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] ESLint passes with zero warnings
- [ ] `npm run build` succeeds
- [ ] Docker build succeeds and image is < 150MB
- [ ] All new functions have JSDoc comments
- [ ] No `console.log` left in production code (use proper logger)
