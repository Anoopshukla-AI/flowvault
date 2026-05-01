---
description: >
  Build the complete FlowVault product from scratch. Orchestrates the full
  4-agent pipeline across 6 phases. Use: /buildflowvault
---

# FlowVault Full Build Orchestration

You are orchestrating a complete production build of FlowVault.
Activate agents in sequence. Do not skip phases. Do not mark a phase
complete until all its deliverables exist and pass verification.

---

## PHASE 1 — Architecture & Foundation

**Activate:** @architect

Tasks:
1. Read `.agents/skills/redaction-engine/SKILL.md`
2. Read `.agents/skills/product-packager/SKILL.md`
3. Produce: `src/types/workflow.ts` — all TypeScript interfaces
4. Produce: `server/db/schema.sql` — PostgreSQL schema
5. Produce: `.env.example` — all required environment variables
6. Produce ASCII architecture diagram in chat
7. **PAUSE — get user approval before Phase 2 begins**

Deliverables:
- [ ] `src/types/workflow.ts`
- [ ] `server/db/schema.sql`
- [ ] `.env.example`
- [ ] Architecture approved by user

---

## PHASE 2 — Backend API

**Activate:** @engineer

Pre-check: Phase 1 deliverables exist. Read `.agents/skills/redaction-engine/SKILL.md`.

Tasks:
1. `server/index.ts` — Express app with middleware setup
2. `server/middleware/redact.ts` — server-side redaction middleware
3. `server/routes/workflows.ts` — CRUD + execute endpoints
4. `server/routes/export.ts` — product bundle export endpoint
5. `src/lib/redact.ts` — client-side redaction engine
6. `src/lib/api.ts` — typed API client

Verification:
- Run `tsc --noEmit` on all server files
- Fix all errors before reporting done

Deliverables:
- [ ] `server/index.ts`
- [ ] `server/middleware/redact.ts`
- [ ] `server/routes/workflows.ts`
- [ ] `server/routes/export.ts`
- [ ] `src/lib/redact.ts`
- [ ] `src/lib/api.ts`
- [ ] Zero TypeScript errors

---

## PHASE 3 — Frontend (run in parallel with Phase 2 if possible)

**Activate:** @engineer (separate agent instance)

Pre-check: Read `.agents/skills/frontend-design/SKILL.md` FIRST.

Tasks:
1. `src/App.tsx` — root with routing and layout
2. `src/components/WorkflowSidebar.tsx` — workflow selector list
3. `src/components/StepCard.tsx` — individual animated step
4. `src/components/WorkflowVisualizer.tsx` — full execution view
5. `src/components/ReplayTimeline.tsx` — scrubable timeline
6. `src/components/ExportPanel.tsx` — product packaging UI
7. `src/hooks/useWorkflowExecution.ts` — execution state logic
8. `tailwind.config.ts` — design tokens
9. `vite.config.ts` — optimized build

Design verification:
- Step cards use exact colors from GEMINI.md
- Running steps glow with box-shadow using matching rgba
- Fonts are DM Sans + DM Mono (not system fonts)
- Ambient gradient glows in background

Accessibility verification:
- All interactive elements have aria-label
- Tab navigation works on all cards and buttons
- Focus rings visible with `focus-visible:ring-2`

Deliverables:
- [ ] All 7 components created
- [ ] `tailwind.config.ts` with design tokens
- [ ] `vite.config.ts`
- [ ] Zero TypeScript errors
- [ ] `npm run build` succeeds

---

## PHASE 4 — Deployment Files

**Activate:** @devops

Pre-check: Read `.agents/skills/docker-deploy/SKILL.md` FIRST.

Tasks:
1. `Dockerfile` — multi-stage, < 150MB
2. `nginx.conf` — port 8080, health check route
3. `.dockerignore` — proper exclusions
4. `docker-compose.yml` — local dev with postgres
5. `cloudbuild.yaml` — full GCP pipeline
6. `.github/workflows/ci.yml` — PR validation
7. `.github/workflows/deploy.yml` — production trigger
8. `scripts/gcp-bootstrap.sh` — one-shot GCP setup script

Verification (MANDATORY — actually run these):
```bash
docker build -t flowvault:test .
docker images flowvault:test --format "{{.Size}}"
# Must show < 150MB
```

Deliverables:
- [ ] `Dockerfile`
- [ ] `nginx.conf`
- [ ] `.dockerignore`
- [ ] `docker-compose.yml`
- [ ] `cloudbuild.yaml`
- [ ] `.github/workflows/ci.yml`
- [ ] `.github/workflows/deploy.yml`
- [ ] `scripts/gcp-bootstrap.sh`
- [ ] Docker build confirmed successful
- [ ] Image size confirmed < 150MB

---

## PHASE 5 — Documentation

**Activate:** @engineer

Tasks:
1. `README.md` — setup, local dev, deployment guide
2. `PRODUCT_SPEC.md` — what FlowVault is, positioning, how to sell it
3. `package.json` — all scripts: dev, build, lint, typecheck, test
4. `tsconfig.json` — strict mode

README must include:
- Prerequisites (Node 20, Docker, gcloud CLI)
- Local dev: `docker-compose up`
- First run setup
- GitHub → Cloud Build connection steps
- All environment variables (reference .env.example)

Deliverables:
- [ ] `README.md`
- [ ] `PRODUCT_SPEC.md`
- [ ] `package.json` with all scripts
- [ ] `tsconfig.json` strict

---

## PHASE 6 — QA & Sign-off

**Activate:** @qa

Run the full audit checklist from `.agents/agents.md`:
- [ ] `tsc --noEmit` → zero errors
- [ ] `npm run lint` → zero warnings
- [ ] `npm run build` → succeeds
- [ ] Docker build → succeeds
- [ ] Image size → < 150MB
- [ ] Health endpoint → 200
- [ ] Redaction test cases pass
- [ ] All interactive UI: aria-label present
- [ ] `.env.example` documents every `process.env.` reference in code
- [ ] No `console.log` in production code
- [ ] No hardcoded secrets anywhere

**Report format:**
```
PHASE 6 COMPLETE
================
Files created: {N}
TypeScript errors: 0
ESLint warnings: 0
Docker image size: {X}MB
P0 issues found: {N}
P1 issues found: {N}
Status: SHIP / BLOCKED
```

If BLOCKED: list P0 issues and re-activate @engineer to fix.
If SHIP: provide exact gcloud commands to deploy.

---

## Final Deliverable Summary

When all phases pass, output:
1. Complete file tree of everything created
2. Docker image size
3. Exact gcloud commands for first deploy
4. URL where the live product will be accessible
