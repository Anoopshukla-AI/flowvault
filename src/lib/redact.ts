/**
 * FlowVault — Client-Side Redaction Engine
 *
 * Runs BEFORE displaying returned data or allowing export.
 * All patterns from the redaction-engine skill are implemented.
 * This is a security-critical module — every export path MUST use it.
 */

/** A single redaction pattern definition */
interface RedactPattern {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string) => string);
}

/** All redaction patterns — implements the full pattern library */
export const REDACT_PATTERNS: RedactPattern[] = [
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
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
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

/** Redact a string value by applying all patterns */
export function redactString(value: string): string {
  let result = value;
  for (const { pattern, replacement } of REDACT_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

/** Redact any value — handles strings, objects, arrays recursively */
export function redact<T>(value: T): T {
  if (typeof value === 'string') {
    return redactString(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => redact(item)) as T;
  }
  if (value !== null && typeof value === 'object') {
    return redactObject(value as Record<string, unknown>) as T;
  }
  return value;
}

/** Redact all string values in an object recursively */
export function redactObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result[key] = redactString(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map((item: unknown) => redact(item));
    } else if (val !== null && typeof val === 'object') {
      result[key] = redactObject(val as Record<string, unknown>);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

/** Check if a string contains sensitive data */
export function containsSensitiveData(value: string): boolean {
  for (const { pattern } of REDACT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

/** Get a list of which patterns matched (for audit logging) */
export function auditRedact(value: string): { redacted: string; patternsMatched: string[] } {
  const patternsMatched: string[] = [];
  let result = value;

  for (const { name, pattern, replacement } of REDACT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(value)) {
      patternsMatched.push(name);
    }
    pattern.lastIndex = 0;
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }

  return { redacted: result, patternsMatched };
}
