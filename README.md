# FlowVault
<!-- pr-3 -->

**Transform automation workflows into visual, sellable digital products.**

FlowVault lets you connect workflows, watch them execute step-by-step with cinematic animations, and export a packaged, monetizable product bundle — with all credentials automatically redacted.

---

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop/)
- **gcloud CLI** — [Install](https://cloud.google.com/sdk/docs/install) (for GCP deployment only)

---

## Quick Start — Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-org/flowvault.git
cd flowvault
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables below)
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### 4. Start with Docker (includes PostgreSQL)

```bash
docker-compose up
```

This starts:
- **App** on [http://localhost:8080](http://localhost:8080)
- **PostgreSQL** on port 5432 (auto-initializes with `server/db/schema.sql`)

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all TypeScript files |
| `npm run typecheck` | Run TypeScript compiler (no emit) |
| `npm run server` | Start Express backend server |
| `npm run docker:build` | Build Docker image |
| `npm run docker:up` | Start Docker Compose stack |
| `npm run docker:size` | Check Docker image size |

---

## Environment Variables

Reference: [`.env.example`](.env.example)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://flowvault:flowvault@localhost:5432/flowvault` |
| `PORT` | Express server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `CLERK_SECRET_KEY` | Clerk auth secret key | — |
| `CLERK_PUBLISHABLE_KEY` | Clerk auth publishable key | — |
| `VITE_API_URL` | API base URL for frontend | `http://localhost:3001` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk key for frontend | — |
| `GCP_PROJECT_ID` | GCP project ID | — |
| `GCP_REGION` | GCP region | `us-central1` |
| `GCP_REPO` | Artifact Registry repo name | `flowvault-repo` |

---

## Project Structure

```
flowvault/
├── src/
│   ├── components/          # React UI components
│   │   ├── WorkflowSidebar.tsx
│   │   ├── StepCard.tsx
│   │   ├── WorkflowVisualizer.tsx
│   │   ├── ReplayTimeline.tsx
│   │   └── ExportPanel.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useWorkflowExecution.ts
│   ├── lib/                # Shared utilities
│   │   ├── redact.ts       # Client-side redaction engine
│   │   ├── api.ts          # Typed API client
│   │   └── export.ts       # Product bundle generation
│   ├── types/              # TypeScript interfaces
│   │   └── workflow.ts
│   ├── data/               # Demo/seed data
│   │   └── workflows.ts
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles + design tokens
├── server/
│   ├── db/
│   │   └── schema.sql      # PostgreSQL schema
│   ├── middleware/
│   │   └── redact.ts       # Server-side redaction
│   ├── routes/
│   │   ├── workflows.ts    # CRUD + execute endpoints
│   │   └── export.ts       # Product bundle export
│   └── index.ts            # Express server
├── scripts/
│   └── gcp-bootstrap.sh    # One-shot GCP setup
├── Dockerfile              # Multi-stage build
├── nginx.conf              # Nginx config (port 8080)
├── docker-compose.yml      # Local dev stack
├── cloudbuild.yaml         # GCP Cloud Build pipeline
├── tailwind.config.ts      # Design tokens
├── vite.config.ts          # Vite config
└── tsconfig.json           # TypeScript config
```

---

## Deployment to GCP Cloud Run

### First-Time Setup

```bash
# 1. Bootstrap GCP resources
chmod +x scripts/gcp-bootstrap.sh
./scripts/gcp-bootstrap.sh YOUR_PROJECT_ID us-central1

# 2. Build and deploy manually
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)

# 3. Check the deployment
gcloud run services describe flowvault --region=us-central1

# 4. Get the live URL
gcloud run services describe flowvault --region=us-central1 \
  --format="value(status.url)"
```

### Connect GitHub for Automatic Deploys

```bash
gcloud builds triggers create github \
  --repo-name=flowvault \
  --repo-owner=YOUR_GITHUB_USER \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml
```

After connecting, every push to `main` will automatically deploy via Cloud Build.

---

## Security

FlowVault implements **dual-layer redaction** to prevent credential leakage:

1. **Server-side** — Express middleware redacts request bodies before database writes
2. **Client-side** — `redact.ts` redacts data before display or export

Patterns detected and masked:
- API keys (OpenAI, Anthropic, AWS)
- Bearer tokens
- Private keys
- Service account JSON
- Email addresses
- Credit card numbers
- Phone numbers

All exported product bundles include a security attestation confirming redaction.

---

## License

Proprietary — All rights reserved.
