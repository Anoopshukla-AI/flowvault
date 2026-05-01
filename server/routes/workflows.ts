/**
 * FlowVault — Workflow Routes
 *
 * CRUD endpoints + execution trigger for workflows.
 * All handlers wrapped in try/catch → centralized error handler.
 * Request bodies validated with Zod.
 */

import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const StepTypeSchema = z.enum([
  'trigger',
  'fetch',
  'transform',
  'decision',
  'action',
  'output',
]);

const WorkflowStepSchema = z.object({
  step: z.number().int().positive(),
  type: StepTypeSchema,
  label: z.string().min(1).max(255),
  description: z.string().default(''),
  data: z.record(z.unknown()).default({}),
  sampleOutput: z.record(z.unknown()).default({}),
});

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  tagline: z.string().max(500).default(''),
  description: z.string().default(''),
  category: z.string().max(100).default('General'),
  price: z.string().max(20).default('$0'),
  estimatedTimeSaved: z.string().max(100).default(''),
  steps: z.array(WorkflowStepSchema).default([]),
});

const UpdateWorkflowSchema = CreateWorkflowSchema.partial();

// ─── In-Memory Store (replace with PostgreSQL in production) ────────────────

interface StoredWorkflow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  price: string;
  estimatedTimeSaved: string;
  steps: Array<{
    id: string;
    step: number;
    type: string;
    label: string;
    description: string;
    data: Record<string, unknown>;
    sampleOutput: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
}

const store: Map<string, StoredWorkflow> = new Map();

// Seed with demo data
const seedData: StoredWorkflow = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Lead Enrichment Pipeline',
  tagline: 'Automatically enrich and qualify inbound leads from any source',
  description: 'Captures incoming leads, enriches with company data, scores, routes to CRM, and notifies the team.',
  category: 'Sales Automation',
  price: '$49',
  estimatedTimeSaved: '45 min per lead',
  steps: [
    { id: uuidv4(), step: 1, type: 'trigger', label: 'Webhook Received', description: 'Captures incoming lead data.', data: {}, sampleOutput: { name: 'Jane Smith', company: 'Acme Corp' } },
    { id: uuidv4(), step: 2, type: 'fetch', label: 'Enrich with Clearbit', description: 'Fetches company data.', data: {}, sampleOutput: { industry: 'SaaS', funding: '$12M' } },
    { id: uuidv4(), step: 3, type: 'transform', label: 'Calculate Lead Score', description: 'Applies scoring logic.', data: {}, sampleOutput: { score: 87, tier: 'A' } },
    { id: uuidv4(), step: 4, type: 'decision', label: 'Route by Score', description: 'Routes by score threshold.', data: {}, sampleOutput: { route: 'high_value' } },
    { id: uuidv4(), step: 5, type: 'action', label: 'Create in Salesforce', description: 'Creates CRM record.', data: {}, sampleOutput: { status: 'created' } },
    { id: uuidv4(), step: 6, type: 'output', label: 'Notify Sales Team', description: 'Sends Slack notification.', data: {}, sampleOutput: { delivered: true } },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
store.set(seedData.id, seedData);

// ─── GET / — List all workflows ─────────────────────────────────────────────

router.get('/', (_req, res, next) => {
  try {
    const workflows = Array.from(store.values());
    res.json({ data: workflows, error: undefined, meta: { count: workflows.length } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id — Get single workflow ─────────────────────────────────────────

router.get('/:id', (req, res, next) => {
  try {
    const workflow = store.get(req.params.id ?? '');
    if (!workflow) {
      res.status(404).json({ data: null, error: 'Workflow not found' });
      return;
    }
    res.json({ data: workflow });
  } catch (err) {
    next(err);
  }
});

// ─── POST / — Create workflow ───────────────────────────────────────────────

router.post('/', (req, res, next) => {
  try {
    const parsed = CreateWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ data: null, error: parsed.error.message });
      return;
    }

    const now = new Date().toISOString();
    const workflow: StoredWorkflow = {
      id: uuidv4(),
      ...parsed.data,
      steps: parsed.data.steps.map((s) => ({ ...s, id: uuidv4() })),
      createdAt: now,
      updatedAt: now,
    };

    store.set(workflow.id, workflow);
    res.status(201).json({ data: workflow });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id — Update workflow ─────────────────────────────────────────────

router.put('/:id', (req, res, next) => {
  try {
    const existing = store.get(req.params.id ?? '');
    if (!existing) {
      res.status(404).json({ data: null, error: 'Workflow not found' });
      return;
    }

    const parsed = UpdateWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ data: null, error: parsed.error.message });
      return;
    }

    const updated: StoredWorkflow = {
      ...existing,
      ...parsed.data,
      steps: parsed.data.steps
        ? parsed.data.steps.map((s) => ({ ...s, id: uuidv4() }))
        : existing.steps,
      updatedAt: new Date().toISOString(),
    };

    store.set(updated.id, updated);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id — Delete workflow ──────────────────────────────────────────

router.delete('/:id', (req, res, next) => {
  try {
    const existed = store.delete(req.params.id ?? '');
    if (!existed) {
      res.status(404).json({ data: null, error: 'Workflow not found' });
      return;
    }
    res.json({ data: null, meta: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /:id/execute — Execute workflow ───────────────────────────────────

router.post('/:id/execute', (req, res, next) => {
  try {
    const workflow = store.get(req.params.id ?? '');
    if (!workflow) {
      res.status(404).json({ data: null, error: 'Workflow not found' });
      return;
    }

    const executionId = uuidv4();
    const now = new Date().toISOString();

    const stepLogs = workflow.steps.map((step) => ({
      stepId: step.id,
      stepNumber: step.step,
      status: 'done' as const,
      startedAt: now,
      completedAt: now,
      durationMs: Math.floor(Math.random() * 2000) + 500,
      input: step.data,
      output: step.sampleOutput,
      errorMessage: null,
    }));

    const totalDurationMs = stepLogs.reduce((sum, log) => sum + log.durationMs, 0);

    const execution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'completed' as const,
      startedAt: now,
      completedAt: now,
      totalDurationMs,
      stepLogs,
    };

    res.json({ data: execution });
  } catch (err) {
    next(err);
  }
});

export { router as workflowsRouter };
