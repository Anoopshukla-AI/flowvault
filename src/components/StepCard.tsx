/**
 * FlowVault — StepCard Component
 *
 * Individual animated step visualization.
 * Color-coded by step type, with shimmer overlay during execution
 * and glow effects on completion. Staggered entry animation.
 */

import type { WorkflowStep, StepStatus } from '@/types/workflow';
import { STEP_COLOR_MAP, STEP_GLOW_MAP } from '@/types/workflow';
import clsx from 'clsx';
import {
  Zap,
  Globe,
  Shuffle,
  GitBranch,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface StepCardProps {
  step: WorkflowStep;
  status: StepStatus;
  index: number;
  isLast: boolean;
  durationMs: number | null;
  output: Record<string, unknown>;
}

/** Maps step type to its Lucide icon */
function StepIcon({ type, size = 16 }: { type: string; size?: number }): React.JSX.Element {
  const props = { size, strokeWidth: 2 };
  switch (type) {
    case 'trigger':
      return <Zap {...props} />;
    case 'fetch':
      return <Globe {...props} />;
    case 'transform':
      return <Shuffle {...props} />;
    case 'decision':
      return <GitBranch {...props} />;
    case 'action':
      return <Play {...props} />;
    case 'output':
      return <CheckCircle2 {...props} />;
    default:
      return <Zap {...props} />;
  }
}

/** Status indicator icon */
function StatusIcon({ status }: { status: StepStatus }): React.JSX.Element {
  switch (status) {
    case 'running':
      return (
        <div className="w-2 h-2 rounded-full bg-fv-trigger animate-pulse-dot" role="status" aria-label="Running" />
      );
    case 'done':
      return <CheckCircle2 size={14} className="text-fv-output" aria-label="Completed" />;
    case 'error':
      return <AlertCircle size={14} className="text-red-400" aria-label="Error" />;
    default:
      return <Clock size={14} className="text-fv-faint" aria-label="Pending" />;
  }
}

export function StepCard({ step, status, index, isLast, durationMs, output }: StepCardProps): React.JSX.Element {
  const color = STEP_COLOR_MAP[step.type];
  const glow = STEP_GLOW_MAP[step.type];
  const isRunning = status === 'running';
  const isDone = status === 'done';
  const isError = status === 'error';

  const outputEntries = Object.entries(output).slice(0, 3);

  return (
    <div>
      {/* Step Card */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Step ${step.step}: ${step.label} — ${status}`}
        className={clsx(
          'rounded-card border p-4 transition-all duration-300 ease-smooth relative overflow-hidden',
          'animate-fadein',
          isDone && 'bg-fv-surface border-fv-border-active',
          isRunning && 'scale-[1.015]',
          isError && 'border-red-400/40 bg-red-400/5',
          !isDone && !isRunning && !isError && 'bg-fv-surface border-fv-border'
        )}
        style={{
          animationDelay: `${index * 80}ms`,
          ...(isRunning
            ? {
                borderColor: `${color}66`,
                boxShadow: `0 0 28px ${glow}`,
              }
            : isDone
              ? {
                  borderColor: `${color}30`,
                  boxShadow: `0 0 12px ${glow?.replace('0.35', '0.1')}`,
                }
              : {}),
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
          }
        }}
      >
        {/* Running shimmer overlay */}
        {isRunning && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
            aria-hidden="true"
          />
        )}

        {/* Card Content */}
        <div className="relative z-10">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Icon bubble */}
              <div
                className={clsx(
                  'w-[38px] h-[38px] rounded-icon flex items-center justify-center',
                  'border transition-all duration-300'
                )}
                style={{
                  backgroundColor: isDone || isRunning ? `${color}18` : 'rgba(255,255,255,0.05)',
                  borderColor: isDone || isRunning ? `${color}44` : 'rgba(255,255,255,0.1)',
                  color: isDone || isRunning ? color : 'rgba(255,255,255,0.4)',
                }}
                aria-hidden="true"
              >
                {isDone ? (
                  <span style={{ color }} className="text-sm font-bold">✓</span>
                ) : (
                  <StepIcon type={step.type} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="label-mono"
                    style={{
                      color: isDone || isRunning ? color : 'rgba(255,255,255,0.3)',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {step.type}
                  </span>
                  <span className="text-fv-faint text-[10px]">#{step.step}</span>
                </div>
                <h4 className="text-sm font-semibold mt-0.5">{step.label}</h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {durationMs !== null && isDone && (
                <span className="font-mono text-[11px] text-fv-faint">
                  {(durationMs / 1000).toFixed(1)}s
                </span>
              )}
              <StatusIcon status={status} />
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-fv-muted mt-2.5 pl-[50px] leading-relaxed">
            {step.description}
          </p>

          {/* Data chips — show output when done */}
          {isDone && outputEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pl-[50px]">
              {outputEntries.map(([key, val]) => (
                <div
                  key={key}
                  className="bg-white/5 rounded-md px-2 py-1 font-mono text-[11px]"
                >
                  <span style={{ color }}>{key}</span>
                  <span className="text-white/30"> = </span>
                  <span className="text-white/60">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar for running */}
          {isRunning && (
            <div className="h-[2px] bg-white/10 rounded-full mt-3 ml-[50px] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-75 linear"
                style={{
                  width: '60%',
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  animation: 'shimmer 1.2s infinite',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Connector beam */}
      {!isLast && (
        <div className="flex justify-center py-0">
          <div className="w-[2px] h-10 bg-white/10 relative overflow-hidden">
            {isDone && (
              <div
                className="absolute top-0 left-0 w-full animate-beam-fill"
                style={{ backgroundColor: color, height: '100%' }}
              />
            )}
            {isRunning && (
              <div
                className="absolute top-0 left-0 w-full h-1/2 animate-glow-pulse"
                style={{ backgroundColor: color }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
