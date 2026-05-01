# FlowVault — Product Specification

## What is FlowVault?

FlowVault is a SaaS platform that transforms automation workflows into **visual, sellable digital products**.

Users connect their automation workflows (from n8n, Zapier, Make, or custom pipelines), watch them execute step-by-step with cinematic animations, and then export a packaged, monetizable product bundle — with all sensitive credentials automatically redacted.

---

## The Problem

Automation creators build powerful workflows but have no way to:

1. **Showcase** them visually to potential buyers
2. **Package** them as self-contained, ready-to-deploy products
3. **Sell** them safely without exposing API keys, tokens, or credentials
4. **Demo** the execution flow in real-time with professional animations

They're sitting on valuable intellectual property with no way to monetize it.

---

## The Solution

FlowVault provides:

### 🎬 Cinematic Execution Replay
Watch workflows execute step-by-step with color-coded animations. Each step type (trigger, fetch, transform, decision, action, output) has its own visual identity. Running steps glow and shimmer. Completed steps show data chips with key-value pairs.

### 🔐 Automatic Redaction
Every API key, bearer token, private key, email, and credit card number is automatically detected and masked — on both the server and client sides. Exported bundles include a security attestation.

### 📦 Product Bundle Export
One-click export generates a complete `ProductBundle` JSON file containing:
- Product metadata (name, category, price, tagline)
- Technical requirements (integrations, env variables)
- Step-by-step workflow definition (redacted)
- Demo replay data
- Security attestation

### 💰 Marketplace-Ready
Bundles are designed to be listed on digital marketplaces. They include pricing, time-saved estimates, and buyer-friendly documentation.

---

## Target Audience

| Segment | Use Case |
|---------|----------|
| **Automation Consultants** | Package client solutions as reusable products |
| **SaaS Builders** | Create workflow templates for their platforms |
| **No-Code Creators** | Monetize Zapier/Make workflows |
| **Agencies** | Standardize and sell automation playbooks |

---

## Pricing Strategy

FlowVault is the platform. Individual workflow bundles are priced by their creators.

### Platform Pricing (suggested)
| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 3 workflows, basic export |
| **Pro** | $29/mo | Unlimited workflows, custom branding, analytics |
| **Team** | $79/mo | Team collaboration, API access, priority support |

### Bundle Pricing (set by creators)
- Typical range: **$19 – $149** per workflow bundle
- Pricing displayed as whole dollars (no cents): `$49`, `$79/mo`

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + TypeScript |
| Backend | Node.js 20 + Express + TypeScript |
| Database | PostgreSQL 15 |
| Auth | Clerk (JWT) |
| Container | Docker (node:20-alpine → nginx:alpine) |
| CI/CD | GitHub Actions → Cloud Build → Cloud Run |
| Hosting | Google Cloud Run |

---

## Visual Design

FlowVault's UI is **cinematic and precise** — dark, intelligent, surgical.

- **Background**: `#080B10` (near-black)
- **Primary accent**: `#00FFA3` (mint — trust, speed)
- **Typography**: DM Sans (display) + DM Mono (data)
- **Animations**: Smooth `cubic-bezier(0.23, 1, 0.32, 1)` easing
- **Step colors**: Each step type has a unique color identity

---

## Competitive Advantage

1. **No one else does this.** There's no "Gumroad for automation workflows."
2. **Security-first.** Dual-layer redaction is a genuine differentiator.
3. **Beautiful by default.** The cinematic UI sells the product before the buyer reads a word.
4. **Self-contained bundles.** Buyers get everything they need in one JSON file.

---

## Roadmap

### Phase 1 (Current) — Core Platform
- [x] Workflow visualization with cinematic animations
- [x] Step-by-step execution replay
- [x] Product bundle export with redaction
- [x] 3 demo workflows

### Phase 2 — Marketplace
- [ ] Public marketplace for workflow bundles
- [ ] Creator profiles and storefronts
- [ ] Stripe payment integration
- [ ] Bundle ratings and reviews

### Phase 3 — Integrations
- [ ] n8n workflow import
- [ ] Zapier workflow import
- [ ] Make (Integromat) workflow import
- [ ] Custom API connectors

### Phase 4 — Enterprise
- [ ] Team workspaces
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Custom branding / white-label
