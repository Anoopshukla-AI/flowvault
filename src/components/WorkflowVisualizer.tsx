/**
 * FlowVault — Workflow Visualizer
 *
 * Main execution view with step cards, connector beams,
 * play/pause/reset controls, and replay timeline.
 */

import type { Workflow } from '@/types/workflow';
import type { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { StepCard } from '@/components/StepCard';
import { ReplayTimeline } from '@/components/ReplayTimeline';
import { Play, Pause, RotateCcw, PackageOpen } from 'lucide-react';
import clsx from 'clsx';

interface WorkflowVisualizerProps {
  workflow: Workflow;
  executionState: ReturnType<typeof useWorkflowExecution>;
  onToggleExport: () => void;
  showExport: boolean;
}

export function WorkflowVisualizer({
  workflow,
  executionState,
  onToggleExport,
  showExport,
}: WorkflowVisualizerProps): React.JSX.Element {
  const {
    execution,
    status,
    currentStepIndex,
    progress,
    isPaused,
    execute,
    pause,
    resume,
    reset,
    seekToStep,
    getStepStatus,
    getStepLog,
  } = executionState;

  const isRunning = status === 'running' && !isPaused;
  const isCompleted = status === 'completed';
  const isIdle = status === 'idle';

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="heading-lg text-lg">{workflow.name}</h2>
              {status !== 'idle' && (
                <span
                  className={clsx(
                    'label-mono px-2 py-0.5 rounded-full border text-[9px]',
                    isRunning && 'text-fv-trigger border-fv-trigger/30 bg-fv-trigger/10',
                    isPaused && 'text-fv-decision border-fv-decision/30 bg-fv-decision/10',
                    isCompleted && 'text-fv-output border-fv-output/30 bg-fv-output/10',
                    status === 'failed' && 'text-red-400 border-red-400/30 bg-red-400/10'
                  )}
                >
                  {isPaused ? 'PAUSED' : status.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm text-fv-muted mt-1.5 leading-relaxed">
              {workflow.description}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="label-mono text-fv-faint" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
                {workflow.category}
              </span>
              <span className="text-sm font-semibold text-fv-trigger">{workflow.price}</span>
              <span className="text-xs text-fv-faint">
                Saves {workflow.estimatedTimeSaved}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isIdle ? (
              <button
                type="button"
                onClick={execute}
                aria-label="Execute workflow"
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-input text-sm font-semibold',
                  'bg-fv-trigger text-fv-base',
                  'hover:bg-fv-trigger/90 transition-all duration-200 ease-smooth',
                  'focus-visible:ring-2 focus-visible:ring-fv-trigger focus-visible:ring-offset-2 focus-visible:ring-offset-fv-base'
                )}
              >
                <Play size={14} aria-hidden="true" />
                Execute
              </button>
            ) : (
              <>
                {isRunning ? (
                  <button
                    type="button"
                    onClick={pause}
                    aria-label="Pause execution"
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-input text-sm',
                      'border border-fv-decision/40 text-fv-decision',
                      'hover:bg-fv-decision/10 transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-fv-decision'
                    )}
                  >
                    <Pause size={14} aria-hidden="true" />
                    Pause
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={resume}
                    aria-label="Resume execution"
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-input text-sm',
                      'border border-fv-trigger/40 text-fv-trigger',
                      'hover:bg-fv-trigger/10 transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-fv-trigger'
                    )}
                  >
                    <Play size={14} aria-hidden="true" />
                    Resume
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Reset execution"
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-input text-sm',
                    'border border-fv-border text-fv-muted',
                    'hover:bg-fv-surface-2 hover:border-fv-border-active transition-all duration-200',
                    'focus-visible:ring-2 focus-visible:ring-fv-trigger'
                  )}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Reset
                </button>
              </>
            )}

            {/* Export toggle */}
            <button
              type="button"
              onClick={onToggleExport}
              aria-label={showExport ? 'Close export panel' : 'Open export panel'}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-input text-sm',
                'border transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-fv-trigger',
                showExport
                  ? 'border-fv-fetch/40 text-fv-fetch bg-fv-fetch/10'
                  : 'border-fv-border text-fv-muted hover:bg-fv-surface-2 hover:border-fv-border-active'
              )}
            >
              <PackageOpen size={14} aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ── Replay Timeline ──────────────────────────────────────── */}
      {execution && (
        <ReplayTimeline
          workflow={workflow}
          currentStepIndex={currentStepIndex}
          progress={progress}
          getStepStatus={getStepStatus}
          onSeek={seekToStep}
          totalDurationMs={execution.totalDurationMs}
        />
      )}

      {/* ── Step Cards ───────────────────────────────────────────── */}
      <div className="space-y-0">
        {workflow.steps.map((step, i) => {
          const stepStatus = getStepStatus(step.id);
          const stepLog = getStepLog(step.id);

          return (
            <StepCard
              key={step.id}
              step={step}
              status={stepStatus}
              index={i}
              isLast={i === workflow.steps.length - 1}
              durationMs={stepLog?.durationMs ?? null}
              output={stepLog?.output ?? {}}
            />
          );
        })}
      </div>
    </div>
  );
}
