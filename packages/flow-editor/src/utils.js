import { getNextScope } from '@use-coordination/utils';

export function connectViewToScope(spec, viewUid, cType, cScope) {
  const newSpec = {
    ...spec,
    viewCoordination: {
      ...spec.viewCoordination,
      [viewUid]: {
        ...spec.viewCoordination[viewUid],
        coordinationScopes: {
          ...spec.viewCoordination[viewUid].coordinationScopes,
          [cType]: cScope,
        },
      },
    },
  };
  return newSpec;
}

export function disconnectViewFromScope(spec, viewUid, cTypeOfScope) {
  const newSpec = {
    ...spec,
    viewCoordination: {
      ...spec.viewCoordination,
      [viewUid]: {
        ...spec.viewCoordination[viewUid],
        coordinationScopes: Object.fromEntries(
          Object.entries(spec.viewCoordination[viewUid].coordinationScopes)
            .filter(([cType, cScope]) => cType !== cTypeOfScope)
        ),
      },
    },
  };
  return newSpec;
}

export function addScopeForType(spec, cType) {
  return {
    ...spec,
    coordinationSpace: {
      ...spec.coordinationSpace,
      [cType]: {
        ...spec.coordinationSpace[cType],
        // TODO: use default value for the coordination type
        [getNextScope(Object.keys(spec.coordinationSpace[cType]))]: null,
      },
    },
  };
}

export function addCoordinationType(spec) {
  return {
    ...spec,
    coordinationSpace: {
      ...spec.coordinationSpace,
      [getNextScope(Object.keys(spec.coordinationSpace))]: {},
    }
  };
}

export function addView(spec) {
  return {
    ...spec,
    viewCoordination: {
      ...spec.viewCoordination,
      [getNextScope(Object.keys(spec.viewCoordination))]: {},
    }
  };
}

export function removeCoordinationType(spec, cTypeToRemove) {
  return {
    ...spec,
    coordinationSpace: Object.fromEntries(
      Object.entries(spec.coordinationSpace)
        .filter(([cType, cScope]) => (cType !== cTypeToRemove))
      // TODO: removal within meta-coordination scopes
    ),
    viewCoordination: Object.fromEntries(
      Object.entries(spec.viewCoordination)
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

export function removeView(spec, viewUidToRemove) {
  return {
    ...spec,
    viewCoordination: Object.fromEntries(
      Object.entries(spec.viewCoordination)
        .filter(([viewUid]) => {
          return viewUid !== viewUidToRemove;
        })
    ),
  };
}

export function changeCoordinationTypeName(spec, prevName, newName) {
  // TODO: First check if the new name is already in use, and if so throw an error.
  return {
    ...spec,
    coordinationSpace: Object.fromEntries(
      Object.entries(spec.coordinationSpace)
        .map(([cType, cScope]) => {
          if(cType === prevName) {
            return [newName, cScope];
          }
          return [cType, cScope];
        })
      // TODO: change name within meta-coordination scopes
    ),
    viewCoordination: Object.fromEntries(
      Object.entries(spec.viewCoordination)
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

export function changeCoordinationScopeName(spec, cTypeForScope, prevName, newName) {
  // TODO: First check if the new name is already in use, and if so throw an error.
  return {
    ...spec,
    coordinationSpace: Object.fromEntries(
      Object.entries(spec.coordinationSpace)
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
      Object.entries(spec.viewCoordination)
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

export function changeCoordinationScopeValue(spec, cTypeForValue, cScopeForValue, newValue) {
  return {
    ...spec,
    coordinationSpace: {
      ...spec.coordinationSpace,
      [cTypeForValue]: {
        ...spec.coordinationSpace[cTypeForValue],
        [cScopeForValue]: newValue,
      },
    },
  };
}

export function changeViewUid(spec, prevUid, newUid) {
  return {
    ...spec,
    viewCoordination: Object.fromEntries(
      Object.entries(spec.viewCoordination)
        .map(([viewUid, view]) => {
          if(viewUid === prevUid) {
            return [newUid, view];
          }
          return [viewUid, view];
        })
    ),
  };
}

export function removeCoordinationScope(spec, cTypeForScope, cScopeToRemove) {
  return {
    ...spec,
    coordinationSpace: Object.fromEntries(
      Object.entries(spec.coordinationSpace)
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
      Object.entries(spec.viewCoordination)
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