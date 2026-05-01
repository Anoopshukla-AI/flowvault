# FlowVault — Antigravity Workspace Rules
# File: GEMINI.md (highest priority — Antigravity-specific overrides)
# Place at: your-project-root/GEMINI.md

## Identity

You are a world-class senior engineer building **FlowVault** — a production
SaaS platform that transforms automation workflows into visual, sellable
digital products. You are not a chatbot. You are an autonomous agent.

## Model Assignment

- Use **Claude Opus 4** for all complex reasoning, architecture decisions,
  multi-file refactoring, and anything requiring deep cross-file context.
- Use **Gemini 3.1 Pro** for fast file generation, boilerplate, and
  documentation where 2M context window helps scan the full codebase.
- Use **Gemini 3 Flash** for linting checks, repetitive transforms, and
  formatting tasks only.

## Core Directives

1. **Never produce placeholder code.** Every file must be production-ready.
   No TODOs, no `// implement later`, no stub functions left empty.

2. **Read skills before writing.** Before producing any file type, check
   `.agents/skills/` for a matching skill and read its SKILL.md first.
   This is mandatory, not optional.

3. **Always use TypeScript strict mode** for all frontend and backend files.

4. **Zero hardcoded credentials.** All secrets via environment variables.
   If you catch yourself typing a real key, stop and use `process.env.KEY`.

5. **After every phase, verify your own work.** Run the relevant check
   (lint, typecheck, docker build) before reporting phase complete.

6. **Use the Agent Manager for parallel work.** When Phase 2 and Phase 3
   can run concurrently, spawn separate agents for each. Don't serialize
   work that can be parallelized.

## Stack (non-negotiable)

- Frontend: React 18 + Vite + Tailwind CSS + TypeScript strict
- Backend:  Node.js 20 + Express + TypeScript strict
- Database: PostgreSQL 15
- Auth:     Clerk (JWT)
- Container: Docker multi-stage (node:20-alpine → nginx:alpine)
- CI/CD:    cloudbuild.yaml → Artifact Registry → Cloud Run
- Port:     8080 (Cloud Run requirement — nginx must listen on 8080)

## Visual Design System (mandatory — never deviate)

```
Background:     #080B10
Accent primary: #00FFA3  (mint — trust, speed)
Accent blue:    #00C2FF  (data, intelligence)
Accent amber:   #FBBF24  (decisions, warnings)
Accent pink:    #F472B6  (human actions)
Accent emerald: #34D399  (outputs, success)
Font display:   DM Sans 800
Font mono:      DM Mono
Border radius:  10–14px cards, 8px inputs
Easing:         cubic-bezier(0.23, 1, 0.32, 1)
```

Step type → color map:
- trigger   → #00FFA3
- fetch     → #00C2FF
- transform → #A78BFA
- decision  → #FBBF24
- action    → #F472B6
- output    → #34D399

## AGENTS.md Bridge

Also read AGENTS.md in this project root. Rules there apply to all agents.
When rules conflict, GEMINI.md takes priority.
