#!/usr/bin/env bash
# ============================================================================
# FlowVault — GCP Bootstrap Script
# One-shot setup for Google Cloud Platform services.
# Run this ONCE when setting up a new GCP project for FlowVault.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - A GCP project already created
#
# Usage:
#   chmod +x scripts/gcp-bootstrap.sh
#   ./scripts/gcp-bootstrap.sh <PROJECT_ID> [REGION]
# ============================================================================

set -euo pipefail

PROJECT_ID="${1:?Error: PROJECT_ID is required. Usage: ./gcp-bootstrap.sh <PROJECT_ID> [REGION]}"
REGION="${2:-us-central1}"
REPO_NAME="flowvault-repo"
SERVICE_NAME="flowvault"

echo "═══════════════════════════════════════════════════════════════"
echo "  FlowVault — GCP Bootstrap"
echo "  Project:  $PROJECT_ID"
echo "  Region:   $REGION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Set project ──────────────────────────────────────────────────────────────
echo "→ Setting active project..."
gcloud config set project "$PROJECT_ID"

# ── Enable required APIs ────────────────────────────────────────────────────
echo "→ Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

echo "  ✓ APIs enabled"

# ── Create Artifact Registry repository ──────────────────────────────────────
echo "→ Creating Artifact Registry repository..."
if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
  echo "  ✓ Repository already exists"
else
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="FlowVault Docker images"
  echo "  ✓ Repository created"
fi

# ── Grant Cloud Build permissions ────────────────────────────────────────────
echo "→ Setting IAM bindings for Cloud Build..."

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Cloud Build → Cloud Run deployer
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin" \
  --quiet

# Cloud Build → Service Account user (to deploy to Cloud Run)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

# Cloud Build → Artifact Registry writer
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer" \
  --quiet

echo "  ✓ IAM bindings configured"

# ── Configure Docker for Artifact Registry ───────────────────────────────────
echo "→ Configuring Docker authentication..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
echo "  ✓ Docker configured"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ GCP Bootstrap Complete!"
echo ""
echo "  Artifact Registry:"
echo "    ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/flowvault"
echo ""
echo "  Next steps:"
echo "    1. Connect GitHub repo to Cloud Build:"
echo "       gcloud builds triggers create github \\"
echo "         --repo-name=flowvault --repo-owner=<YOUR_GITHUB_USER> \\"
echo "         --branch-pattern='^main$' \\"
echo "         --build-config=cloudbuild.yaml"
echo ""
echo "    2. Deploy manually (first time):"
echo "       gcloud builds submit --config=cloudbuild.yaml"
echo ""
echo "    3. Check deployment:"
echo "       gcloud run services describe $SERVICE_NAME --region=$REGION"
echo "═══════════════════════════════════════════════════════════════"
