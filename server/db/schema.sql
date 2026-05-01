-- ============================================================================
-- FlowVault — PostgreSQL Database Schema
-- Version: 1.0
-- Database: PostgreSQL 15
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE step_type AS ENUM (
  'trigger',
  'fetch',
  'transform',
  'decision',
  'action',
  'output'
);

CREATE TYPE step_status AS ENUM (
  'pending',
  'running',
  'done',
  'error'
);

CREATE TYPE workflow_status AS ENUM (
  'idle',
  'running',
  'completed',
  'failed'
);

-- ─── Workflows ──────────────────────────────────────────────────────────────

CREATE TABLE workflows (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  tagline       VARCHAR(500) NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  category      VARCHAR(100) NOT NULL DEFAULT 'General',
  price         VARCHAR(20) NOT NULL DEFAULT '$0',
  estimated_time_saved VARCHAR(100) NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);

-- ─── Workflow Steps ─────────────────────────────────────────────────────────

CREATE TABLE workflow_steps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id   UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_number   INTEGER NOT NULL,
  type          step_type NOT NULL,
  label         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  data          JSONB NOT NULL DEFAULT '{}',
  sample_output JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workflow_id, step_number)
);

CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_type ON workflow_steps(type);

-- ─── Executions ─────────────────────────────────────────────────────────────

CREATE TABLE executions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status          workflow_status NOT NULL DEFAULT 'idle',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  total_duration_ms INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);

-- ─── Execution Step Logs ────────────────────────────────────────────────────
-- All input/output data stored here MUST be redacted by server middleware
-- before insertion. Assume this table can be read by untrusted parties.

CREATE TABLE execution_step_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id    UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  step_id         UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  step_number     INTEGER NOT NULL,
  status          step_status NOT NULL DEFAULT 'pending',
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  input           JSONB NOT NULL DEFAULT '{}',   -- REDACTED
  output          JSONB NOT NULL DEFAULT '{}',   -- REDACTED
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_execution_step_logs_execution_id ON execution_step_logs(execution_id);
CREATE INDEX idx_execution_step_logs_step_id ON execution_step_logs(step_id);
CREATE INDEX idx_execution_step_logs_status ON execution_step_logs(status);

-- ─── Product Bundles ────────────────────────────────────────────────────────
-- Stores exported product bundles. All data MUST be redacted before storage.

CREATE TABLE product_bundles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  execution_id    UUID REFERENCES executions(id) ON DELETE SET NULL,
  version         VARCHAR(10) NOT NULL DEFAULT '1.0',
  bundle_data     JSONB NOT NULL,                -- Full ProductBundle JSON (redacted)
  price           VARCHAR(20) NOT NULL DEFAULT '$0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_bundles_workflow_id ON product_bundles(workflow_id);
CREATE INDEX idx_product_bundles_created_at ON product_bundles(created_at DESC);

-- ─── Updated At Trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── Seed Data (Demo Workflow) ──────────────────────────────────────────────
-- A sample workflow for development and demo purposes.

INSERT INTO workflows (id, name, tagline, description, category, price, estimated_time_saved)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Lead Enrichment Pipeline',
  'Automatically enrich and qualify inbound leads from any source',
  'This workflow captures incoming leads from a webhook, enriches them with company data from Clearbit, scores them using custom logic, routes high-value leads to Salesforce, and sends a Slack notification to the sales team.',
  'Sales Automation',
  '$49',
  '45 min per lead'
);

INSERT INTO workflow_steps (workflow_id, step_number, type, label, description, data, sample_output)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, 'trigger', 'Webhook Received',
   'Captures incoming lead data from a form submission or API call.',
   '{"source": "typeform", "endpoint": "/webhooks/leads"}',
   '{"name": "Jane Smith", "email": "j***@company.com", "company": "Acme Corp"}'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, 'fetch', 'Enrich with Clearbit',
   'Fetches company and person data from Clearbit API.',
   '{"api": "clearbit", "lookup": "company+person"}',
   '{"company_size": "50-200", "industry": "SaaS", "funding": "$12M Series A"}'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, 'transform', 'Calculate Lead Score',
   'Applies custom scoring logic based on company size, industry, and engagement.',
   '{"model": "weighted_score", "weights": {"company_size": 0.3, "industry": 0.25, "engagement": 0.45}}',
   '{"score": 87, "tier": "A", "qualified": true}'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, 'decision', 'Route by Score',
   'Routes leads to different pipelines based on their qualification score.',
   '{"threshold_a": 80, "threshold_b": 50}',
   '{"route": "high_value", "next_action": "salesforce_create"}'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, 'action', 'Create in Salesforce',
   'Creates a new lead record in Salesforce with all enriched data.',
   '{"object": "Lead", "fields": ["Name", "Email", "Company", "Score"]}',
   '{"salesforce_id": "00Q5e000003ABC", "status": "created"}'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6, 'output', 'Notify Sales Team',
   'Sends a formatted Slack message to the #sales-leads channel.',
   '{"channel": "#sales-leads", "template": "new_qualified_lead"}',
   '{"slack_ts": "1234567890.123456", "delivered": true}');
