/**
 * FlowVault — n8n Import Panel
 *
 * Connection UI for importing workflows from a local n8n instance.
 * Handles URL + API key configuration, connection testing,
 * workflow listing, and selective import.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Workflow } from '@/types/workflow';
import type { N8nConfig, N8nWorkflow } from '@/lib/n8n';
import { testN8nConnection, transformN8nWorkflow } from '@/lib/n8n';
import {
  Link2,
  Unplug,
  Check,
  AlertCircle,
  Download,
  Loader2,
  ExternalLink,
  Server,
  Key,
  Search,
  Square,
  CheckSquare,
} from 'lucide-react';
import clsx from 'clsx';

interface N8nImportPanelProps {
  onImport: (workflows: Workflow[]) => void;
  onClose: () => void;
}

type ConnectionState = 'idle' | 'testing' | 'connected' | 'error';

export function N8nImportPanel({ onImport, onClose }: N8nImportPanelProps): React.JSX.Element {
  const [baseUrl, setBaseUrl] = useState('http://localhost:5678');
  const [apiKey, setApiKey] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const config: N8nConfig = { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };

  const handleTestConnection = useCallback(async () => {
    if (!apiKey.trim()) {
      setStatusMessage('API key is required. Go to n8n Settings → API to generate one.');
      setConnectionState('error');
      return;
    }

    setConnectionState('testing');
    setStatusMessage('Testing connection...');

    const result = await testN8nConnection(config);
    if (result.success && result.workflows) {
      setConnectionState('connected');
      setStatusMessage(result.message);
      setN8nWorkflows(result.workflows);
      // Auto-select all by default
      setSelectedIds(new Set(result.workflows.map((w) => w.id)));
    } else {
      setConnectionState('error');
      setStatusMessage(result.message);
    }
  }, [config, apiKey]);

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return n8nWorkflows;
    const query = searchQuery.toLowerCase();
    return n8nWorkflows.filter((w) => w.name.toLowerCase().includes(query));
  }, [n8nWorkflows, searchQuery]);

  const toggleSelection = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredWorkflows.map((w) => w.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const handleImport = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    setIsImporting(true);
    try {
      const selectedWorkflows = n8nWorkflows.filter((w) => selectedIds.has(w.id));
      const transformed = selectedWorkflows.map(transformN8nWorkflow);
      setImportedCount(transformed.length);
      onImport(transformed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setStatusMessage(message);
      setConnectionState('error');
    } finally {
      setIsImporting(false);
    }
  }, [n8nWorkflows, selectedIds, onImport]);

  return (
    <div className="glass-card p-5 animate-fadein max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-icon bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className="heading-lg text-base">Connect n8n</h3>
            <p className="text-[11px] text-fv-faint mt-0.5">Import workflows from your local instance</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close n8n import panel"
          className="text-fv-faint hover:text-fv-muted transition-colors p-1 rounded-md focus-visible:ring-2 focus-visible:ring-fv-trigger"
        >
          <Unplug size={16} />
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-grow pr-1">
        {importedCount > 0 ? (
          /* ── Success State ──────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-input bg-fv-output/10 border border-fv-output/20">
              <Check size={18} className="text-fv-output flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-fv-output">
                  {importedCount} workflow{importedCount === 1 ? '' : 's'} imported!
                </p>
                <p className="text-xs text-fv-muted mt-0.5">
                  Select them from the sidebar to visualize and export.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className={clsx(
                'w-full py-2.5 rounded-input text-sm font-semibold',
                'border border-fv-border text-fv-muted',
                'hover:bg-fv-surface-2 transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-fv-trigger'
              )}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Connection Form / Workflow List ────────────────────── */
          <div className="space-y-4">
            {connectionState !== 'connected' ? (
              <>
                {/* n8n URL */}
                <div className="space-y-1.5">
                  <label htmlFor="n8n-url" className="label-mono text-fv-faint flex items-center gap-1.5" style={{ fontSize: '9px' }}>
                    <Server size={10} aria-hidden="true" />
                    n8n URL
                  </label>
                  <input
                    id="n8n-url"
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:5678"
                    aria-label="n8n instance URL"
                    className={clsx(
                      'w-full px-3 py-2.5 rounded-input text-sm font-mono',
                      'bg-fv-surface border border-fv-border text-fv-text',
                      'focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30',
                      'placeholder:text-fv-faint transition-all duration-200'
                    )}
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <label htmlFor="n8n-api-key" className="label-mono text-fv-faint flex items-center gap-1.5" style={{ fontSize: '9px' }}>
                    <Key size={10} aria-hidden="true" />
                    API Key
                  </label>
                  <input
                    id="n8n-api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="n8n API key from Settings → API"
                    aria-label="n8n API key"
                    className={clsx(
                      'w-full px-3 py-2.5 rounded-input text-sm font-mono',
                      'bg-fv-surface border border-fv-border text-fv-text',
                      'focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30',
                      'placeholder:text-fv-faint transition-all duration-200'
                    )}
                  />
                  <a
                    href={`${baseUrl}/settings/api`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-orange-400/60 hover:text-orange-400 transition-colors mt-0.5"
                    aria-label="Open n8n API settings"
                  >
                    <ExternalLink size={9} aria-hidden="true" />
                    Open n8n API settings
                  </a>
                </div>
              </>
            ) : (
              /* Workflow Selection List */
              <div className="space-y-4 animate-fadein">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fv-faint" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workflows..."
                    className={clsx(
                      'w-full pl-9 pr-3 py-2 rounded-input text-xs',
                      'bg-fv-surface border border-fv-border text-fv-text',
                      'focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30'
                    )}
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-fv-faint font-medium">
                    {selectedIds.size} of {n8nWorkflows.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-[10px] text-orange-400/60 hover:text-orange-400 transition-colors">Select All</button>
                    <button onClick={selectNone} className="text-[10px] text-fv-faint hover:text-fv-muted transition-colors">Select None</button>
                  </div>
                </div>

                <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                  {filteredWorkflows.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => toggleSelection(w.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 p-2 rounded-md transition-all text-left group',
                        selectedIds.has(w.id) ? 'bg-orange-500/10 border border-orange-500/20' : 'hover:bg-white/5 border border-transparent'
                      )}
                    >
                      {selectedIds.has(w.id) ? (
                        <CheckSquare size={14} className="text-orange-500" />
                      ) : (
                        <Square size={14} className="text-fv-faint group-hover:text-fv-muted" />
                      )}
                      <div className="min-w-0 flex-grow">
                        <p className={clsx('text-[11px] font-medium truncate', selectedIds.has(w.id) ? 'text-orange-100' : 'text-fv-text')}>
                          {w.name}
                        </p>
                        <p className="text-[9px] text-fv-faint mt-0.5 truncate">
                          {w.nodes.length} nodes • {w.active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </button>
                  ))}
                  {filteredWorkflows.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs text-fv-faint">No workflows found matching your search</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status message */}
            {statusMessage && (
              <div
                className={clsx(
                  'flex items-start gap-2 p-3 rounded-input text-xs',
                  connectionState === 'connected' && 'bg-fv-output/10 border border-fv-output/20 text-fv-output',
                  connectionState === 'error' && 'bg-red-400/10 border border-red-400/20 text-red-400',
                  connectionState === 'testing' && 'bg-fv-fetch/10 border border-fv-fetch/20 text-fv-fetch'
                )}
              >
                {connectionState === 'connected' && <Check size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />}
                {connectionState === 'error' && <AlertCircle size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />}
                {connectionState === 'testing' && <Loader2 size={14} className="flex-shrink-0 mt-0.5 animate-spin" aria-hidden="true" />}
                <span className="leading-relaxed">{statusMessage}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2 flex-shrink-0">
              {connectionState !== 'connected' ? (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionState === 'testing'}
                  aria-label="Test connection to n8n"
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-input text-sm font-semibold',
                    'transition-all duration-200 ease-smooth',
                    'focus-visible:ring-2 focus-visible:ring-orange-500',
                    connectionState === 'testing'
                      ? 'bg-orange-500/20 text-orange-300 cursor-wait'
                      : 'bg-orange-500 text-white hover:bg-orange-500/90 cursor-pointer'
                  )}
                >
                  {connectionState === 'testing' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Link2 size={14} aria-hidden="true" />
                      Test Connection
                    </>
                  )}
                </button>
              ) : (
                <div className="flex gap-2">
                   <button
                    type="button"
                    onClick={() => {
                      setConnectionState('idle');
                      setN8nWorkflows([]);
                      setSelectedIds(new Set());
                    }}
                    className="flex-shrink-0 px-4 py-3 rounded-input text-sm border border-fv-border text-fv-muted hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isImporting || selectedIds.size === 0}
                    aria-label={`Import ${selectedIds.size} workflows from n8n`}
                    className={clsx(
                      'flex-grow flex items-center justify-center gap-2 py-3 rounded-input text-sm font-semibold',
                      'transition-all duration-200 ease-smooth',
                      'focus-visible:ring-2 focus-visible:ring-fv-trigger',
                      isImporting
                        ? 'bg-fv-trigger/20 text-fv-trigger cursor-wait'
                        : selectedIds.size > 0
                          ? 'bg-fv-trigger text-fv-base hover:bg-fv-trigger/90 cursor-pointer'
                          : 'bg-white/5 text-fv-faint cursor-not-allowed'
                    )}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download size={14} aria-hidden="true" />
                        Import {selectedIds.size} Workflow{selectedIds.size === 1 ? '' : 's'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Info note */}
            {connectionState !== 'connected' && (
              <div className="flex items-start gap-2 p-3 rounded-input bg-fv-surface-2 border border-fv-border">
                <AlertCircle size={12} className="text-fv-faint flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[10px] text-fv-faint leading-relaxed">
                  FlowVault connects to n8n&apos;s REST API. Enable the API in your n8n instance
                  under <span className="font-mono text-fv-muted">Settings → API</span> and generate an API key.
                  All credentials in imported workflows are automatically stripped.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

