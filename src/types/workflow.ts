/**
 * FlowVault — Core Type Definitions
 *
 * All TypeScript interfaces and types for the FlowVault platform.
 * These types are shared between the frontend (React) and backend (Express).
 */

// ─── Step Types ──────────────────────────────────────────────────────────────

/** The category of a workflow step, determines color coding and icon */
export type StepType =
  | 'trigger'
  | 'fetch'
  | 'transform'
  | 'decision'
  | 'action'
  | 'output';

/** Execution status of an individual step */
export type StepStatus = 'pending' | 'running' | 'done' | 'error';

/** Execution status of an entire workflow */
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed';

// ─── Step Color Map ──────────────────────────────────────────────────────────

/** Maps each step type to its design-system color token */
export const STEP_COLOR_MAP: Record<StepType, string> = {
  trigger: '#00FFA3',
  fetch: '#00C2FF',
  transform: '#A78BFA',
  decision: '#FBBF24',
  action: '#F472B6',
  output: '#34D399',
} as const;

/** Maps each step type to its glow (35% opacity) color token */
export const STEP_GLOW_MAP: Record<StepType, string> = {
  trigger: 'rgba(0,255,163,0.35)',
  fetch: 'rgba(0,194,255,0.35)',
  transform: 'rgba(167,139,250,0.35)',
  decision: 'rgba(251,191,36,0.35)',
  action: 'rgba(244,114,182,0.35)',
  output: 'rgba(52,211,153,0.35)',
} as const;

// ─── Workflow Domain ─────────────────────────────────────────────────────────

/** A single step within a workflow definition */
export interface WorkflowStep {
  /** Unique step identifier (UUID) */
  id: string;
  /** The step number (1-indexed position in the workflow) */
  step: number;
  /** Category of this step — determines color and icon */
  type: StepType;
  /** Human-readable short label */
  label: string;
  /** Longer description of what this step does */
  description: string;
  /** Arbitrary data payload attached to this step */
  data: Record<string, unknown>;
  /** Sample output data (used in product bundle — always redacted) */
  sampleOutput: Record<string, unknown>;
}

/** A complete workflow definition */
export interface Workflow {
  /** Unique workflow identifier (UUID) */
  id: string;
  /** Display name */
  name: string;
  /** Short tagline — 1-line sell copy */
  tagline: string;
  /** Full description of the workflow */
  description: string;
  /** Category for grouping (e.g. "Sales Automation", "Team Ops") */
  category: string;
  /** Price as display string (e.g. "$49") */
  price: string;
  /** Estimated time saved per run (e.g. "45 min per lead") */
  estimatedTimeSaved: string;
  /** Ordered list of steps in this workflow */
  steps: WorkflowStep[];
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

// ─── Execution Domain ────────────────────────────────────────────────────────

/** Log entry for a single step during execution */
export interface ExecutionStepLog {
  /** Reference to the step ID */
  stepId: string;
  /** Step number (1-indexed) */
  stepNumber: number;
  /** Current status of this step in the execution */
  status: StepStatus;
  /** ISO 8601 timestamp when this step started */
  startedAt: string | null;
  /** ISO 8601 timestamp when this step completed */
  completedAt: string | null;
  /** Duration in milliseconds */
  durationMs: number | null;
  /** Input data passed to this step (redacted) */
  input: Record<string, unknown>;
  /** Output data produced by this step (redacted) */
  output: Record<string, unknown>;
  /** Error message if step failed */
  errorMessage: string | null;
}

/** A single execution run of a workflow */
export interface WorkflowExecution {
  /** Unique execution identifier (UUID) */
  id: string;
  /** Reference to the workflow being executed */
  workflowId: string;
  /** Overall execution status */
  status: WorkflowStatus;
  /** ISO 8601 timestamp when execution started */
  startedAt: string;
  /** ISO 8601 timestamp when execution completed */
  completedAt: string | null;
  /** Total duration in milliseconds */
  totalDurationMs: number | null;
  /** Per-step execution logs */
  stepLogs: ExecutionStepLog[];
}

// ─── Product Bundle (Export) ─────────────────────────────────────────────────

/** Integration requirement for a product bundle */
export interface BundleIntegration {
  /** Service name (e.g. "Salesforce") */
  name: string;
  /** Authentication type required */
  authType: 'api_key' | 'oauth' | 'webhook';
  /** URL to setup documentation */
  setupUrl?: string;
  /** Whether this integration is required vs optional */
  required: boolean;
}

/** Environment variable required by a product bundle */
export interface BundleEnvVariable {
  /** Variable key (e.g. "SALESFORCE_API_KEY") */
  key: string;
  /** Human-readable description */
  description: string;
  /** Placeholder example — NEVER a real value */
  example: string;
}

/** A step as represented in the product bundle (redacted) */
export interface BundleStep {
  /** Step number (1-indexed) */
  step: number;
  /** Step type */
  type: StepType;
  /** Display label */
  label: string;
  /** Description of what this step does */
  description: string;
  /** Sample output data — MUST be redacted before export */
  sampleOutput: Record<string, unknown>;
}

/** The complete product bundle — the monetizable output of FlowVault */
export interface ProductBundle {
  /** Unique bundle identifier (UUID) */
  id: string;
  /** Schema version */
  version: '1.0';
  /** ISO 8601 timestamp of generation */
  generatedAt: string;
  /** Generator identifier */
  generatedBy: 'FlowVault';

  /** Product identity and marketing metadata */
  product: {
    name: string;
    category: string;
    description: string;
    tagline: string;
    price: string;
    estimatedTimeSaved: string;
  };

  /** Technical requirements for buyers */
  requirements: {
    integrations: BundleIntegration[];
    envVariables: BundleEnvVariable[];
  };

  /** Step-by-step workflow definition (redacted) */
  workflow: {
    totalSteps: number;
    avgExecutionTimeMs: number;
    steps: BundleStep[];
  };

  /** Demo replay data */
  demo: {
    hasRecording: boolean;
    executionId?: string;
    highlights: string[];
  };

  /** Security attestation — redacted is always true */
  security: {
    redacted: true;
    redactionVersion: string;
    sensitiveFieldsMasked: number;
    attestation: 'All credentials, tokens, and PII have been automatically redacted by FlowVault before export.';
  };
}

// ─── API Response ────────────────────────────────────────────────────────────

/** Standard API response envelope — consistent shape for all endpoints */
export interface ApiResponse<T> {
  /** The response data payload */
  data: T;
  /** Error message, present only on failure */
  error?: string;
  /** Optional metadata (pagination, timing, etc.) */
  meta?: Record<string, unknown>;
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

/** Request body for creating a new workflow */
export interface CreateWorkflowRequest {
  name: string;
  tagline: string;
  description: string;
  category: string;
  price: string;
  estimatedTimeSaved: string;
  steps: Omit<WorkflowStep, 'id'>[];
}

/** Request body for updating an existing workflow */
export interface UpdateWorkflowRequest {
  name?: string;
  tagline?: string;
  description?: string;
  category?: string;
  price?: string;
  estimatedTimeSaved?: string;
  steps?: Omit<WorkflowStep, 'id'>[];
}

/** Options for exporting a product bundle */
export interface ExportBundleOptions {
  /** Override default price */
  price?: string;
  /** Integration list for bundle requirements */
  integrations?: BundleIntegration[];
  /** Environment variable list for bundle requirements */
  envVariables?: BundleEnvVariable[];
  /** Highlight bullets for demo section */
  highlights?: string[];
  /** Whether to include demo recording reference */
  includeDemo?: boolean;
  /** Specific execution ID to reference for demo */
  executionId?: string;
}
