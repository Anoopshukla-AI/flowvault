/**
 * FlowVault — Export Panel
 *
 * Product packaging UI for generating monetizable bundles.
 * All data is redacted before export via the redaction engine.
 * Includes security attestation badge and quality checklist.
 */

import { useState, useCallback } from 'react';
import type { Workflow, WorkflowExecution, ProductBundle } from '@/types/workflow';
import { generateProductBundle, downloadBundle, copyBundleToClipboard } from '@/lib/export';
import { Download, Copy, Shield, CheckCircle2, Package, DollarSign } from 'lucide-react';
import clsx from 'clsx';

interface ExportPanelProps {
  workflow: Workflow;
  execution: WorkflowExecution | null;
}

export function ExportPanel({ workflow, execution }: ExportPanelProps): React.JSX.Element {
  const [bundle, setBundle] = useState<ProductBundle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [price, setPrice] = useState(workflow.price);

  const handleGenerate = useCallback(async () => {
    if (!execution) return;
    setIsGenerating(true);

    // Simulate a brief processing delay for UX
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    const result = await generateProductBundle(workflow, execution, {
      price,
      highlights: [
        `${workflow.steps.length}-step automated pipeline`,
        `Saves ${workflow.estimatedTimeSaved} per run`,
        'All credentials automatically redacted',
        'Ready to deploy — just add your API keys',
        `Category: ${workflow.category}`,
      ],
    });

    setBundle(result);
    setIsGenerating(false);
  }, [workflow, execution, price]);

  const handleDownload = useCallback(() => {
    if (!bundle) return;
    downloadBundle(bundle);
  }, [bundle]);

  const handleCopy = useCallback(async () => {
    if (!bundle) return;
    await copyBundleToClipboard(bundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bundle]);

  return (
    <div className="glass-card p-5 animate-fadein">
      <div className="flex items-center gap-2 mb-4">
        <Package size={16} className="text-fv-fetch" aria-hidden="true" />
        <h3 className="heading-lg text-base">Export Product Bundle</h3>
      </div>

      {!bundle ? (
        /* ── Pre-Generation ───────────────────────────────────────── */
        <div className="space-y-4">
          <p className="text-sm text-fv-muted leading-relaxed">
            Package this workflow as a sellable digital product. All sensitive data
            will be automatically redacted before export.
          </p>

          {/* Price input */}
          <div className="space-y-1.5">
            <label htmlFor="bundle-price" className="label-mono text-fv-faint" style={{ fontSize: '9px' }}>
              Price
            </label>
            <div className="relative">
              <DollarSign
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fv-faint"
                aria-hidden="true"
              />
              <input
                id="bundle-price"
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={clsx(
                  'w-full pl-8 pr-4 py-2.5 rounded-input text-sm font-semibold',
                  'bg-fv-surface border border-fv-border text-fv-text',
                  'focus:border-fv-trigger/50 focus:outline-none focus:ring-1 focus:ring-fv-trigger/30',
                  'transition-all duration-200'
                )}
                placeholder="$49"
                aria-label="Set product price"
              />
            </div>
          </div>

          {/* Bundle preview */}
          <div className="bg-fv-surface-2 rounded-input p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-fv-muted">Product</span>
              <span className="font-semibold">{workflow.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fv-muted">Category</span>
              <span className="text-fv-faint">{workflow.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fv-muted">Steps</span>
              <span className="text-fv-faint">{workflow.steps.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fv-muted">Time saved</span>
              <span className="text-fv-faint">{workflow.estimatedTimeSaved}</span>
            </div>
          </div>

          {/* Security attestation */}
          <div className="flex items-start gap-2 p-3 rounded-input bg-fv-trigger/5 border border-fv-trigger/15">
            <Shield size={14} className="text-fv-trigger mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs text-fv-muted leading-relaxed">
              All credentials, tokens, and PII will be automatically redacted by FlowVault before export.
            </p>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!execution || isGenerating}
            aria-label="Generate product bundle"
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-3 rounded-input text-sm font-semibold',
              'transition-all duration-200 ease-smooth',
              'focus-visible:ring-2 focus-visible:ring-fv-fetch',
              execution
                ? 'bg-fv-fetch text-fv-base hover:bg-fv-fetch/90 cursor-pointer'
                : 'bg-white/5 text-fv-faint cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-fv-base/30 border-t-fv-base rounded-full animate-spin" aria-hidden="true" />
                Generating...
              </>
            ) : (
              <>
                <Package size={14} aria-hidden="true" />
                {execution ? 'Generate Bundle' : 'Run workflow first'}
              </>
            )}
          </button>
        </div>
      ) : (
        /* ── Post-Generation ──────────────────────────────────────── */
        <div className="space-y-4">
          {/* Success header */}
          <div className="flex items-center gap-2 p-3 rounded-input bg-fv-output/10 border border-fv-output/20">
            <CheckCircle2 size={16} className="text-fv-output flex-shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold text-fv-output">Bundle Generated</span>
          </div>

          {/* Bundle details */}
          <div className="bg-fv-surface-2 rounded-input p-3 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-fv-faint">bundle_id</span>
              <span className="text-fv-muted truncate max-w-[200px]">{bundle.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fv-faint">version</span>
              <span className="text-fv-muted">{bundle.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fv-faint">steps</span>
              <span className="text-fv-muted">{bundle.workflow.totalSteps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fv-faint">redacted_fields</span>
              <span className="text-fv-trigger">{bundle.security.sensitiveFieldsMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fv-faint">price</span>
              <span className="text-fv-text font-semibold">{bundle.product.price}</span>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-input bg-fv-trigger/5 border border-fv-trigger/15">
            <Shield size={12} className="text-fv-trigger" aria-hidden="true" />
            <span className="text-[10px] text-fv-trigger font-mono">REDACTED & VERIFIED</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              aria-label="Download product bundle as JSON"
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-input text-sm font-semibold',
                'bg-fv-fetch text-fv-base hover:bg-fv-fetch/90',
                'transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-fv-fetch'
              )}
            >
              <Download size={14} aria-hidden="true" />
              Download JSON
            </button>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy product bundle to clipboard"
              className={clsx(
                'flex items-center justify-center gap-2 px-4 py-2.5 rounded-input text-sm',
                'border transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-fv-trigger',
                copied
                  ? 'border-fv-output/40 text-fv-output bg-fv-output/10'
                  : 'border-fv-border text-fv-muted hover:bg-fv-surface-2 hover:border-fv-border-active'
              )}
            >
              {copied ? (
                <><CheckCircle2 size={14} aria-hidden="true" /> Copied</>
              ) : (
                <><Copy size={14} aria-hidden="true" /> Copy</>
              )}
            </button>
          </div>

          {/* Re-generate */}
          <button
            type="button"
            onClick={() => setBundle(null)}
            aria-label="Generate a new bundle"
            className="w-full text-center text-xs text-fv-faint hover:text-fv-muted transition-colors py-1"
          >
            Generate new bundle
          </button>
        </div>
      )}
    </div>
  );
}
