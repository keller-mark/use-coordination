// Helper functions to express multi-level meta-coordination concisely via JSON.

import type {
  CoordinationSpace,
  CoordinationScopesMapping,
  CoordinationScopesByMapping,
} from '@use-coordination/types';
import { createPrefixedGetNextScopeNumeric } from '@use-coordination/utils';
import {
  CmvConfig,
  CmvConfigView,
  CmvConfigCoordinationScope,
  CL,
} from './CmvConfig.js';

/** The sentinel used to represent `CL(...)`, i.e., a nested coordination level. */
export const CL_SENTINEL = '$CL';
/** The sentinel used to represent an initial coordination value. */
export const VALUE_SENTINEL = '$value';
/** The sentinel used to reference a coordination scope which already exists. */
export const SCOPE_SENTINEL = '$scope';

const SENTINELS = [CL_SENTINEL, VALUE_SENTINEL, SCOPE_SENTINEL];

/**
 * The value which `CmvConfig.addCoordinationByObject` assigns to the
 * scopes which it creates for coordination levels.
 */
const DUMMY_VALUE = '__dummy__';

/**
 * The value for a coordination type in a multi-level object.
 * Exactly one sentinel key is expected, so that a coordination value
 * which happens to be an object is never mistaken for a nested level.
 */
