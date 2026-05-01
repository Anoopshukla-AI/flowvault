/**
 * FlowVault — Express Server Entry Point
 *
 * HTTP API server with middleware stack:
 * cors → helmet → json → redactMiddleware → routes
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { redactMiddleware } from './middleware/redact';
import { workflowsRouter } from './routes/workflows';
import { exportRouter } from './routes/export';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Apply redaction middleware to all API routes
app.use('/api', redactMiddleware);

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use('/api/workflows', workflowsRouter);
app.use('/api/export', exportRouter);

// ─── Health Check ───────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ─── Centralized Error Handler ──────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const statusCode = 'statusCode' in err ? (err as Record<string, unknown>).statusCode : 500;
    res.status(statusCode as number).json({
      data: null,
      error: err.message || 'Internal Server Error',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
);

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  // Server started on PORT
});

export default app;
