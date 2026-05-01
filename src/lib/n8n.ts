/**
 * FlowVault — n8n Integration Client
 *
 * Connects to a local n8n instance via its REST API,
 * fetches workflows, and transforms them into FlowVault format.
 *
 * n8n API docs: https://docs.n8n.io/api/
 * Default URL: http://localhost:5678
 */

import { v4 as uuidv4 } from 'uuid';
import type { Workflow, WorkflowStep, StepType } from '@/types/workflow';

// ─── n8n API Types ──────────────────────────────────────────────────────────

/** n8n node from the workflow JSON */
interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
  typeVersion?: number;
  credentials?: Record<string, unknown>;
}

/** n8n workflow from the API */
export interface N8nWorkflow {
  id: string | number;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
  settings?: Record<string, unknown>;
}

/** n8n API list response */
interface N8nListResponse {
  data: N8nWorkflow[];
  nextCursor?: string;
}

/** n8n connection config */
export interface N8nConfig {
  baseUrl: string;
  apiKey: string;
}

// ─── n8n Node Type → FlowVault StepType Mapping ────────────────────────────

/**
 * Maps n8n node type strings to FlowVault step types.
 * n8n has hundreds of node types — we categorize them into 6 FlowVault types.
 */
function mapNodeToStepType(nodeType: string): StepType {
  const type = nodeType.toLowerCase();

  // Triggers
  if (
    type.includes('trigger') ||
    type.includes('webhook') ||
    type.includes('cron') ||
    type.includes('schedule') ||
    type.includes('start') ||
    type === 'n8n-nodes-base.manualTrigger'.toLowerCase() ||
    type === 'n8n-nodes-base.webhook'.toLowerCase()
  ) {
    return 'trigger';
  }

  // Fetch / API calls
  if (
    type.includes('httpRequest') ||
    type.includes('http') ||
    type.includes('api') ||
    type.includes('graphql') ||
    type.includes('ftp') ||
    type.includes('ssh') ||
    type.includes('readBinaryFile') ||
    // Service-specific fetches
    type.includes('airtable') ||
    type.includes('googleSheets') ||
    type.includes('notion') ||
    type.includes('postgres') ||
    type.includes('mysql') ||
    type.includes('mongodb') ||
    type.includes('redis') ||
    type.includes('elasticsearch') ||
    type.includes('supabase')
  ) {
    return 'fetch';
  }

  // Transform / Data manipulation
  if (
    type.includes('set') ||
    type.includes('function') ||
    type.includes('code') ||
    type.includes('item') ||
    type.includes('merge') ||
    type.includes('split') ||
    type.includes('aggregate') ||
    type.includes('spreadsheet') ||
    type.includes('xml') ||
    type.includes('json') ||
    type.includes('html') ||
    type.includes('markdown') ||
    type.includes('crypto') ||
    type.includes('dateTime') ||
    type.includes('summarize') ||
    type.includes('removeDuplicates') ||
    type.includes('sort') ||
    type.includes('limit') ||
    type.includes('filter') && !type.includes('if') ||
    type.includes('renameKeys') ||
    type.includes('openai') ||
    type.includes('langchain') ||
    type.includes('ai')
  ) {
    return 'transform';
  }

  // Decision / Routing
  if (
    type.includes('if') ||
    type.includes('switch') ||
    type.includes('router') ||
    type.includes('compare') ||
    type.includes('filter')
  ) {
    return 'decision';
  }

  // Output / Notifications
  if (
    type.includes('respondToWebhook') ||
    type.includes('sendEmail') ||
    type.includes('email') && type.includes('send') ||
    type.includes('noOp') ||
    type.includes('stopAndError') ||
    type.includes('wait')
  ) {
    return 'output';
  }

  // Action — everything else (Slack, Discord, Salesforce, etc.)
  return 'action';
}

/**
 * Maps an n8n node type to a human-readable category label.
 */
function getNodeCategory(nodeType: string): string {
  const type = nodeType.toLowerCase();
  if (type.includes('slack')) return 'Team Ops';
  if (type.includes('email') || type.includes('gmail') || type.includes('outlook')) return 'Email Automation';
  if (type.includes('salesforce') || type.includes('hubspot') || type.includes('pipedrive')) return 'Sales Automation';
  if (type.includes('sheet') || type.includes('airtable') || type.includes('notion')) return 'Data Ops';
  if (type.includes('openai') || type.includes('ai') || type.includes('langchain')) return 'AI Automation';
  if (type.includes('github') || type.includes('gitlab') || type.includes('jira')) return 'Dev Ops';
  if (type.includes('twitter') || type.includes('linkedin') || type.includes('facebook')) return 'Social Media';
  if (type.includes('stripe') || type.includes('shopify') || type.includes('woocommerce')) return 'E-Commerce';
  return 'General Automation';
}

/**
 * Strips the n8n namespace prefix from node type for cleaner display.
 * "n8n-nodes-base.httpRequest" → "httpRequest"
 */
function cleanNodeTypeName(nodeType: string): string {
  const parts = nodeType.split('.');
  return parts[parts.length - 1] ?? nodeType;
}

// ─── n8n API Client ─────────────────────────────────────────────────────────

/**
 * Fetch all workflows from n8n.
 * Requires an API key set in n8n Settings → API.
 */
