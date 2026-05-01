/**
 * FlowVault — Replay Timeline
 *
 * Scrubbable horizontal timeline showing execution progress.
 * Click any step marker to seek to that position.
 */

import type { Workflow, StepStatus } from '@/types/workflow';
import { STEP_COLOR_MAP } from '@/types/workflow';
import clsx from 'clsx';

interface ReplayTimelineProps {
  workflow: Workflow;
  currentStepIndex: number;
  progress: number;
  getStepStatus: (stepId: string) => StepStatus;
  onSeek: (index: number) => void;
  totalDurationMs: number | null;
}

export function ReplayTimeline({
  workflow,
  currentStepIndex,
  progress,
  getStepStatus,
  onSeek,
  totalDurationMs,
}: ReplayTimelineProps): React.JSX.Element {
  const steps = workflow.steps;

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const elapsed = totalDurationMs ? Math.round(totalDurationMs * progress) : 0;
  const total = totalDurationMs ?? 0;

  return (
    <div className="glass-card p-4" role="slider" aria-label="Execution timeline" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
      {/* Time display */}
      <div className="flex items-center justify-between mb-3">
        <span className="label-mono text-fv-faint" style={{ fontSize: '9px' }}>
          Timeline
        </span>
        <div className="font-mono text-[11px] text-fv-muted">
          {totalDurationMs ? (
            <>
              <span className="text-fv-text">{formatTime(elapsed)}</span>
              <span className="text-fv-faint"> / {formatTime(total)}</span>
            </>
          ) : (
            <span className="text-fv-faint">--:--</span>
          )}
        </div>
      </div>

      {/* Progress track */}
      <div className="relative h-[6px] bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-300 ease-smooth"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, #00FFA3, #00C2FF)`,
          }}
        />
      </div>

      {/* Step markers */}
      <div className="relative mt-2 flex justify-between">
        {steps.map((step, i) => {
          const status = getStepStatus(step.id);
          const color = STEP_COLOR_MAP[step.type];
          const isCurrent = i === currentStepIndex;
          const isDone = status === 'done';
          const isRunning = status === 'running';

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSeek(i)}
              aria-label={`Seek to step ${step.step}: ${step.label}`}
              className={clsx(
                'flex flex-col items-center gap-1 group cursor-pointer transition-all',
                'focus-visible:ring-2 focus-visible:ring-fv-trigger rounded-sm'
              )}
            >
              {/* Marker dot */}
              <div
                className={clsx(
                  'w-3 h-3 rounded-full border-2 transition-all duration-300',
                  isCurrent && 'scale-125',
                  isRunning && 'animate-pulse-dot',
                )}
                style={{
                  borderColor: isDone || isRunning ? color : 'rgba(255,255,255,0.15)',
                  backgroundColor: isDone ? color : isRunning ? `${color}50` : 'transparent',
                }}
              />
              {/* Label */}
              <span
                className={clsx(
                  'text-[9px] font-mono transition-colors duration-200 max-w-[60px] truncate text-center',
                  isCurrent || isDone ? 'text-fv-muted' : 'text-fv-faint'
                )}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
