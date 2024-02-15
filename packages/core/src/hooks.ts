/* eslint-disable max-len */
/* eslint-disable react-refresh/only-export-components */
import { useRef, useMemo } from 'react';
import create from 'zustand';
import createContext from 'zustand/context';
import shallow from 'zustand/shallow';
import { cloneDeep } from 'lodash-es';
import { META_COORDINATION_SCOPES, META_COORDINATION_SCOPES_BY } from '@use-coordination/constants-internal';
import { fromEntries, capitalize } from '@use-coordination/utils';
import { getCoordinationSpaceAndScopes } from '@use-coordination/config';
import { CmvConfigObject } from './prop-types.js';

// Reference: https://github.com/pmndrs/zustand#react-context
// Reference: https://github.com/pmndrs/zustand/blob/e47ea03/tests/context.test.tsx#L60
const {
  Provider: CoordinationStoreProviderLocal,
  useStore: useCoordinationStoreLocal,
  useStoreApi: useCoordinationStoreApiLocal,
} = createContext();

export const CoordinationStoreProvider = CoordinationStoreProviderLocal;
export const useCoordinationStore = useCoordinationStoreLocal;
export const useCoordinationStoreApi = useCoordinationStoreApiLocal;

// Guidelines for parameter ordering:
// - viewUid
// - coordinationSpace (or part of it)
// - coordinationScopes
// - coordinationScopesBy
// - coarser coordination type(s)
// - finer coordination type(s)

// Functions that begin with underscore are intended to accept
// coordinationScopes and coordinationScopesBy as arguments
// for improved performance (so no need to recompute internally).

/**
 * Get the "computed" coordinationScopes after accounting for
 * meta-coordination.
 * @param {*} coordinationScopes The coordinationScopes for a view.
 * @param {*} coordinationSpace The coordinationSpace for a config.
 * @returns {string|undefined} The coordinationScopesBy after meta-coordination.
 */
export function getScopes(metaSpace: Record<string, Record<string, any>>, coordinationScopes: Record<string, string | string[]>) {
  let result = { ...coordinationScopes };
  // Check if there is a matching meta-scope.
  if (metaSpace) {
    // Determine if there is a meta-scope that would take precedence.
    const metaScopes = coordinationScopes[META_COORDINATION_SCOPES];
    if (metaScopes && metaSpace) {
      // The view.coordinationScopes.metaCoordinationScopes might be an array or a string.
      // Convert to an array.
      const metaScopesArr = Array.isArray(metaScopes) ? metaScopes : [metaScopes];
      metaScopesArr.forEach((metaScope) => {
        // Merge the original coordinationScopes with the matching meta-coordinationScopes
        // from the coordinationSpace.
        let o1 = result;
        const o2 = metaSpace[metaScope] || {};
        Object.entries(o2).forEach(([cType, cScope]) => {
          o1 = {
            ...o1,
            [cType]: cScope,
          };
        });
        result = o1;
      });
    }
  }
  return result;
}

/**
 * Get the "computed" coordinationScopesBy after accounting for
 * meta-coordination.
 * @param {*} coordinationScopes The coordinationScopes for a view.
 * @param {*} coordinationScopesBy The coordinationScopesBy for a view.
 * @param {*} coordinationSpace The coordinationSpace for a config.
 * @returns {string|undefined} The coordinationScopesBy after meta-coordination.
 */
export function getScopesBy(metaSpaceBy: Record<string, Record<string, any>>, coordinationScopes: Record<string, any>, coordinationScopesBy: Record<string, any>) {
  let result = { ...coordinationScopesBy };
  // Check if there is a matching meta-scope.
  if (metaSpaceBy) {
    // Determine if there is a meta-scope that would take precedence.
    const metaScopesBy = coordinationScopes[META_COORDINATION_SCOPES_BY];
    if (metaSpaceBy && metaScopesBy) {
      // The view.coordinationScopes.metaCoordinationScopes might be an array or a string.
      // Convert to an array.
      const metaScopesArr = Array.isArray(metaScopesBy) ? metaScopesBy : [metaScopesBy];
      metaScopesArr.forEach((metaScope) => {
        // Merge the original coordinationScopesBy with the matching meta-coordinationScopesBy
        // from the coordinationSpace.
        let o1 = result;
        const o2: Record<string, Record<string, Record<string, string|string[]>>> = metaSpaceBy[metaScope] || {};
        // Cannot simply use lodash merge(o1, o2)
        // because we do not want to merge (objects/arrays) at the leaf
        // (i.e., secondaryScopeVal) level.
        // We want the values in o2 to take precedence over the values in o1.
        Object.entries(o2).forEach(([primaryType, primaryObj]) => {
          Object.entries(primaryObj).forEach(([secondaryType, secondaryObj]) => {
            Object.entries(secondaryObj).forEach(([primaryScope, secondaryScopeVal]) => {
              o1 = {
                ...o1,
                [primaryType]: {
                  ...(o1?.[primaryType] || {}),
                  [secondaryType]: {
                    ...(o1?.[primaryType]?.[secondaryType] || {}),
                    [primaryScope]: secondaryScopeVal,
                  },
                },
              };
            });
          });
        });
        result = o1;
      });
    }
  }
  return result;
}

