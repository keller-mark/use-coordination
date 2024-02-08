import { getNextScope } from '@use-coordination/utils';

export function connectViewToScope(config, viewUid, cType, cScope) {
  const newConfig = {
    ...config,
    viewCoordination: {
      ...config.viewCoordination,
      [viewUid]: {
        ...config.viewCoordination[viewUid],
        coordinationScopes: {
          ...config.viewCoordination[viewUid].coordinationScopes,
          [cType]: cScope,
        },
      },
    },
  };
  return newConfig;
}

export function disconnectViewFromScope(config, viewUid, cTypeOfScope) {
  const newConfig = {
    ...config,
    viewCoordination: {
      ...config.viewCoordination,
      [viewUid]: {
        ...config.viewCoordination[viewUid],
        coordinationScopes: Object.fromEntries(
          Object.entries(config.viewCoordination[viewUid].coordinationScopes)
            .filter(([cType, cScope]) => cType !== cTypeOfScope)
        ),
      },
    },
  };
  return newConfig;
}

export function addScopeForType(config, cType) {
  return {
    ...config,
    coordinationSpace: {
      ...config.coordinationSpace,
      [cType]: {
        ...config.coordinationSpace[cType],
        // TODO: use default value for the coordination type
        [getNextScope(Object.keys(config.coordinationSpace[cType]))]: null,
      },
    },
  };
}

export function addCoordinationType(config) {
  return {
    ...config,
    coordinationSpace: {
      ...config.coordinationSpace,
      [getNextScope(Object.keys(config.coordinationSpace))]: {},
    }
  };
}

export function addView(config) {
  return {
    ...config,
    viewCoordination: {
      ...config.viewCoordination,
      [getNextScope(Object.keys(config.viewCoordination))]: {},
    }
  };
}

export function removeCoordinationType(config, cTypeToRemove) {
  return {
    ...config,
    coordinationSpace: Object.fromEntries(
      Object.entries(config.coordinationSpace)
        .filter(([cType, cScope]) => (cType !== cTypeToRemove))
      // TODO: removal within meta-coordination scopes
    ),
    viewCoordination: Object.fromEntries(
      Object.entries(config.viewCoordination)
        .map(([viewUid, view]) => {
          return [viewUid, {
            ...view,
            coordinationScopes: Object.fromEntries(
              Object.entries(view.coordinationScopes)
                .filter(([cType, cScope]) => (cType !== cTypeToRemove))
            ),
            // TODO: coordinationScopesBy
          }];
        })
    ),
  };
}

export function removeView(config, viewUidToRemove) {
  return {
    ...config,
    viewCoordination: Object.fromEntries(
      Object.entries(config.viewCoordination)
        .filter(([viewUid]) => {
          return viewUid !== viewUidToRemove;
        })
    ),
  };
}

export function changeCoordinationTypeName(config, prevName, newName) {
  // TODO: First check if the new name is already in use, and if so throw an error.
  return {
    ...config,
    coordinationSpace: Object.fromEntries(
      Object.entries(config.coordinationSpace)
        .map(([cType, cScope]) => {
          if(cType === prevName) {
            return [newName, cScope];
          }
          return [cType, cScope];
        })
      // TODO: change name within meta-coordination scopes
    ),
    viewCoordination: Object.fromEntries(
      Object.entries(config.viewCoordination)
        .map(([viewUid, view]) => {
          return [viewUid, {
            ...view,
            coordinationScopes: Object.fromEntries(
              Object.entries(view.coordinationScopes)
                .map(([cType, cScope]) => {
                  if(cType === prevName) {
                    return [newName, cScope];
                  }
                  return [cType, cScope];
                })
            ),
            // TODO: coordinationScopesBy
          }];
        })
    ),
  };
}

export function changeCoordinationScopeName(config, cTypeForScope, prevName, newName) {
  // TODO: First check if the new name is already in use, and if so throw an error.
  return {
    ...config,
    coordinationSpace: Object.fromEntries(
      Object.entries(config.coordinationSpace)
        .map(([cType, cObj]) => {
          if(cType === cTypeForScope) {
            return [cType, Object.fromEntries(
              Object.entries(cObj)
                .map(([cScope, cValue]) => {
                  if(cScope === prevName) {
                    return [newName, cValue];
                  }
                  return [cScope, cValue];
                })
            )];
          }
          return [cType, cObj];
        })
      // TODO: change name within meta-coordination scopes
    ),
    viewCoordination: Object.fromEntries(
      Object.entries(config.viewCoordination)
        .map(([viewUid, view]) => {
          return [viewUid, {
            ...view,
            coordinationScopes: Object.fromEntries(
              Object.entries(view.coordinationScopes)
                .map(([cType, cScope]) => {
                  if(cType === cTypeForScope && cScope === prevName) {
                    return [cType, newName];
                  }
                  return [cType, cScope];
                })
            ),
            // TODO: coordinationScopesBy
          }];
        })
    ),
  };
}

export function changeCoordinationScopeValue(config, cTypeForValue, cScopeForValue, newValue) {
  return {
    ...config,
    coordinationSpace: {
      ...config.coordinationSpace,
      [cTypeForValue]: {
        ...config.coordinationSpace[cTypeForValue],
        [cScopeForValue]: newValue,
      },
    },
  };
}

export function changeViewUid(config, prevUid, newUid) {
  return {
    ...config,
    viewCoordination: Object.fromEntries(
      Object.entries(config.viewCoordination)
        .map(([viewUid, view]) => {
          if(viewUid === prevUid) {
            return [newUid, view];
          }
          return [viewUid, view];
        })
    ),
  };
}

export function removeCoordinationScope(config, cTypeForScope, cScopeToRemove) {
  return {
    ...config,
    coordinationSpace: Object.fromEntries(
      Object.entries(config.coordinationSpace)
        .map(([cType, cObj]) => {
          if(cType === cTypeForScope) {
            return [cType, Object.fromEntries(
              Object.entries(cObj)
                .filter(([cScope]) => cScope !== cScopeToRemove)
            )];
          }
          return [cType, cObj];
        }),
    ),
    viewCoordination: Object.fromEntries(
      Object.entries(config.viewCoordination)
        .map(([viewUid, view]) => {
          return [viewUid, {
            ...view,
            coordinationScopes: Object.fromEntries(
              Object.entries(view.coordinationScopes)
                .filter(([cType, cScope]) => {
                  if(cType === cTypeForScope && cScope === cScopeToRemove) {
                    return false;
                  }
                  return true;
                })
            ),
            // TODO: coordinationScopesBy
          }];
        }),
    ),
  };
}