import { CliError, getErrorMessage } from './errors.js';
import { isPlainObject, isEmptyObject } from './json.js';
import type {
  CliCoordinationScopes,
  CliCoordinationScopesBy,
  CliCoordinationSpace,
  CliCoordinationValues,
  CliMetaCoordination,
  CliMetaCoordinationScopes,
  CliMetaCoordinationScopesBy,
  CliView,
  CliViewCoordination,
  CoordinationScopeName,
  NormalizedSpec,
} from './types.js';

/**
 * Create an empty spec.
 * @param key An optional top-level spec key.
 * @returns The empty spec.
 */
export function emptySpec(key?: string | number): NormalizedSpec {
  return {
    ...(key === undefined ? {} : { key }),
    coordinationSpace: {},
    viewCoordination: {},
  };
}

function normalizeKey(input: unknown): string | number | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  if (typeof input === 'string' || typeof input === 'number') {
    return input;
  }
  throw new CliError('expected spec.key to be a string or a number');
}

function normalizeCoordinationSpace(input: unknown): CliCoordinationSpace {
  if (input === undefined || input === null) {
    return {};
  }
  if (!isPlainObject(input)) {
    throw new CliError('expected spec.coordinationSpace to be an object');
  }
  const result: CliCoordinationSpace = {};
  Object.entries(input).forEach(([cType, cScopes]) => {
    if (cScopes === undefined || cScopes === null) {
      // The JSON schema allows null in place of the scopes for a coordination type.
      result[cType] = {};
      return;
    }
    if (!isPlainObject(cScopes)) {
      throw new CliError(`expected spec.coordinationSpace.${cType} to be an object`);
    }
    result[cType] = Object.fromEntries(
      Object.entries(cScopes).map(([cScope, cValue]) => [
        cScope,
        cValue === undefined ? null : cValue,
      ]),
    );
  });
  return result;
}

function normalizeScopeNames(
  input: unknown,
  path: string,
): CoordinationScopeName[] | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  // The JSON schema allows either one scope name or an array of scope names.
  const asArray = Array.isArray(input) ? input : [input];
  asArray.forEach((scopeName) => {
    if (typeof scopeName !== 'string') {
      throw new CliError(`expected ${path} to be a scope name or an array of scope names`);
    }
  });
  const result = asArray as CoordinationScopeName[];
  return result.length > 0 ? result : undefined;
}

function normalizeScopesMapping(
  input: unknown,
  path: string,
): CliCoordinationScopes | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  if (!isPlainObject(input)) {
    throw new CliError(`expected ${path} to be an object`);
  }
  return isEmptyObject(input) ? undefined : (input as CliCoordinationScopes);
}

function normalizeScopesByMapping(
  input: unknown,
  path: string,
): CliCoordinationScopesBy | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  if (!isPlainObject(input)) {
    throw new CliError(`expected ${path} to be an object`);
  }
  return isEmptyObject(input) ? undefined : (input as CliCoordinationScopesBy);
}

function normalizeCoordinationValues(
  input: unknown,
  path: string,
): CliCoordinationValues | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  if (!isPlainObject(input)) {
    throw new CliError(`expected ${path} to be an object`);
  }
  return isEmptyObject(input) ? undefined : (input as CliCoordinationValues);
}

/**
 * Construct a view mapping object with a canonical key order,
 * pruning any empty sub-objects.
 * @param parts The (possibly empty) parts of the view mapping object.
 * @returns The view mapping object.
 */
export function buildView(parts: CliView): CliView {
  const {
    coordinationScopes,
    coordinationScopesBy,
    metaCoordinationScopes,
    metaCoordinationScopesBy,
    coordinationValues,
  } = parts;
  const hasScopes = coordinationScopes !== undefined && !isEmptyObject(coordinationScopes);
  const hasScopesBy = coordinationScopesBy !== undefined && !isEmptyObject(coordinationScopesBy);
  const hasMeta = metaCoordinationScopes !== undefined && metaCoordinationScopes.length > 0;
  const hasMetaBy = metaCoordinationScopesBy !== undefined && metaCoordinationScopesBy.length > 0;
  const hasValues = coordinationValues !== undefined && !isEmptyObject(coordinationValues);
  return {
    ...(hasScopes ? { coordinationScopes } : {}),
    ...(hasScopesBy ? { coordinationScopesBy } : {}),
    ...(hasMeta ? { metaCoordinationScopes } : {}),
    ...(hasMetaBy ? { metaCoordinationScopesBy } : {}),
    ...(hasValues ? { coordinationValues } : {}),
  };
}