/**
 * Get the name of the metaCoordinationScopes coordination scope
 * for a particular non-meta coordination scope, after accounting for
 * meta-coordination.
 * @param {*} coordinationSpace The coordinationSpace for a config.
 * @param {*} coordinationScopes The coordinationScopes for a view.
 * @param {string} parameter The parameter for which to get the metaScope.
 * @returns {string|undefined} The metaCoordinationScopes coordination scope name.
 */
export function getMetaScope(coordinationSpace: Record<string, Record<string, any>>, coordinationScopes: Record<string, string | string[]>, parameter: string) {
  let latestMetaScope;
  // Check if there is a matching meta-scope.
  if (coordinationSpace) {
    // Determine if there is a meta-scope that would take precedence.
    const metaScopes = coordinationScopes[META_COORDINATION_SCOPES];
    const metaSpace = coordinationSpace[META_COORDINATION_SCOPES];
    if (metaScopes && metaSpace) {
      // The view.coordinationScopes.metaCoordinationScopes might be an array or a string.
      // Convert to an array.
      const metaScopesArr = Array.isArray(metaScopes) ? metaScopes : [metaScopes];
      metaScopesArr.forEach((metaScope) => {
        // Merge the original coordinationScopes with the matching meta-coordinationScopes
        // from the coordinationSpace.
        if (metaSpace[metaScope][parameter]) {
          latestMetaScope = metaScope;
        }
      });
    }
  }
  return latestMetaScope;
}

/**
 * Get the name of the metaCoordinationScopesBy coordination scope
 * for a particular non-meta coordination scope, after accounting for
 * meta-coordination.
 * @param {*} coordinationSpace The coordinationSpace for a config.
 * @param {*} coordinationScopes The coordinationScopes for a view.
 * @param {string} byParameter The byParameter for which to get the metaScope.
 * @param {string} parameter The parameter for which to get the metaScope.
 * @param {string|null} byScope The byScope for the byParameter in which to look for the metaScope.
 * @returns {string|undefined} The metaCoordinationScopesBy coordination scope name.
 */
export function getMetaScopeBy(coordinationSpace: Record<string, Record<string, any>>, coordinationScopes: Record<string, string | string[]>, byParameter: string, parameter: string, byScope: string | null) {
  let latestMetaScope;
  // Check if there is a matching meta-scope.
  if (coordinationSpace) {
    // Determine if there is a meta-scope that would take precedence.
    const metaScopesBy = coordinationScopes[META_COORDINATION_SCOPES_BY];
    const metaSpaceBy = coordinationSpace[META_COORDINATION_SCOPES_BY];
    if (metaSpaceBy && metaScopesBy) {
      // The view.coordinationScopes.metaCoordinationScopes might be an array or a string.
      // Convert to an array.
      const metaScopesArr = Array.isArray(metaScopesBy) ? metaScopesBy : [metaScopesBy];
      metaScopesArr.forEach((metaScope) => {
        // Merge the original coordinationScopesBy with the matching meta-coordinationScopesBy
        // from the coordinationSpace.
        if(byScope !== null) {
          if (metaSpaceBy[metaScope]?.[byParameter]?.[parameter]?.[byScope]) {
            latestMetaScope = metaScope;
          }
        } else {
          if (metaSpaceBy[metaScope]?.[byParameter]?.[parameter]) {
            latestMetaScope = metaScope;
          }
        }
      });
    }
  }
  return latestMetaScope;
}

/**
 * Get the matching parameter scope.
 * @param {string} parameter A coordination type.
 * @param {*} coordinationScopes The coordinationScopes for a view.
 * @returns {string|undefined} The coordination scope that matches.
 */
