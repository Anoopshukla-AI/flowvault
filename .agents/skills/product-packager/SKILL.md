---
name: product-packager
description: >
  Activate when implementing the export pipeline, product packaging,
  or any feature that bundles a workflow into a shareable asset.
  Defines the exact output schema, pricing logic, and bundle structure.
---

# Product Packager Skill — FlowVault

## What a Product Bundle Is

A FlowVault product bundle is a structured JSON file that contains
everything a buyer needs to understand, set up, and use an automation
workflow — without seeing any sensitive data.

It is the monetizable output of FlowVault. Treat it like a product listing
on a marketplace: clear, complete, professional, and self-contained.

## Bundle Schema (TypeScript)

```typescript
interface ProductBundle {
  // Metadata
  id: string;                    // UUID
  version: '1.0';
  generated_at: string;          // ISO 8601
  generated_by: 'FlowVault';

  // Product identity
  product: {
    name: string;                // e.g. "Lead Enrichment Pipeline"
    category: string;            // e.g. "Sales Automation"
    description: string;
    tagline: string;             // 1-line sell copy
    price: string;               // e.g. "$49"
    estimated_time_saved: string; // e.g. "45 min per lead"
  };

  // Technical requirements
  requirements: {
    integrations: Array<{
      name: string;              // e.g. "Salesforce"
      auth_type: 'api_key' | 'oauth' | 'webhook';
      setup_url?: string;
      required: boolean;
    }>;
    env_variables: Array<{
      key: string;               // e.g. "SALESFORCE_API_KEY"
      description: string;
      example: string;           // NEVER a real value — always placeholder
    }>;
  };

  // Step-by-step workflow definition (redacted)
  workflow: {
    total_steps: number;
    avg_execution_time_ms: number;
    steps: Array<{
      step: number;
      type: 'trigger' | 'fetch' | 'transform' | 'decision' | 'action' | 'output';
      label: string;
      description: string;
      sample_output: Record<string, unknown>; // MUST be redacted
    }>;
  };

  // Demo replay data
  demo: {
    has_recording: boolean;
    execution_id?: string;       // reference to stored replay
    highlights: string[];        // 3–5 bullet points of what the demo shows
  };

  // Security attestation
  security: {
    redacted: true;              // always true — never false
    redaction_version: string;
    sensitive_fields_masked: number;
    attestation: 'All credentials, tokens, and PII have been automatically redacted by FlowVault before export.';
  };
}
```

## Export Function Signature

```typescript
// src/lib/export.ts
export async function generateProductBundle(
  workflow: Workflow,
  execution: WorkflowExecution,
): Promise<ProductBundle>

export function downloadBundle(bundle: ProductBundle): void
// → triggers browser download of flowvault-{workflow.id}-bundle.json

export function copyBundleToClipboard(bundle: ProductBundle): Promise<void>
```

## Pricing Display Rules

- Price is always set by the workflow creator — never auto-calculated
- Display format: `$XX` or `$XX/mo` — no cents
- Show price prominently in the product card header
- Show price in the export bundle metadata

## Bundle Quality Checklist

Before allowing export, verify:
- [ ] `security.redacted` is `true`
- [ ] No step sample_output contains any raw API key pattern
- [ ] All env_variable examples are placeholders (`YOUR_API_KEY_HERE`)
- [ ] `generated_at` is current timestamp
- [ ] `attestation` string is present verbatim

## File Naming Convention

Downloaded files should be named:
```
flowvault-{workflow-slug}-{YYYYMMDD}.json
```
Example: `flowvault-lead-enrichment-pipeline-20260427.json`
