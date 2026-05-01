---
name: redaction-engine
description: >
  Activate when implementing the secret redaction system — redact.ts,
  server-side redact middleware, or any export pipeline. Contains all
  regex patterns, replacement strategies, and test cases. MANDATORY
  before writing any redaction code.
---

# Redaction Engine Skill — FlowVault

## Threat Model

FlowVault users paste real workflow data including API keys, OAuth tokens,
database credentials, and PII. This data must NEVER appear in:
- Exported product packages (JSON bundles)
- Shareable demo recordings
- Database storage of execution logs
- Any API response returned to the client

## Redaction Runs Twice

1. **Server-side** — before writing to PostgreSQL (middleware)
2. **Client-side** — before displaying returned data or allowing export

Both layers are required. Assume the DB can be read by untrusted parties.

## Pattern Library (implement ALL of these)

```typescript
export const REDACT_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string) => string);
}> = [
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
    // Catches service account JSON blobs
    pattern: /"private_key"\s*:\s*"[^"]+"/g,
    replacement: '"private_key": "[REDACTED]"',
  },
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacement: (match: string) => {
      const [local, domain] = match.split('@');
      return `${local[0]}***@${domain}`;
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
```

## Core Functions (implement these signatures exactly)

```typescript
/** Redact a string value */
export function redactString(value: string): string

/** Redact any value — handles strings, objects, arrays recursively */
export function redact<T>(value: T): T

/** Redact all string values in an object recursively */
export function redactObject<T extends Record<string, unknown>>(obj: T): T

/** Check if a string contains sensitive data (for logging) */
export function containsSensitiveData(value: string): boolean

/** Get a list of which patterns matched (for audit logging) */
export function auditRedact(value: string): { redacted: string; patternsMatched: string[] }
```

## Express Middleware Pattern

```typescript
// server/middleware/redact.ts
export function redactMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Redact request body before it reaches any route handler
  if (req.body && typeof req.body === 'object') {
    req.body = redactObject(req.body);
  }
  next();
}
```

Apply to ALL routes that accept user data:
```typescript
app.use('/api', redactMiddleware);
```

## Test Cases (QA will verify these pass)

```typescript
// These must all return true (data successfully redacted)
assert(redactString('sk-abc123xyz789qwe456rty').includes('••••'))
assert(redactString('Bearer eyJhbGciOiJIUzI1NiJ9.abc').includes('••••'))
assert(redactString('user@company.com') === 'u***@company.com')
assert(redactString('AKIAIOSFODNN7EXAMPLE').includes('••••'))
assert(!redactString('sk-realkey12345678901234').includes('realkey'))

// Object redaction
const obj = { apiKey: 'sk-abc123xyz789', name: 'safe value' }
const redacted = redactObject(obj)
assert(redacted.name === 'safe value')
assert(!redacted.apiKey.includes('abc123'))
```

## Export Pipeline Integration

The export function in `ExportPanel.tsx` MUST call `redact()` on ALL
step data before serializing to JSON:

```typescript
const packageData = {
  steps: workflow.steps.map(step => ({
    ...step,
    data: redact(step.data),  // ← REQUIRED
  })),
};
```

Never export raw step data. Always redact first.