export function getParameterScope(coordinationScopes: Record<string, string | string[]>, parameter: string) {
  return coordinationScopes[parameter];
}

/**
 * Get the matching parameter scope.
 * @param {string} parameter A coordination type.
 * @param {*} coordinationScopes The coordinationScopes for a view.
 * @param {*} coordinationScopesBy The coordinationScopesBy for a view.
 * @returns {string|undefined} The coordination scope that matches.
 */
export function getParameterScopeBy(
  coordinationScopes: Record<string, any>, coordinationScopesBy: Record<string, any>,
  byType: string, typeScope: string, parameter: string,
) {
  const parameterScopeGlobal = coordinationScopes[parameter];
  // Set parameterScope to the non-meta-value first.
  const parameterScopeByType = coordinationScopesBy?.[byType]?.[parameter];

  if (parameterScopeByType && parameterScopeByType[typeScope]) {
    return parameterScopeByType[typeScope];
  }
  // console.error(`coordination scope for ${parameter} was not found.`);
  return parameterScopeGlobal;
}


/**
 * The useCoordinationStore hook is initialized via the zustand
 * create() function, which sets up both the state variables
 * and the reducer-type functions.
 * References:
 * - https://github.com/react-spring/zustand
 * - https://github.com/pmndrs/zustand/releases/tag/v3.6.0
 * - https://github.com/pmndrs/zustand#using-subscribe-with-selector
 * @returns {function} The useStore hook.
 */
export const createCoordinationStore = (initialSpec: CmvConfigObject, onCreateStore: Function | undefined) => create(set => ({
  // State:
  // The spec is an object which must conform to the schema
  // found in src/schemas/config.schema.json.
  spec: initialSpec,
  // Store the initial config so that its values can be used for resetting.
  initialSpec: cloneDeep(initialSpec),
  // The loaders object is a mapping from dataset ID to
  // data type to loader object instance.
  // Reducer functions which update the state
  // (although technically also part of state):
  setSpec: (spec: CmvConfigObject) => set({ spec, initialSpec: spec }),
  setCoordinationValue: ({
    parameter, value, coordinationScopes,
    byType, typeScope, coordinationScopesBy,
  }: { parameter: string, value: any, coordinationScopes: Record<string, any>, byType: string, typeScope: string, coordinationScopesBy: Record<string, any> }) => set((state: any) => {
    const { coordinationSpace } = state.spec;
    let scope;
    if (!byType) {
      scope = getParameterScope(coordinationScopes, parameter);
    } else {
      scope = getParameterScopeBy(
        coordinationScopes, coordinationScopesBy, byType, typeScope,  parameter,
      );
      if (!scope) {
        // Fall back to using the view-level scope.
        scope = getParameterScope(coordinationScopes, parameter);
      }
    }
    return {
      spec: {
        ...state.spec,
        coordinationSpace: {
          ...coordinationSpace,
          [parameter]: {
            ...coordinationSpace[parameter],
            [scope]: value,
          },
        },
      },
    };
  }),
  mergeCoordination: (newCoordinationValues: Record<string, any>, scopePrefix: string, viewUid: string) => set((state: any) => {
    const { coordinationSpace, viewCoordination } = state.spec;
    const {
      coordinationSpace: newCoordinationSpace,
      coordinationScopes,
    } = getCoordinationSpaceAndScopes(newCoordinationValues, scopePrefix);
    // Merge coordination objects in coordination space
    Object.entries(newCoordinationSpace as Record<string, any>).forEach(([coordinationType, coordinationObj]) => {
      if (coordinationType === META_COORDINATION_SCOPES) {
        // Perform an extra level of merging for meta-coordination scopes.
        Object.entries(coordinationObj as Record<string, any>).forEach(([coordinationScope, coordinationValue]) => {
          coordinationSpace[coordinationType] = {
            ...coordinationSpace[coordinationType],
            [coordinationScope]: {
              ...coordinationValue,
              ...(coordinationSpace[coordinationType]?.[coordinationScope] || {}),
            },
          };
        });
      } else if (coordinationType === META_COORDINATION_SCOPES_BY) {
        // Perform two extra levels of merging for meta-coordination scopesBy.
        Object.entries(coordinationObj as Record<string, any>).forEach(([coordinationScope, coordinationValue]) => {
          Object.entries(coordinationValue as Record<string, any>).forEach(([primaryType, primaryObj]) => {
            Object.entries(primaryObj as Record<string, any>).forEach(([secondaryType, secondaryObj]) => {
              coordinationSpace[coordinationType] = {
                ...coordinationSpace[coordinationType],
                [coordinationScope]: {
                  ...(coordinationSpace[coordinationType]?.[coordinationScope] || {}),
                  [primaryType]: {
                    ...(coordinationSpace[coordinationType]?.[coordinationScope]?.[primaryType] || {}),
                    [secondaryType]: {
                      ...secondaryObj,
                      ...(coordinationSpace[coordinationType]?.[coordinationScope]?.[primaryType]?.[secondaryType] || {}),
                    },
                  },
                },
              };
            });
          });
        });
      } else {
        coordinationSpace[coordinationType] = {
          ...coordinationObj,
          // Existing coordination values should be preserved,
          // so that user-defined values take precedence over auto-initialization values.
          ...(coordinationSpace[coordinationType] || {}),
        };
      }
    });

    const newSpec = {
      ...state.spec,
      coordinationSpace: {
        ...coordinationSpace,
      },
      viewCoordination: {
        ...viewCoordination,
        [viewUid]: {
          ...viewCoordination[viewUid],
          coordinationScopes: {
            ...viewCoordination[viewUid].coordinationScopes,
            [META_COORDINATION_SCOPES]: [
              ...(coordinationScopes[META_COORDINATION_SCOPES] || []),
              ...(viewCoordination[viewUid].coordinationScopes[META_COORDINATION_SCOPES] || []),
            ],
            [META_COORDINATION_SCOPES_BY]: [
              ...(coordinationScopes[META_COORDINATION_SCOPES_BY] || []),
              ...(viewCoordination[viewUid].coordinationScopes[META_COORDINATION_SCOPES_BY] || []),
            ],
          },
        },
      },
    };
    return {
      spec: newSpec,
    };
  }),
  ...(onCreateStore ? onCreateStore(set) : {}),
}));