function normalizeView(input: unknown, viewUid: string): CliView {
  if (input === undefined || input === null) {
    return {};
  }
  if (!isPlainObject(input)) {
    throw new CliError(`expected spec.viewCoordination.${viewUid} to be an object`);
  }
  const coordinationScopes = normalizeScopesMapping(
    input.coordinationScopes,
    `spec.viewCoordination.${viewUid}.coordinationScopes`,
  );
  const coordinationScopesBy = normalizeScopesByMapping(
    input.coordinationScopesBy,
    `spec.viewCoordination.${viewUid}.coordinationScopesBy`,
  );
  const metaCoordinationScopes = normalizeScopeNames(
    input.metaCoordinationScopes,
    `spec.viewCoordination.${viewUid}.metaCoordinationScopes`,
  );
  const metaCoordinationScopesBy = normalizeScopeNames(
    input.metaCoordinationScopesBy,
    `spec.viewCoordination.${viewUid}.metaCoordinationScopesBy`,
  );
  const coordinationValues = normalizeCoordinationValues(
    input.coordinationValues,
    `spec.viewCoordination.${viewUid}.coordinationValues`,
  );
  return buildView({
    coordinationScopes,
    coordinationScopesBy,
    metaCoordinationScopes,
    metaCoordinationScopesBy,
    coordinationValues,
  });
}

function normalizeViewCoordination(input: unknown): CliViewCoordination {
  if (input === undefined || input === null) {
    return {};
  }
  if (!isPlainObject(input)) {
    throw new CliError('expected spec.viewCoordination to be an object');
  }
  return Object.fromEntries(
    Object.entries(input).map(([viewUid, view]) => [
      viewUid,
      normalizeView(view, viewUid),
    ]),
  );
}

function normalizeMetaCoordination(input: unknown): CliMetaCoordination | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  if (!isPlainObject(input)) {
    throw new CliError('expected spec.metaCoordination to be an object');
  }
  const { coordinationScopes, coordinationScopesBy } = input;
  if (coordinationScopes !== undefined && coordinationScopes !== null
    && !isPlainObject(coordinationScopes)) {
    throw new CliError('expected spec.metaCoordination.coordinationScopes to be an object');
  }
  if (coordinationScopesBy !== undefined && coordinationScopesBy !== null
    && !isPlainObject(coordinationScopesBy)) {
    throw new CliError('expected spec.metaCoordination.coordinationScopesBy to be an object');
  }
  const nextScopes = (
    isPlainObject(coordinationScopes) && !isEmptyObject(coordinationScopes)
      ? coordinationScopes as CliMetaCoordinationScopes
      : undefined
  );
  const nextScopesBy = (
    isPlainObject(coordinationScopesBy) && !isEmptyObject(coordinationScopesBy)
      ? coordinationScopesBy as CliMetaCoordinationScopesBy
      : undefined
  );
  if (nextScopes === undefined && nextScopesBy === undefined) {
    return undefined;
  }
  return {
    ...(nextScopes === undefined ? {} : { coordinationScopes: nextScopes }),
    ...(nextScopesBy === undefined ? {} : { coordinationScopesBy: nextScopesBy }),
  };
}

/**
 * Convert an arbitrary (JSON-parsed) value into a normalized spec:
 * fill in the top-level `coordinationSpace` and `viewCoordination`,
 * prune empty sub-objects, and coerce one-or-more scope names to arrays.
 * @param input The value to normalize.
 * @returns The normalized spec.
 */
export function normalizeSpec(input: unknown): NormalizedSpec {
  if (!isPlainObject(input)) {
    throw new CliError('expected the spec to be a JSON object');
  }
  const key = normalizeKey(input.key);
  const metaCoordination = normalizeMetaCoordination(input.metaCoordination);
  // The property order here determines the order of the keys in the output.
  return {
    ...(key === undefined ? {} : { key }),
    coordinationSpace: normalizeCoordinationSpace(input.coordinationSpace),
    ...(metaCoordination === undefined ? {} : { metaCoordination }),
    viewCoordination: normalizeViewCoordination(input.viewCoordination),
  };
}

/**
 * Parse the spec which was passed on stdin.
 * An empty (or absent) stdin results in an empty spec,
 * so that pipelines can be started from scratch.
 * @param text The contents of stdin.
 * @returns The normalized spec.
 */
export function parseSpec(text: string): NormalizedSpec {
  if (text.trim().length === 0) {
    return emptySpec();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new CliError(`could not parse the spec from stdin as JSON: ${getErrorMessage(e)}`);
  }
  return normalizeSpec(parsed);
}

/**
 * Serialize a spec for stdout.
 * @param spec The spec to serialize.
 * @returns The pretty-printed spec, with a trailing newline.
 */
export function serializeSpec(spec: NormalizedSpec): string {
  return `${JSON.stringify(spec, null, 2)}\n`;
}
