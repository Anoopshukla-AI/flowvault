---
name: docker-deploy
description: >
  Activate when writing Dockerfile, docker-compose.yml, cloudbuild.yaml,
  nginx.conf, or any GitHub Actions workflow. Contains Cloud Run constraints,
  image size targets, and GCP-specific patterns. MANDATORY before any
  deployment file.
---

# Docker & Deploy Skill — FlowVault

## Critical Constraints

1. **nginx port: 8080** — Cloud Run does NOT allow port 80. Always 8080.
2. **Image size: < 150MB** — multi-stage build is required, not optional.
3. **Health check: GET /health → 200** — Cloud Run uses this for readiness.
4. **No secrets in YAML** — use `_SUBSTITUTION` vars or Secret Manager.

## Dockerfile Pattern (copy exactly)

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps separately for layer caching
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS serve
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check endpoint (Cloud Run requirement)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## nginx.conf (copy exactly — port 8080 non-negotiable)

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check for Cloud Run
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

## .dockerignore (copy exactly)

```
node_modules
.git
.gitignore
.env
.env.*
*.log
dist
.DS_Store
README.md
docs/
.github/
```

## cloudbuild.yaml Pattern

```yaml
steps:
  # 1. Install dependencies
  - name: 'node:20-alpine'
    entrypoint: npm
    args: ['ci', '--prefer-offline']

  # 2. Lint
  - name: 'node:20-alpine'
    entrypoint: npm
    args: ['run', 'lint']

  # 3. TypeScript check
  - name: 'node:20-alpine'
    entrypoint: npm
    args: ['run', 'typecheck']

  # 4. Build
  - name: 'node:20-alpine'
    entrypoint: npm
    args: ['run', 'build']

  # 5. Docker build + tag
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/flowvault:$SHORT_SHA'
      - -t
      - '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/flowvault:latest'
      - .

  # 6. Push all tags
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/flowvault']

  # 7. Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - flowvault
      - --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/flowvault:$SHORT_SHA
      - --region=$_REGION
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
      - --memory=512Mi
      - --cpu=1

substitutions:
  _REGION: us-central1
  _REPO: flowvault-repo

options:
  logging: CLOUD_LOGGING_ONLY

timeout: '1200s'
```

## docker-compose.yml (local dev)

```yaml
version: '3.9'
services:
  app:
    build: .
    ports:
      - '8080:8080'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://flowvault:flowvault@db:5432/flowvault
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: flowvault
      POSTGRES_PASSWORD: flowvault
      POSTGRES_DB: flowvault
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U flowvault']
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
```

## Image Size Verification

After docker build, ALWAYS run:
```bash
docker images flowvault:test --format "{{.Size}}"
```
If > 150MB:
1. Check `npm ci` vs `npm install` (ci is smaller)
2. Verify multi-stage is actually being used
3. Add `--no-cache` to npm install in builder
4. Use `.dockerignore` to exclude large directories