/**
 * Get the coordination information for a view.
 * @param {string} viewUid The view of interest
 * @returns {[coordinationScopes, coordinationScopesBy]}
 */
export function useRawViewMapping(viewUid: string) {
  const viewCoordination = useCoordinationStore((state: any) => {
    const { viewCoordination } = state.spec;
    return viewCoordination;
  }, shallow);

  return useMemo(() => {
    return [
      viewCoordination?.[viewUid]?.coordinationScopes,
      viewCoordination?.[viewUid]?.coordinationScopesBy,
    ];
  }, [viewCoordination, viewUid])
}

/**
 * Get the coordination information for a view,
 * after accounting for meta-coordination.
 * @param {string} viewUid The view of interest
 * @returns {[coordinationScopes, coordinationScopesBy]}
 */
export function useViewMapping(viewUid: string) {
  const [coordinationScopesRaw, coordinationScopesByRaw] = useRawViewMapping(viewUid);

  const metaSpace = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    return coordinationSpace?.[META_COORDINATION_SCOPES];
  }, shallow);

  const coordinationScopes = useMemo(() => {
    const scopes = getScopes(
      metaSpace,
      coordinationScopesRaw,
    );
    // Prevent infinite loop, delete metaCoordinationScopes now that they are computed.
    delete scopes[META_COORDINATION_SCOPES];
    return scopes;
  }, [coordinationScopesRaw, metaSpace]);

  const metaSpaceBy = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    return coordinationSpace?.[META_COORDINATION_SCOPES_BY];
  }, shallow);
  const coordinationScopesBy = useMemo(() => {
    const scopesBy = getScopesBy(
      metaSpaceBy,
      coordinationScopes,
      coordinationScopesByRaw,
    );
    return scopesBy;
  }, [coordinationScopes, coordinationScopesByRaw, metaSpaceBy]);

  return [coordinationScopes, coordinationScopesBy];
}

/**
 * This hook uses the same logic as for the `values` part of
 * the useCoordination hook, with the difference that it
 * gets its values from the _initial_ view config rather
 * than the current view config.
 * @param {object} coordinationScopes Mapping of coordination types
 * @param {string[]} parameters Array of coordination types.
 * to scope names.
 * @returns {object} Object containing all coordination values.
 */
export function _useInitialCoordination(coordinationScopes: Record<string, any>, parameters: string[]) {
  const values = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.initialSpec;
    return fromEntries(parameters.map((parameter) => {
      if (coordinationSpace && coordinationSpace[parameter]) {
        const value = coordinationSpace[parameter][coordinationScopes[parameter]];
        return [parameter, value];
      }
      return [parameter, undefined];
    }));
  }, shallow);
  return values;
}