export type MultiLevelValue = (
  { $CL: MultiLevelObject | MultiLevelObject[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { $value: any }
  | { $scope: string }
);

/** A (potentially nested) level of a multi-level object. */
export type MultiLevelObject = {
  [cType: string]: MultiLevelValue;
};

export interface ExpandMultiLevelObjectOptions {
  /**
   * The coordination space which already exists, if any. Used both to avoid
   * generating scope names which conflict with existing ones, and to
   * resolve the `{ "$scope": ... }` references. Scopes which are referenced
   * but absent here are assumed to be defined elsewhere.
   */
  coordinationSpace?: CoordinationSpace;
  /**
   * A prefix to add to all generated coordination scope names. Optional.
   */
  scopePrefix?: string | null;
}

export interface ExpandedMultiLevelObject {
  /**
   * The `options.coordinationSpace` passed in, plus the scopes which were
   * created for the coordination values in the multi-level object.
   */
  coordinationSpace: CoordinationSpace;
  /**
   * The mapping for the top level of the multi-level object. Can be used as a
   * view's `coordinationScopes`, or as the value for a `metaCoordinationScopes` scope.
   */
  coordinationScopes: CoordinationScopesMapping<CoordinationSpace>;
  /**
   * The mapping for the nested levels of the multi-level object. Can be used as a
   * view's `coordinationScopesBy`, or as the value for a `metaCoordinationScopesBy` scope.
   */
  coordinationScopesBy: CoordinationScopesByMapping<CoordinationSpace>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get the sentinel key for the value of a coordination type,
 * validating that there is exactly one.
 * @param value The value for the coordination type.
 * @param cType The coordination type, for error messages.
 * @returns The sentinel key.
 */
function getSentinel(value: unknown, cType: string): string {
  if (!isPlainObject(value)) {
    throw new Error(
      `Expected the value for the coordination type "${cType}" to be an object `
      + `containing one of the keys ${SENTINELS.join(', ')}.`,
    );
  }
  const keys = Object.keys(value);
  const sentinelKeys = keys.filter(key => SENTINELS.includes(key));
  if (sentinelKeys.length === 0) {
    throw new Error(
      `Expected the value for the coordination type "${cType}" to contain one of `
      + `the keys ${SENTINELS.join(', ')}. Wrap plain coordination values in `
      + `{ "${VALUE_SENTINEL}": ... }.`,
    );
  }
  if (sentinelKeys.length > 1) {
    throw new Error(
      `Expected the value for the coordination type "${cType}" to contain only one of `
      + `the keys ${SENTINELS.join(', ')}, but it contained ${sentinelKeys.join(', ')}.`,
    );
  }
  const [sentinel] = sentinelKeys;
  if (keys.length > 1) {
    throw new Error(
      `Expected "${sentinel}" to be the only key of the object which contains it, `
      + `for the coordination type "${cType}".`,
    );
  }
  return sentinel;
}

/**
 * Convert one level of a multi-level object into the corresponding
 * `CmvConfig.addCoordinationByObject` input, by recursion.
 * @param level The level to convert.
 * @param referencedScopes Mutated to collect the scope names which are
 * referenced via the `{ "$scope": ... }` sentinel, per coordination type.
 * @returns The input for `CmvConfig.addCoordinationByObject`.
 */
function reviveLevel(
  level: unknown,
  referencedScopes: Map<string, Set<string>>,
): Record<string, unknown> {
  if (!isPlainObject(level)) {
    throw new Error('Expected each coordination level to be an object of coordination types.');
  }
  return Object.fromEntries(Object.entries(level).map(([cType, value]) => {
    const sentinel = getSentinel(value, cType);
    const sentinelValue = (value as Record<string, unknown>)[sentinel];
    if (sentinel === CL_SENTINEL) {
      if (Array.isArray(sentinelValue)) {
        return [cType, CL(sentinelValue.map(el => reviveLevel(el, referencedScopes)))];
      }
      if (isPlainObject(sentinelValue)) {
        return [cType, CL(reviveLevel(sentinelValue, referencedScopes))];
      }
      throw new Error(
        `Expected the value of "${CL_SENTINEL}" for the coordination type "${cType}" `
        + 'to be an object or an array of objects.',
      );
    }
    if (sentinel === SCOPE_SENTINEL) {
      if (typeof sentinelValue !== 'string' || sentinelValue.length === 0) {
        throw new Error(
          `Expected the value of "${SCOPE_SENTINEL}" for the coordination type "${cType}" `
          + 'to be a non-empty string.',
        );
      }
      if (!referencedScopes.has(cType)) {
        referencedScopes.set(cType, new Set());
      }
      referencedScopes.get(cType)!.add(sentinelValue);
      // A referenced scope already exists, so its value is left alone.
      return [cType, new CmvConfigCoordinationScope(cType, sentinelValue)];
    }
    // The value sentinel: the coordination value is used verbatim,
    // so nested sentinels are not treated as such.
    return [cType, sentinelValue];
  }));
}

/**
 * Expand a concise JSON representation of (potentially multi-level) coordination
 * into a coordination space and the scope mappings which reference it.
 * @param inputObj A (potentially nested) object with coordination types as keys, and
 * values being objects which contain exactly one of the sentinel keys
 * `$CL` (a nested coordination level, or an array of them),
 * `$value` (an initial coordination value), or
 * `$scope` (the name of a coordination scope which already exists).
 * @param options Optional.
 * @param options.coordinationSpace The coordination space which already exists.
 * @param options.scopePrefix A prefix to add to all generated scope names.
 * @returns An object containing `coordinationSpace`, `coordinationScopes`,
 * and `coordinationScopesBy`.
 */
export function expandMultiLevelObject(
  inputObj: MultiLevelObject,
  options: ExpandMultiLevelObjectOptions | null = null,
): ExpandedMultiLevelObject {
  /*
    Input:
    {
      spatialImageLayer: { "$CL": [
        {
          image: { "$value": 'S-1905-017737_bf' },
          spatialLayerVisible: { "$value": true },
          spatialLayerOpacity: { "$value": 1 },
          spatialImageChannel: { "$CL": [
            {
              spatialTargetC: { "$value": 0 },
              spatialChannelColor: { "$value": [255, 0, 0] },
            },
            {
              spatialTargetC: { "$value": 1 },
              spatialChannelColor: { "$scope": "myExistingColorScope" },
            },
          ] },
        },
      ] },
    }

    Output: see addCoordinationByObject unit tests
  */
  const { coordinationSpace: prevCoordinationSpace = {}, scopePrefix = null } = options || {};

  // Convert to the form which the object-oriented API expects,
  // so that the same logic can be used for the forward direction.
  const referencedScopes = new Map<string, Set<string>>();
  const input = reviveLevel(inputObj, referencedScopes);

  const config = CmvConfig.fromJSON({ coordinationSpace: prevCoordinationSpace });
  if (scopePrefix) {
    config.getNextScope = createPrefixedGetNextScopeNumeric(scopePrefix);
  }

  // Reserve the scope names which are referenced but are not (yet) in the
  // coordination space, so that generated names cannot collide with them.
  const reservedScopes: [string, string][] = [];
  referencedScopes.forEach((cScopeNames, cType) => {
    cScopeNames.forEach((cScopeName) => {
      if (!Object.hasOwn(config.config.coordinationSpace[cType] || {}, cScopeName)) {
        config.setCoordinationValue(cType, cScopeName, null);
        reservedScopes.push([cType, cScopeName]);
      }
    });
  });

  const scopes = config.addCoordinationByObject(input);

  // Use a view which is not added to the config, to get the scope mappings
  // without adding a view to the output.
  const view = new CmvConfigView(undefined, undefined);
  view.useCoordinationByObject(scopes);
  const { coordinationScopes = {}, coordinationScopesBy = {} } = view.toJSON();

  // The reserved scopes were only used for name generation.
  reservedScopes.forEach(([cType, cScopeName]) => {
    delete config.config.coordinationSpace[cType][cScopeName];
    if (Object.keys(config.config.coordinationSpace[cType]).length === 0) {
      delete config.config.coordinationSpace[cType];
    }
  });

  return {
    coordinationSpace: config.toJSON().coordinationSpace,
    coordinationScopes,
    coordinationScopesBy,
  };
}

export interface CollapseMultiLevelObjectInput {
  /**
   * The coordination space in which the scope names are defined. Optional:
   * scopes whose values are not found here are referenced via
   * the `{ "$scope": ... }` sentinel rather than inlined.
   */
  coordinationSpace?: CoordinationSpace;
  /** The mapping for the top level, e.g., a view's `coordinationScopes`. */
  coordinationScopes?: CoordinationScopesMapping<CoordinationSpace>;
  /** The mapping for the nested levels, e.g., a view's `coordinationScopesBy`. */
  coordinationScopesBy?: CoordinationScopesByMapping<CoordinationSpace>;
}

/** A scope name, or an array of them, as found in the scope mappings. */
type ScopeRef = string | string[];

/** A key for a (coordination type, scope name) pair, or a scopes-by entry. */
function tupleKey(...parts: string[]): string {
  return JSON.stringify(parts);
}

/**
 * Try to reconstruct the concise multi-level object which corresponds to a set of
 * scope mappings: the reverse of `expandMultiLevelObject`.
 *
 * Not every set of mappings can be expressed as a multi-level object, since the
 * multi-level representation assumes a tree: each scope in `coordinationScopesBy`
 * has exactly one parent, and each non-level scope holds one value. When the
 * mappings do form a tree, the result round-trips: expanding it (passing the same
 * `coordinationSpace`) yields equivalent mappings, up to generated scope names.
 *
 * A best attempt is made in the cases which are only partially expressible:
 * a scope which is shared between multiple places, or which is absent from the
 * coordination space, is referenced via `{ "$scope": ... }` rather than inlined
 * via `{ "$value": ... }`, so no value is duplicated or invented.
 * @param input An object containing `coordinationSpace` (optional),
 * `coordinationScopes`, and `coordinationScopesBy`. The output of
 * `expandMultiLevelObject` can be passed directly.
 * @returns The multi-level object, or `null` if the mappings cannot be
 * represented as one.
 */
export function tryCollapseMultiLevelObject(
  input: CollapseMultiLevelObjectInput,
): MultiLevelObject | null {
  const {
    coordinationSpace = {},
    coordinationScopes = {},
    coordinationScopesBy = {},
  } = input;

  // The mapped types are awkward to index by plain strings, and the
  // recursion below does not depend on the coordination type parameters.
  const scopes = coordinationScopes as Record<string, ScopeRef | undefined>;
  const scopesBy = coordinationScopesBy as Record<
    string, Record<string, Record<string, ScopeRef> | undefined> | undefined
  >;

  // Whether the mappings turned out not to be representable.
  let failed = false;

  // How many times each (coordination type, scope name) pair is referenced by
  // the mappings. A scope which is referenced more than once is shared, so its
  // value cannot be inlined (and a shared level cannot be expressed at all).
  const usageCounts = new Map<string, number>();
  function countUsage(cType: string, scopeRef: ScopeRef): void {
    (Array.isArray(scopeRef) ? scopeRef : [scopeRef]).forEach((cScopeName) => {
      const key = tupleKey(cType, cScopeName);
      usageCounts.set(key, (usageCounts.get(key) || 0) + 1);
    });
  }
  Object.entries(scopes).forEach(([cType, scopeRef]) => {
    if (scopeRef !== undefined) {
      countUsage(cType, scopeRef);
    }
  });
  Object.values(scopesBy).forEach((byType) => {
    Object.entries(byType || {}).forEach(([childCType, mapping]) => {
      Object.values(mapping || {}).forEach(scopeRef => countUsage(childCType, scopeRef));
    });
  });

  function isShared(cType: string, cScopeName: string): boolean {
    return (usageCounts.get(tupleKey(cType, cScopeName)) || 0) > 1;
  }

  // How many times each entry of `coordinationScopesBy` was reached by the
  // recursion below, to detect entries which would be dropped or duplicated.
  const consumedCounts = new Map<string, number>();
  // The scopes on the current path, to detect cyclic mappings.
  const visiting = new Set<string>();

  /**
   * Whether a scope has nested levels, i.e., whether it is a level scope
   * (created by `CL(...)`) rather than one which holds a coordination value.
   */
  function hasChildren(cType: string, cScopeName: string): boolean {
    return Object.values(scopesBy[cType] || {})
      .some(mapping => Object.hasOwn(mapping || {}, cScopeName));
  }

  /** The value for a coordination type which does not have nested levels. */
  function leafValue(cType: string, cScopeName: string): MultiLevelValue {
    if (isShared(cType, cScopeName) || !Object.hasOwn(coordinationSpace[cType] || {}, cScopeName)) {
      // Inlining a shared scope would duplicate its value (and un-share it), and a
      // scope which is absent from the coordination space has no value to inline,
      // so refer to the scope by name in both cases.
      return { [SCOPE_SENTINEL]: cScopeName };
    }
    return { [VALUE_SENTINEL]: coordinationSpace[cType][cScopeName] };
  }

  /** One level of the multi-level object: the children of a level scope. */
  function levelFor(cType: string, cScopeName: string): MultiLevelObject {
    if (isShared(cType, cScopeName)) {
      // The level would need to be repeated at each place which references it,
      // which would create a separate copy of its scopes per place.
      failed = true;
      return {};
    }
    const visitKey = tupleKey(cType, cScopeName);
    if (visiting.has(visitKey)) {
      // Cyclic mappings have no finite multi-level representation.
      failed = true;
      return {};
    }
    visiting.add(visitKey);
    const level: MultiLevelObject = {};
    Object.entries(scopesBy[cType] || {}).forEach(([childCType, mapping]) => {
      if (!mapping || !Object.hasOwn(mapping, cScopeName)) {
        return;
      }
      const consumedKey = tupleKey(cType, childCType, cScopeName);
      consumedCounts.set(consumedKey, (consumedCounts.get(consumedKey) || 0) + 1);
      // eslint-disable-next-line no-use-before-define
      level[childCType] = valueFor(childCType, mapping[cScopeName]);
    });
    visiting.delete(visitKey);
    return level;
  }

  /** One level, for a scope which is used in a position where a level is required. */
  function requiredLevelFor(cType: string, cScopeName: string): MultiLevelObject {
    if (!hasChildren(cType, cScopeName)) {
      // The scope is not a level scope, so it presumably holds a coordination value,
      // which the nested-level representation has nowhere to store.
      const cValue = coordinationSpace[cType]?.[cScopeName];
      if (cValue !== undefined && cValue !== DUMMY_VALUE) {
        failed = true;
      }
      return {};
    }
    return levelFor(cType, cScopeName);
  }

  /** The value for a coordination type, given the scope(s) mapped to it. */
  function valueFor(cType: string, scopeRef: ScopeRef): MultiLevelValue {
    if (Array.isArray(scopeRef)) {
      // Multiple scopes for one coordination type are only expressible
      // as an array of nested levels.
      return { [CL_SENTINEL]: scopeRef.map(s => requiredLevelFor(cType, s)) };
    }
    if (hasChildren(cType, scopeRef)) {
      return { [CL_SENTINEL]: levelFor(cType, scopeRef) };
    }
    return leafValue(cType, scopeRef);
  }

  const result: MultiLevelObject = {};
  Object.entries(scopes).forEach(([cType, scopeRef]) => {
    if (scopeRef !== undefined) {
      result[cType] = valueFor(cType, scopeRef);
    }
  });

  // Every entry of `coordinationScopesBy` must have been reached exactly once,
  // otherwise the multi-level object would omit it (its parent scope is not
  // referenced anywhere) or repeat it.
  Object.entries(scopesBy).forEach(([parentCType, byType]) => {
    Object.entries(byType || {}).forEach(([childCType, mapping]) => {
      Object.keys(mapping || {}).forEach((parentScopeName) => {
        if (consumedCounts.get(tupleKey(parentCType, childCType, parentScopeName)) !== 1) {
          failed = true;
        }
      });
    });
  });

  return failed ? null : result;
}
