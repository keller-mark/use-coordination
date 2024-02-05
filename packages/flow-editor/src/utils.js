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