export async function fetchN8nWorkflows(config: N8nConfig): Promise<N8nWorkflow[]> {
  // Use the Vite proxy path to bypass CORS
  const url = '/n8n-api/workflows';

  const response = await fetch(url, {
    headers: {
      'X-N8N-API-KEY': config.apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid n8n API key. Go to n8n Settings → API to generate one.');
    }
    if (response.status === 403) {
      throw new Error('n8n API access forbidden. Enable the API in n8n Settings.');
    }
    throw new Error(`n8n API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as N8nListResponse;
  return data.data;
}

/**
 * Fetch a single workflow by ID from n8n.
 */
export async function fetchN8nWorkflow(config: N8nConfig, workflowId: string): Promise<N8nWorkflow> {
  // Use the Vite proxy path to bypass CORS
  const url = `/n8n-api/workflows/${workflowId}`;

  const response = await fetch(url, {
    headers: {
      'X-N8N-API-KEY': config.apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow ${workflowId}: ${response.status}`);
  }

  return (await response.json()) as N8nWorkflow;
}

/**
 * Test the n8n connection with the given config.
 * Returns true if the connection is successful.
 */
export async function testN8nConnection(config: N8nConfig): Promise<{ success: boolean; message: string; workflows?: N8nWorkflow[] }> {
  try {
    const workflows = await fetchN8nWorkflows(config);
    return {
      success: true,
      message: `Connected! Found ${workflows.length} workflow${workflows.length === 1 ? '' : 's'}.`,
      workflows,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return { success: false, message };
  }
}

// ─── Workflow Transformer ───────────────────────────────────────────────────

/**
 * Transforms an n8n workflow into FlowVault's Workflow format.
 *
 * Strategy:
 * 1. Sort nodes by position (left→right = execution order)
 * 2. Map each n8n node type to a FlowVault StepType
 * 3. Extract parameters as step data (with credentials stripped)
 * 4. Generate sample output from node parameters
 */
export function transformN8nWorkflow(n8nWorkflow: N8nWorkflow): Workflow {
  // Sort nodes by x-position (left to right = execution order)
  const sortedNodes = [...n8nWorkflow.nodes].sort(
    (a, b) => a.position[0] - b.position[0]
  );

  // Determine category from the most common node type
  const categories = sortedNodes.map((n) => getNodeCategory(n.type));
  const categoryCount = new Map<string, number>();
  for (const cat of categories) {
    categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
  }
  let bestCategory = 'General Automation';
  let bestCount = 0;
  for (const [cat, count] of categoryCount) {
    if (count > bestCount && cat !== 'General Automation') {
      bestCategory = cat;
      bestCount = count;
    }
  }

  // Transform nodes to steps
  const steps: WorkflowStep[] = sortedNodes.map((node, index) => {
    // Strip credentials from parameters (security)
    const safeParams = { ...node.parameters };
    delete safeParams.credentials;

    // Generate a concise sample output
    const sampleOutput: Record<string, unknown> = {
      node: cleanNodeTypeName(node.type),
      status: 'processed',
    };

    // Add some contextual output based on node type
    const stepType = mapNodeToStepType(node.type);
    if (stepType === 'trigger') {
      sampleOutput.triggered = true;
      sampleOutput.source = cleanNodeTypeName(node.type);
    } else if (stepType === 'fetch') {
      sampleOutput.records_fetched = Math.floor(Math.random() * 50) + 1;
    } else if (stepType === 'transform') {
      sampleOutput.items_processed = Math.floor(Math.random() * 100) + 1;
    } else if (stepType === 'decision') {
      sampleOutput.branch = 'true';
      sampleOutput.matched = Math.floor(Math.random() * 20) + 1;
    } else if (stepType === 'action') {
      sampleOutput.action_completed = true;
    } else if (stepType === 'output') {
      sampleOutput.delivered = true;
    }

    return {
      id: node.id || uuidv4(),
      step: index + 1,
      type: stepType,
      label: node.name,
      description: `${cleanNodeTypeName(node.type)} node — ${node.name}`,
      data: safeParams,
      sampleOutput,
    };
  });

  // Estimate time saved based on step count
  const minutesSaved = steps.length * 5 + Math.floor(Math.random() * 20);
  const estimatedTimeSaved = minutesSaved >= 60
    ? `${Math.floor(minutesSaved / 60)}h ${minutesSaved % 60}m per run`
    : `${minutesSaved} min per run`;

  return {
    id: uuidv4(),
    name: n8nWorkflow.name,
    tagline: `Imported from n8n — ${steps.length}-step ${bestCategory.toLowerCase()} workflow`,
    description: `Automated workflow "${n8nWorkflow.name}" imported from n8n with ${steps.length} steps. ${n8nWorkflow.active ? 'Currently active.' : 'Currently inactive.'}`,
    category: bestCategory,
    price: '$0',
    estimatedTimeSaved,
    steps,
    createdAt: n8nWorkflow.createdAt,
    updatedAt: n8nWorkflow.updatedAt,
  };
}

/**
 * Fetch all workflows from n8n and transform them to FlowVault format.
 */
export async function importAllN8nWorkflows(config: N8nConfig): Promise<Workflow[]> {
  const n8nWorkflows = await fetchN8nWorkflows(config);
  return n8nWorkflows.map(transformN8nWorkflow);
}
