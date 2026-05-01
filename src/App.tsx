/**
 * FlowVault — Root Application Component
 *
 * Main layout with sidebar (280px) + content area.
 * Ambient gradient glows and grain overlay for cinematic feel.
 * Supports importing workflows from local n8n instances.
 */

import { useState, useCallback } from 'react';
import type { Workflow } from '@/types/workflow';
import { DEMO_WORKFLOWS } from '@/data/workflows';
import { WorkflowSidebar } from '@/components/WorkflowSidebar';
import { WorkflowVisualizer } from '@/components/WorkflowVisualizer';
import { ExportPanel } from '@/components/ExportPanel';
import { N8nImportPanel } from '@/components/N8nImportPanel';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';

export function App(): React.JSX.Element {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEMO_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow>(DEMO_WORKFLOWS[0]!);
  const [showExport, setShowExport] = useState(false);
  const [showN8nImport, setShowN8nImport] = useState(false);
  const executionState = useWorkflowExecution(selectedWorkflow);

  const handleSelectWorkflow = (workflow: Workflow): void => {
    executionState.reset();
    setSelectedWorkflow(workflow);
    setShowExport(false);
  };

  const handleToggleExport = (): void => {
    setShowExport((prev) => !prev);
  };

  const handleToggleN8n = (): void => {
    setShowN8nImport((prev) => !prev);
  };

  const handleN8nImport = useCallback((importedWorkflows: Workflow[]) => {
    setWorkflows((prev) => [...prev, ...importedWorkflows]);
    // Select the first imported workflow
    const first = importedWorkflows[0];
    if (first) {
      executionState.reset();
      setSelectedWorkflow(first);
      setShowExport(false);
    }
  }, [executionState]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Ambient Gradient Glows ─────────────────────────────────── */}
      <div
        className="fixed -top-[200px] left-[30%] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,255,163,0.06), transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="fixed -bottom-[100px] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.05), transparent 70%)' }}
        aria-hidden="true"
      />

      {/* ── Grain Overlay ──────────────────────────────────────────── */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none z-[9999]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
        aria-hidden="true"
      />

      {/* ── Main Layout ────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-5 py-7 min-h-screen">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-icon bg-fv-trigger/10 border border-fv-trigger/30 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h1 className="heading-lg text-xl tracking-tight">
              Flow<span className="text-fv-trigger">Vault</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* n8n Connect Button */}
            <button
              type="button"
              onClick={handleToggleN8n}
              aria-label={showN8nImport ? 'Close n8n import' : 'Connect n8n'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-input text-xs font-semibold border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 ${
                showN8nImport
                  ? 'border-orange-500/40 text-orange-400 bg-orange-500/10'
                  : 'border-fv-border text-fv-faint hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/5'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {showN8nImport ? 'Close n8n' : 'Connect n8n'}
            </button>
            <div className="label-mono text-fv-faint">
              Workflow → Product
            </div>
          </div>
        </header>

        {/* ── Content Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-[280px_1fr] gap-5 items-start">
          {/* Sidebar */}
          <WorkflowSidebar
            workflows={workflows}
            selectedId={selectedWorkflow.id}
            onSelect={handleSelectWorkflow}
          />

          {/* Main Content */}
          <div className="space-y-5">
            {/* n8n Import Panel */}
            {showN8nImport && (
              <N8nImportPanel
                onImport={handleN8nImport}
                onClose={() => setShowN8nImport(false)}
              />
            )}

            <WorkflowVisualizer
              workflow={selectedWorkflow}
              executionState={executionState}
              onToggleExport={handleToggleExport}
              showExport={showExport}
            />

            {showExport && (
              <ExportPanel
                workflow={selectedWorkflow}
                execution={executionState.execution}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
