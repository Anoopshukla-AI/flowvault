/**
 * FlowVault — Workflow Execution Hook
 *
 * Manages the step-by-step simulated execution of a workflow.
 * Drives the cinematic StepCard animations and ReplayTimeline.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Workflow, WorkflowExecution, ExecutionStepLog, StepStatus, WorkflowStatus } from '@/types/workflow';
import { v4 as uuidv4 } from 'uuid';

/** Simulated execution time per step type (ms) */
const STEP_DURATION: Record<string, number> = {
  trigger: 800,
  fetch: 2200,
  transform: 1800,
  decision: 1000,
  action: 2500,
  output: 1200,
};

interface UseWorkflowExecutionReturn {
  /** Current execution state */
  execution: WorkflowExecution | null;
  /** Overall execution status */
  status: WorkflowStatus;
  /** Index of the currently running step (-1 if not running) */
  currentStepIndex: number;
  /** Progress as a fraction 0–1 */
  progress: number;
  /** Whether the execution is currently paused */
  isPaused: boolean;
  /** Start executing the workflow from the beginning */
  execute: () => void;
  /** Pause the current execution */
  pause: () => void;
  /** Resume a paused execution */
  resume: () => void;
  /** Reset execution to initial state */
  reset: () => void;
  /** Seek to a specific step index (for replay timeline) */
  seekToStep: (index: number) => void;
  /** Get the status of a specific step by its ID */
  getStepStatus: (stepId: string) => StepStatus;
  /** Get the step log for a specific step */
  getStepLog: (stepId: string) => ExecutionStepLog | undefined;
}

export function useWorkflowExecution(workflow: Workflow | null): UseWorkflowExecutionReturn {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);
  const executionRef = useRef<WorkflowExecution | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    executionRef.current = execution;
  }, [execution]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const status: WorkflowStatus = execution?.status ?? 'idle';
  const progress = workflow && workflow.steps.length > 0
    ? Math.max(0, currentStepIndex + 1) / workflow.steps.length
    : 0;

  /** Create initial step logs for all steps */
  const createInitialLogs = useCallback((): ExecutionStepLog[] => {
    if (!workflow) return [];
    return workflow.steps.map((step) => ({
      stepId: step.id,
      stepNumber: step.step,
      status: 'pending' as StepStatus,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      input: step.data,
      output: {},
      errorMessage: null,
    }));
  }, [workflow]);

  /** Process a single step, then advance to the next */
  const processStep = useCallback(
    (stepIndex: number, exec: WorkflowExecution) => {
      if (!workflow || stepIndex >= workflow.steps.length) {
        // All steps done
        const completedAt = new Date().toISOString();
        const totalDurationMs = exec.stepLogs.reduce(
          (sum, log) => sum + (log.durationMs ?? 0),
          0
        );
        setExecution((prev) => {
          if (!prev) return prev;
          return { ...prev, status: 'completed', completedAt, totalDurationMs };
        });
        setCurrentStepIndex(workflow ? workflow.steps.length - 1 : -1);
        return;
      }

      if (isPausedRef.current) return;

      const step = workflow.steps[stepIndex];
      if (!step) return;
      const now = new Date().toISOString();

      // Mark step as running
      const runningLogs = exec.stepLogs.map((log, i) =>
        i === stepIndex ? { ...log, status: 'running' as StepStatus, startedAt: now } : log
      );
      const runningExec: WorkflowExecution = { ...exec, stepLogs: runningLogs };
      setExecution(runningExec);
      setCurrentStepIndex(stepIndex);

      // Simulate step execution
      const duration = STEP_DURATION[step.type] ?? 1500;
      timerRef.current = setTimeout(() => {
        if (isPausedRef.current) return;

        const completedAt = new Date().toISOString();
        const doneLogs = runningExec.stepLogs.map((log, i) =>
          i === stepIndex
            ? { ...log, status: 'done' as StepStatus, completedAt, durationMs: duration, output: step.sampleOutput }
            : log
        );
        const doneExec: WorkflowExecution = { ...runningExec, stepLogs: doneLogs };
        setExecution(doneExec);

        // Process next step
        timerRef.current = setTimeout(() => {
          processStep(stepIndex + 1, doneExec);
        }, 300);
      }, duration);
    },
    [workflow]
  );

  /** Start executing the workflow */
  const execute = useCallback(() => {
    if (!workflow) return;

    const newExecution: WorkflowExecution = {
      id: uuidv4(),
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,
      totalDurationMs: null,
      stepLogs: createInitialLogs(),
    };

    setExecution(newExecution);
    setCurrentStepIndex(-1);
    setIsPaused(false);
    isPausedRef.current = false;

    // Begin processing from step 0 after a short delay
    timerRef.current = setTimeout(() => {
      processStep(0, newExecution);
    }, 500);
  }, [workflow, createInitialLogs, processStep]);

  /** Pause execution */
  const pause = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Resume execution */
  const resume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    if (executionRef.current && currentStepIndex >= 0) {
      const currentLog = executionRef.current.stepLogs[currentStepIndex];
      if (currentLog?.status === 'running') {
        // Re-process current step
        processStep(currentStepIndex, executionRef.current);
      } else {
        // Move to next step
        processStep(currentStepIndex + 1, executionRef.current);
      }
    }
  }, [currentStepIndex, processStep]);

  /** Reset to initial state */
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setExecution(null);
    setCurrentStepIndex(-1);
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  /** Seek to a specific step for replay */
  const seekToStep = useCallback(
    (index: number) => {
      if (!workflow || !execution) return;

      // Pause current execution
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
      isPausedRef.current = true;

      // Update step logs to reflect the target position
      const newLogs = execution.stepLogs.map((log, i) => {
        if (i < index) {
          return { ...log, status: 'done' as StepStatus };
        } else if (i === index) {
          return { ...log, status: 'running' as StepStatus };
        } else {
          return { ...log, status: 'pending' as StepStatus };
        }
      });

      setExecution({ ...execution, stepLogs: newLogs });
      setCurrentStepIndex(index);
    },
    [workflow, execution]
  );

  /** Get the status of a specific step */
  const getStepStatus = useCallback(
    (stepId: string): StepStatus => {
      if (!execution) return 'pending';
      const log = execution.stepLogs.find((l) => l.stepId === stepId);
      return log?.status ?? 'pending';
    },
    [execution]
  );

  /** Get the step log for a specific step */
  const getStepLog = useCallback(
    (stepId: string): ExecutionStepLog | undefined => {
      if (!execution) return undefined;
      return execution.stepLogs.find((l) => l.stepId === stepId);
    },
    [execution]
  );

  return {
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
  };
}