/**
 * Convenience version of _useInitialCoordination.
 * Does an internal lookup of coordinationScopes via useViewMapping.
 * @param viewUid 
 * @param parameters 
 * @returns 
 */
export function useInitialCoordination(viewUid: string, parameters: string[]) {
  const [coordinationScopes] = useViewMapping(viewUid);
  return _useInitialCoordination(coordinationScopes, parameters);
}


/**
 * The useCoordination hook returns both the
 * values and setter functions for the coordination objects
 * in a particular coordination scope mapping.
 * This hook is intended to be used within the ___Subscriber
 * components to allow them to "hook into" only those coordination
 * objects and setter functions of relevance.
 * @param {object} coordinationScopes Mapping of coordination types
 * to scope names.
 * @param {string[]} parameters Array of coordination types.
 * @returns {array} Returns a tuple [values, setters]
 * where values is an object containing all coordination values,
 * and setters is an object containing all coordination setter
 * functions for the values in `values`, named with a "set"
 * prefix.
 */
export function _useCoordination(coordinationScopes: Record<string, string | string[]>, parameters: string[]) {
  const setCoordinationValue = useCoordinationStore((state: any) => state.setCoordinationValue);

  const values = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    return fromEntries(parameters.map((parameter) => {
      if (coordinationSpace) {
        const parameterScope = getParameterScope(coordinationScopes, parameter);
        if (coordinationSpace && coordinationSpace[parameter] && !Array.isArray(parameterScope)) {
          const value = coordinationSpace[parameter][parameterScope];
          return [parameter, value];
        }
      }
      return [parameter, undefined];
    }));
  }, shallow);

  const setters = useMemo(() => fromEntries(parameters.map((parameter) => {
    const setterName = `set${capitalize(parameter)}`;
    const setterFunc = (value: any) => setCoordinationValue({
      parameter,
      coordinationScopes,
      value,
    });
    return [setterName, setterFunc];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [parameters, coordinationScopes]);

  return [values, setters];
}

export function useCoordination(viewUid: string, parameters: string[]) {
  const [coordinationScopes] = useViewMapping(viewUid);
  return _useCoordination(coordinationScopes, parameters);
}

export function _useCoordinationScopesAll(coordinationScopes: Record<string, string | string[]>, parameter: string) {
  return useMemo(() => {
    const scopes = coordinationScopes[parameter];
    return Array.isArray(scopes) ? scopes : [scopes];
  }, [parameter, coordinationScopes]);
}

export function useCoordinationScopesAll(viewUid: string, parameter: string) {
  const [coordinationScopes] = useViewMapping(viewUid);
  return _useCoordinationScopesAll(coordinationScopes, parameter);
}

export function _useCoordinationScopes(coordinationScopes: Record<string, string | string[]>, parameter: string) {
  const scopes = getParameterScope(coordinationScopes, parameter);

  // Return array of coordination scopes,
  // but filter out any whose value is null / falsey.
  const parameterSpace = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    return coordinationSpace?.[parameter];
  }, shallow);
  const nonNullScopes = useMemo(() => {
    // Convert a single scope to an array of scopes to be consistent.
    const scopesArr = Array.isArray(scopes) ? scopes : [scopes];
    return scopesArr.filter((scope) => {
      if (parameterSpace) {
        const value = parameterSpace[scope];
        return value !== null;
      }
      return false;
    });
  }, [parameter, coordinationScopes, scopes, parameterSpace]);
  return nonNullScopes;
}

export function useCoordinationScopes(viewUid: string, parameter: string) {
  const [coordinationScopes] = useViewMapping(viewUid);
  return _useCoordinationScopes(coordinationScopes, parameter);
}

