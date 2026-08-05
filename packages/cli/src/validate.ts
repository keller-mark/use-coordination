import { genericSpecSchema } from '@use-coordination/schemas';
import type { NormalizedSpec } from './types.js';

export interface ValidationResult {
  valid: boolean;
  /** Human-readable descriptions of the schema violations, if any. */
  issues: string[];
}

/**
 * Validate a spec against the generic (plugin-agnostic) spec schema.
 * @param spec The spec to validate.
 * @returns Whether the spec is valid, along with any issues.
 */
export function validateSpec(spec: NormalizedSpec): ValidationResult {
  const result = genericSpecSchema.safeParse(spec);
  if (result.success) {
    return { valid: true, issues: [] };
  }
  const issues = result.error.issues.map((issue) => {
    const path = issue.path.map(part => String(part)).join('.');
    return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
  });
  return { valid: false, issues };
}
