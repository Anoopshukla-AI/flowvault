/**
 * FlowVault — Server-Side Redaction Middleware
 *
 * Redacts request bodies BEFORE they reach any route handler.
 * This ensures sensitive data is never written to the database.
 */

import type { Request, Response, NextFunction } from 'express';

/** Redaction pattern definition */
interface RedactPattern {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string) => string);
}

/** All patterns from the redaction-engine skill */
const REDACT_PATTERNS: RedactPattern[] = [
  {
    name: 'anthropic-api-key',
    pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/g,
    replacement: 'sk-ant-••••••••••••••••••••',
  },
  {
    name: 'openai-api-key',
    pattern: /sk-[A-Za-z0-9]{20,}/g,
    replacement: 'sk-••••••••••••••••••••',
  },
  {
    name: 'bearer-token',
    pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
    replacement: 'Bearer ••••••••••••••••',
  },
  {
    name: 'aws-access-key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: 'AKIA••••••••••••••••',
  },
  {
    name: 'private-key',
    pattern: /-----BEGIN[A-Z ]+PRIVATE KEY-----[\s\S]+?-----END[A-Z ]+PRIVATE KEY-----/g,
    replacement: '-----BEGIN PRIVATE KEY----- [REDACTED] -----END PRIVATE KEY-----',
  },
  {
    name: 'gcp-service-account',
    pattern: /"private_key"\s*:\s*"[^"]+"/g,
    replacement: '"private_key": "[REDACTED]"',
  },
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacement: (match: string): string => {
      const parts = match.split('@');
      const local = parts[0] ?? '';
      const domain = parts[1] ?? '';
      return `${local[0] ?? ''}***@${domain}`;
    },
  },
  {
    name: 'credit-card',
    pattern: /\b(?:\d[ -]?){13,16}\b/g,
    replacement: '•••• •••• •••• ••••',
  },
  {
    name: 'phone-us',
    pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '•••-•••-••••',
  },
];

/** Redact a single string value */
function redactString(value: string): string {
  let result = value;
  for (const { pattern, replacement } of REDACT_PATTERNS) {
    pattern.lastIndex = 0;
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

/** Recursively redact all string values in an object */
function redactObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result[key] = redactString(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map((item: unknown) => {
        if (typeof item === 'string') return redactString(item);
        if (item !== null && typeof item === 'object') return redactObject(item as Record<string, unknown>);
        return item;
      });
    } else if (val !== null && typeof val === 'object') {
      result[key] = redactObject(val as Record<string, unknown>);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

/** Express middleware — redacts request body before route handler */
export function redactMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = redactObject(req.body as Record<string, unknown>);
  }
  next();
}
