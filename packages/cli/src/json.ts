import { CliError } from './errors.js';
import type { JsonValue } from './types.js';

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse a command-line argument which represents a coordination value.
 * The argument is parsed as JSON when possible, otherwise it is
 * used as a plain string.
 * @param raw The raw command-line argument.
 * @returns The parsed value.
 */
export function parseValue(raw: string): JsonValue {
  try {
    return JSON.parse(raw) as JsonValue;
  } catch (e) {
    return raw;
  }
}

/**
 * Parse a command-line argument which is required to contain JSON.
 * @param raw The raw command-line argument.
 * @param label How to refer to the argument in error messages.
 * @returns The parsed value.
 */
export function parseJson(raw: string, label: string): JsonValue {
  try {
    return JSON.parse(raw) as JsonValue;
  } catch (e) {
    throw new CliError(`could not parse ${label} as JSON: ${(e as Error).message}`);
  }
}

/**
 * Parse a command-line argument which represents a spec key.
 * @param raw The raw command-line argument.
 * @returns The key as a number if it looks like one, otherwise as a string.
 */
export function parseKey(raw: string): string | number {
  const parsed = parseValue(raw);
  if (typeof parsed === 'number' && Number.isFinite(parsed)) {
    return parsed;
  }
  return raw;
}

export function serializeValue(value: unknown): string {
  // JSON.stringify returns undefined for values like undefined,
  // which cannot occur in a spec that was parsed from JSON,
  // but can occur when a coordination value is absent.
  return JSON.stringify(value ?? null, null, 2);
}

/**
 * Return a copy of an object without one of its keys,
 * preserving the order of the remaining keys.
 * @param obj The object to copy.
 * @param keyToOmit The key to omit.
 * @returns The new object.
 */
export function omitKey<T>(
  obj: Record<string, T>,
  keyToOmit: string,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => key !== keyToOmit),
  );
}

export function isEmptyObject(value: Record<string, unknown>): boolean {
  return Object.keys(value).length === 0;
}
