/**
 * FlowVault — Workflow Sidebar
 *
 * Displays a selectable list of workflows with name, category, and step count.
 * Keyboard navigable with full ARIA support.
 */

import type { Workflow } from '@/types/workflow';
import { STEP_COLOR_MAP } from '@/types/workflow';
import { Layers, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface WorkflowSidebarProps {
  workflows: Workflow[];
  selectedId: string;
  onSelect: (workflow: Workflow) => void;
}

export function WorkflowSidebar({ workflows, selectedId, onSelect }: WorkflowSidebarProps): React.JSX.Element {
  return (
    <aside className="space-y-2.5" role="navigation" aria-label="Workflow list">
      <div className="label-mono text-fv-faint px-3 mb-3">
        Workflows ({workflows.length})
      </div>
      {workflows.map((workflow) => {
        const isSelected = workflow.id === selectedId;
        const stepTypes = [...new Set(workflow.steps.map((s) => s.type))];

        return (
          <div
            key={workflow.id}
            role="button"
            tabIndex={0}
            aria-label={`Select workflow: ${workflow.name}`}
            aria-selected={isSelected}
            onClick={() => onSelect(workflow)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(workflow);
              }
            }}
            className={clsx(
              'group rounded-card p-4 cursor-pointer transition-all duration-300 ease-smooth',
              'border relative overflow-hidden',
              isSelected
                ? 'bg-fv-surface-2 border-fv-trigger/30 shadow-[0_0_28px_rgba(0,255,163,0.08)]'
                : 'bg-fv-surface border-fv-border hover:bg-fv-surface-2 hover:border-fv-border-active'
            )}
          >
            {/* Active indicator bar */}
            {isSelected && (
              <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-fv-trigger" />
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-fv-text truncate leading-tight">
                  {workflow.name}
                </h3>
                <p className="text-xs text-fv-muted mt-1 line-clamp-2 leading-relaxed">
                  {workflow.tagline}
                </p>
              </div>
              <ChevronRight
                size={14}
                className={clsx(
                  'mt-0.5 flex-shrink-0 transition-all duration-300',
                  isSelected ? 'text-fv-trigger opacity-100' : 'text-fv-faint opacity-0 group-hover:opacity-60'
                )}
                aria-hidden="true"
              />
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5">
                <Layers size={11} className="text-fv-faint" aria-hidden="true" />
                <span className="text-[11px] font-mono text-fv-faint">
                  {workflow.steps.length} steps
                </span>
              </div>

              {/* Step type color dots */}
              <div className="flex gap-1" aria-label={`Uses: ${stepTypes.join(', ')}`}>
                {stepTypes.map((type) => (
                  <div
                    key={type}
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ backgroundColor: STEP_COLOR_MAP[type] }}
                    title={type}
                  />
                ))}
              </div>
            </div>

            {/* Category + Price */}
            <div className="flex items-center justify-between mt-2.5">
              <span className="label-mono text-fv-faint" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
                {workflow.category}
              </span>
              <span className="text-xs font-semibold text-fv-trigger">
                {workflow.price}
              </span>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
