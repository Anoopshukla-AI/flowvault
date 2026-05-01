/**
 * FlowVault — Typed API Client
 *
 * All API calls go through this module for consistent typing,
 * error handling, and response shape enforcement.
 * Response shape: { data, error, meta }
 */

import type {
  ApiResponse,
  Workflow,
  WorkflowExecution,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ProductBundle,
  ExportBundleOptions,
} from '@/types/workflow';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Generic fetch wrapper with typed response */
async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      return {
        data: json.data,
        error: json.error ?? `Request failed with status ${response.status}`,
        meta: json.meta,
      };
    }

    return json;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      data: undefined as T,
      error: message,
    };
  }
}

// ─── Workflow Endpoints ──────────────────────────────────────────────────────

/** Fetch all workflows */
export async function getWorkflows(): Promise<ApiResponse<Workflow[]>> {
  return apiClient<Workflow[]>('/api/workflows');
}

/** Fetch a single workflow by ID */
export async function getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
  return apiClient<Workflow>(`/api/workflows/${id}`);
}

/** Create a new workflow */
export async function createWorkflow(
  data: CreateWorkflowRequest
): Promise<ApiResponse<Workflow>> {
  return apiClient<Workflow>('/api/workflows', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Update an existing workflow */
export async function updateWorkflow(
  id: string,
  data: UpdateWorkflowRequest
): Promise<ApiResponse<Workflow>> {
  return apiClient<Workflow>(`/api/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Delete a workflow */
export async function deleteWorkflow(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/api/workflows/${id}`, {
    method: 'DELETE',
  });
}

// ─── Execution Endpoints ─────────────────────────────────────────────────────

/** Execute a workflow — triggers step-by-step run */
export async function executeWorkflow(
  id: string
): Promise<ApiResponse<WorkflowExecution>> {
  return apiClient<WorkflowExecution>(`/api/workflows/${id}/execute`, {
    method: 'POST',
  });
}

// ─── Export Endpoints ────────────────────────────────────────────────────────

/** Generate a product bundle for a workflow */
export async function exportBundle(
  workflowId: string,
  options: ExportBundleOptions
): Promise<ApiResponse<ProductBundle>> {
  return apiClient<ProductBundle>(`/api/export/${workflowId}`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
}