export function _useCoordinationScopesL1All(
  coordinationScopes: Record<string, string | string[]>, coordinationScopesBy: Record<string, any>,
  byType: string, parameter: string,
) {
  return useMemo(() => {
    const scopes = getParameterScope(coordinationScopes, byType);
    if (scopes && coordinationScopesBy?.[byType]?.[parameter]) {
      const scopesArr = Array.isArray(scopes) ? scopes : [scopes];
      return [scopesArr, fromEntries(scopesArr.map((scope) => {
        const secondaryScopes = coordinationScopesBy[byType][parameter][scope];
        const secondaryScopesArr = Array.isArray(secondaryScopes)
          ? secondaryScopes
          : [secondaryScopes];
        return [scope, secondaryScopesArr];
      }))];
    }
    // Fallback from fine-grained to coarse-grained.
    if (scopes && !coordinationScopesBy?.[byType]?.[parameter] && coordinationScopes?.[parameter]) {
      const scopesArr = Array.isArray(scopes) ? scopes : [scopes];
      return [scopesArr, fromEntries(scopesArr.map((scope) => {
        const secondaryScopes = coordinationScopes?.[parameter];
        const secondaryScopesArr = Array.isArray(secondaryScopes)
          ? secondaryScopes
          : [secondaryScopes];
        return [scope, secondaryScopesArr];
      }))];
    }
    return [[], {}];
  }, [parameter, byType, coordinationScopes, coordinationScopesBy]);
}

export function useCoordinationScopesL1All(viewUid: string, byType: string, parameter: string) {
  const [coordinationScopes, coordinationScopesBy] = useViewMapping(viewUid);
  return _useCoordinationScopesL1All(coordinationScopes, coordinationScopesBy, byType, parameter);
}

export function _useCoordinationScopesL1(
  coordinationScopes: Record<string, string | string[]>, coordinationScopesBy: Record<string, any>,
  byType: string, parameter: string,
) {
  const scopes = getParameterScope(coordinationScopes, byType);

  const parameterSpace = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    return coordinationSpace?.[parameter];
  }, shallow);
  const byTypeSpace = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    return coordinationSpace?.[byType];
  }, shallow);

  return useMemo(() => {
    if (scopes && coordinationScopesBy?.[byType]?.[parameter]) {
      const scopesArr = Array.isArray(scopes) ? scopes : [scopes];
      const scopesNonNull = scopesArr.filter((scope) => {
        if (byTypeSpace) {
          const value = byTypeSpace[scope];
          return value !== null;
        }
        return false;
      });
      return [scopesNonNull, fromEntries(scopesNonNull.map((scope) => {
        const secondaryScopes = coordinationScopesBy[byType][parameter][scope];
        const secondaryScopesArr = Array.isArray(secondaryScopes)
          ? secondaryScopes
          : [secondaryScopes];
        const secondaryScopesNonNull = secondaryScopesArr.filter((innerScope) => {
          if (parameterSpace) {
            const value = parameterSpace[innerScope];
            return value !== null;
          }
          return false;
        });
        return [scope, secondaryScopesNonNull];
      }))];
    }
    // Fallback from fine-grained to coarse-grained.
    if (scopes && !coordinationScopesBy?.[byType]?.[parameter] && coordinationScopes?.[parameter]) {
      const scopesArr = Array.isArray(scopes) ? scopes : [scopes];
      const scopesNonNull = scopesArr.filter((scope) => {
        if (byTypeSpace) {
          const value = byTypeSpace[scope];
          return value !== null;
        }
        return false;
      });
      return [scopesNonNull, fromEntries(scopesNonNull.map((scope) => {
        const secondaryScopes = coordinationScopes?.[parameter];
        const secondaryScopesArr = Array.isArray(secondaryScopes)
          ? secondaryScopes
          : [secondaryScopes];
        const secondaryScopesNonNull = secondaryScopesArr.filter((innerScope) => {
          if (parameterSpace) {
            const value = parameterSpace[innerScope];
            return value !== null;
          }
          return false;
        });
        return [scope, secondaryScopesNonNull];
      }))];
    }
    return [[], {}];
  }, [parameter, byType, scopes, coordinationScopes, coordinationScopesBy, parameterSpace, byTypeSpace]);
}

export function useCoordinationScopesL1(viewUid: string, byType: string, parameter: string) {
  const [coordinationScopes, coordinationScopesBy] = useViewMapping(viewUid);
  return _useCoordinationScopesL1(coordinationScopes, coordinationScopesBy, byType, parameter);
}

export function _useCoordinationObject(coordinationScopes: Record<string, string | string[]>, parameter: string) {
  const scopes = getParameterScope(coordinationScopes, parameter);

  // Mapping from dataset coordination scope name to dataset uid
  const vals = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    // Convert a single scope to an array of scopes to be consistent.
    const scopesArr = Array.isArray(scopes) ? scopes : [scopes];
    return fromEntries(scopesArr.map((scope) => {
      if (coordinationSpace && coordinationSpace[parameter]) {
        const value = coordinationSpace[parameter][scope];
        return [scope, value] as [string, any];
      }
      return [scope, undefined] as [string, any];
      // eslint-disable-next-line no-unused-vars
    }).filter(([k, v]) => v !== undefined));
  }, shallow);

  return vals;
}

export function useCoordinationObject(viewUid: string, parameter: string) {
  const [coordinationScopes] = useViewMapping(viewUid);
  return _useCoordinationObject(coordinationScopes, parameter);
}

/**
 * Use coordination values and coordination setter functions corresponding to
 * {coordinationType}-specific coordination scopes for each coordination type.
 * @param {string[]} parameters An array of coordination types supported by a view.
 * @param {object} coordinationScopes The coordination scope mapping object for a view.
 * @param {object} coordinationScopesBy The per-coordinationType coordination scope
 * mapping object for a view.
 * @param {string} byType The {coordinationType} to use for per-{coordinationType} coordination
 * scope mappings.
 * @returns {array} [cValues, cSetters] where
 * cValues is a mapping from coordination scope name to { coordinationType: coordinationValue },
 * and cSetters is a mapping from coordination scope name to { setCoordinationType }
 * setter functions.
 */
export function _useCoordinationL1(
  coordinationScopes: Record<string, string | string[]>, coordinationScopesBy: Record<string, Record<string, any>>,
  byType: string, parameters: string[],
) {
  const setCoordinationValue = useCoordinationStore((state: any) => state.setCoordinationValue);

  const parameterSpaces = useCoordinationStore((state: any) => {
    const { coordinationSpace } = state.spec;
    return parameters.map(parameter => coordinationSpace[parameter]);
  }, shallow);

  const values = useMemo(() => {
    const typeScopes = getParameterScope(coordinationScopes, byType);
    if (typeScopes) {
      // Convert a single scope to an array of scopes to be consistent.
      const typeScopesArr = Array.isArray(typeScopes) ? typeScopes : [typeScopes];
      return fromEntries(typeScopesArr.map((datasetScope) => {
        const datasetValues = fromEntries(parameters.map((parameter, i) => {
          if (parameterSpaces[i]) {
            const parameterSpace = parameterSpaces[i];
            const parameterScope = getParameterScopeBy(
              coordinationScopes,
              coordinationScopesBy,
              byType,
              datasetScope,
              parameter,
            );
            if (parameterScope) {
              const value = parameterSpace[parameterScope];
              return [parameter, value];
            }
            // Fall back to global scope for this parameter.
            const globalParameterScope = getParameterScope(coordinationScopes, parameter);
            if(!Array.isArray(globalParameterScope)) {
              const globalValue = parameterSpace[globalParameterScope];
              return [parameter, globalValue];
            }
            return [parameter, undefined];
          }
          return [parameter, undefined];
        }));
        return [datasetScope, datasetValues];
      }));
    }
    return {};
  }, [byType, coordinationScopes, coordinationScopesBy, parameterSpaces]);

  const setters = useMemo(() => {
    const typeScopes = getParameterScope(coordinationScopes, byType);
    if (typeScopes) {
      // Convert a single scope to an array of scopes to be consistent.
      const typeScopesArr = Array.isArray(typeScopes) ? typeScopes : [typeScopes];
      return fromEntries(typeScopesArr.map((datasetScope) => {
        const datasetSetters = fromEntries(parameters.map((parameter) => {
          const setterName = `set${capitalize(parameter)}`;
          const setterFunc = (value: any) => setCoordinationValue({
            parameter,
            byType,
            typeScope: datasetScope,
            coordinationScopes,
            coordinationScopesBy,
            value,
          });
          return [setterName, setterFunc];
        }));
        return [datasetScope, datasetSetters];
      }));
    }
    return {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // parameters is assumed to be a constant array.
  }, [coordinationScopes]);

  return [values, setters];
}

export function useCoordinationL1(viewUid: string, byType: string, parameters: string[]) {
  const [coordinationScopes, coordinationScopesBy] = useViewMapping(viewUid);
  return _useCoordinationL1(coordinationScopes, coordinationScopesBy, byType, parameters);
}

/**
 * Use a second level of complex coordination.
 * @param {string[]} parameters Array of coordination types.
 * @param {object} coordinationScopesBy The coordinationScopesBy object from the view definition.
 * @param {string} primaryType The first-level coordination type, such as spatialImageLayer.
 * @param {string} secondaryType The second-level coordination type, such as spatialImageChannel.
 * @returns The results of useCoordinationL1.
 */
export function _useCoordinationL2(
  coordinationScopes: Record<string, string | string[]>, coordinationScopesBy: Record<string, any>,
  primaryType: string, secondaryType: string, parameters: string[], 
) {
  const coordinationScopesFake = useMemo(() => {
    if (coordinationScopesBy?.[primaryType]?.[secondaryType]) {
      return {
        ...coordinationScopes, // TODO: this is needed for falling back to view-level coordination scopes, but does it affect performance?
        [secondaryType]: Object.values(coordinationScopesBy[primaryType][secondaryType]).flat(),
      };
    }
    // First fallback: try coarser (_Channel -> _Layer -> view)
    // coordination values when finer ones are null/undefined.
    if (coordinationScopes?.[secondaryType] && Array.isArray(coordinationScopes[secondaryType])) {
      return {
        ...coordinationScopes, // TODO: this is needed for falling back to view-level coordination scopes, but does it affect performance?
        [secondaryType]: coordinationScopes[secondaryType],
      };
    }
    // Finally, fall back to empty array.
    return { [secondaryType]: [] };
  }, [coordinationScopesBy, primaryType, secondaryType]);
  const [flatValues, flatSetters] = _useCoordinationL1(
    coordinationScopesFake as Record<string, string | string[]>, coordinationScopesBy, secondaryType, parameters,
  );
  const nestedValues = useMemo(() => {
    // Re-nest
    const result: Record<string, any> = {};
    if (coordinationScopesBy?.[primaryType]?.[secondaryType]) {
      Object.entries(coordinationScopesBy[primaryType][secondaryType])
        .forEach(([layerScope, channelScopes]) => {
          result[layerScope] = {};
          if(Array.isArray(channelScopes)) {
            channelScopes.forEach((channelScope) => {
              result[layerScope][channelScope] = flatValues[channelScope];
            });
          } else {
            console.error("Expected channelScopes to be an array of strings.");
          }
        });
    } else if (coordinationScopes?.[secondaryType] && Array.isArray(coordinationScopes[secondaryType])) {
      // Re-nesting for fallback case.
      const layerScopes = coordinationScopes[primaryType];
      if(Array.isArray(layerScopes)) {
        layerScopes.forEach((layerScope) => {
          // eslint-disable-next-line prefer-destructuring
          result[layerScope] = flatValues;
        });
      } else {
        console.error("Expected layerScopes to be an array of strings.");
      }
    }
    return result;
  }, [flatValues]);
  const nestedSetters = useMemo(() => {
    // Re-nest
    const result: Record<string, any> = {};
    if (coordinationScopesBy?.[primaryType]?.[secondaryType]) {
      Object.entries(coordinationScopesBy[primaryType][secondaryType])
        .forEach(([layerScope, channelScopes]) => {
          result[layerScope] = {};
          if(Array.isArray(channelScopes)) {
            channelScopes.forEach((channelScope) => {
              result[layerScope][channelScope] = flatSetters[channelScope];
            });
          } else {
            console.error("Expected channelScopes to be an array of strings.");
          }
        });
    } else if (coordinationScopes?.[secondaryType] && Array.isArray(coordinationScopes[secondaryType])) {
      // Re-nesting for fallback case.
      const layerScopes = coordinationScopes[primaryType];
      if(Array.isArray(layerScopes)) {
        layerScopes.forEach((layerScope) => {
          // eslint-disable-next-line prefer-destructuring
          result[layerScope] = flatSetters;
        });
      } else {
        console.error("Expected layerScopes to be an array of strings.");
      }
    }
    return result;
  }, [flatSetters]);

  return [nestedValues, nestedSetters];
}

export function useCoordinationL2(viewUid: string, primaryType: string, secondaryType: string, parameters: string[]) {
  const [coordinationScopes, coordinationScopesBy] = useViewMapping(viewUid);
  return _useCoordinationL2(coordinationScopes, coordinationScopesBy, primaryType, secondaryType, parameters);
}

/**
 * Obtain the view config setter function from
 * the global app state.
 * @returns {function} The view config setter function
 * in the `useCoordinationStore` store.
 */
export function useSetSpec(storeApi: any) {
  const setSpecRef = useRef(storeApi.getState().setSpec);
  const setSpec = setSpecRef.current;
  return setSpec;
}

/**
 * Obtain the loaders setter function from
 * the global app state.
 * @returns {function} The loaders setter function
 * in the `useCoordinationStore` store.
 */
export function useMergeCoordination() {
  return useCoordinationStore((state: any) => state.mergeCoordination);
}
