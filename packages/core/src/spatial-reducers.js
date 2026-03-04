/* eslint-disable max-len */
import { getNextScope } from '@use-coordination/utils';

const CoordinationType = {};

/**
 * Get the name of the metaCoordinationScopes coordination scope
 * for a particular non-meta coordination scope, after accounting for
 * meta-coordination.
 * @param {*} metaSpace The metaCoordinationScopes object from the spec.
 * @param {*} viewMetaScopeNames The view-level metaCoordinationScopes (scope name or names).
 * @param {string} parameter The parameter for which to get the metaScope.
 * @returns {string|undefined} The metaCoordinationScopes coordination scope name.
 */
export function getMetaScope(metaSpace, viewMetaScopeNames, parameter) {
  let latestMetaScope;
  if (metaSpace && viewMetaScopeNames) {
    const metaScopesArr = Array.isArray(viewMetaScopeNames) ? viewMetaScopeNames : [viewMetaScopeNames];
    metaScopesArr.forEach((metaScope) => {
      if (metaSpace[metaScope]?.[parameter]) {
        latestMetaScope = metaScope;
      }
    });
  }
  return latestMetaScope;
}

/**
 * Get the name of the metaCoordinationScopesBy coordination scope
 * for a particular non-meta coordination scope, after accounting for
 * meta-coordination.
 * @param {*} metaSpaceBy The metaCoordinationScopesBy object from the spec.
 * @param {*} viewMetaScopeByNames The view-level metaCoordinationScopesBy (scope name or names).
 * @param {string} byParameter The byParameter for which to get the metaScope.
 * @param {string} parameter The parameter for which to get the metaScope.
 * @param {string} byScope The byScope for the byParameter in which to look for the metaScope.
 * @returns {string|undefined} The metaCoordinationScopesBy coordination scope name.
 */
export function getMetaScopeBy(metaSpaceBy, viewMetaScopeByNames, byParameter, parameter, byScope) {
  let latestMetaScope;
  if (metaSpaceBy && viewMetaScopeByNames) {
    const metaScopesArr = Array.isArray(viewMetaScopeByNames) ? viewMetaScopeByNames : [viewMetaScopeByNames];
    metaScopesArr.forEach((metaScope) => {
      if (metaSpaceBy[metaScope]?.[byParameter]?.[parameter]?.[byScope]) {
        latestMetaScope = metaScope;
      }
    });
  }
  return latestMetaScope;
}


export function removeImageChannelInMetaCoordinationScopesHelper(viewMetaScopes, viewMetaScopesBy, layerScope, channelScope, coordinationSpace, metaCoordinationScopes, metaCoordinationScopesBy) {
  let newMetaCoordinationScopes = metaCoordinationScopes;
  let newMetaCoordinationScopesBy = metaCoordinationScopesBy;

  // const layerMetaScope = getMetaScope(metaCoordinationScopes, viewMetaScopes, CoordinationType.IMAGE_LAYER);
  const channelMetaScopeBy = getMetaScopeBy(
    metaCoordinationScopesBy,
    viewMetaScopesBy,
    CoordinationType.IMAGE_LAYER,
    CoordinationType.IMAGE_CHANNEL,
    layerScope,
  );
  // Only used in fallback case.
  const channelMetaScope = getMetaScope(metaCoordinationScopes, viewMetaScopes, CoordinationType.IMAGE_CHANNEL);
  const hasPerLayerChannels = !!channelMetaScopeBy;

  const prevChannels = hasPerLayerChannels
    ? metaCoordinationScopesBy // Per-layer channels case.
      ?.[channelMetaScopeBy]
      ?.[CoordinationType.IMAGE_LAYER]
      ?.[CoordinationType.IMAGE_CHANNEL]
      ?.[layerScope]
    : metaCoordinationScopes // Fallback case.
      ?.[channelMetaScope]
      ?.[CoordinationType.IMAGE_CHANNEL];

  const nextChannels = prevChannels.filter(channel => channel !== channelScope);

  if (hasPerLayerChannels) {
    newMetaCoordinationScopesBy = {
      ...metaCoordinationScopesBy,
      [channelMetaScopeBy]: {
        ...metaCoordinationScopesBy?.[channelMetaScopeBy],
        [CoordinationType.IMAGE_LAYER]: {
          ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_LAYER],
          [CoordinationType.IMAGE_CHANNEL]: {
            ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_LAYER]?.[CoordinationType.IMAGE_CHANNEL],
            [layerScope]: nextChannels,
          },
        },
      },
    };
  } else {
    newMetaCoordinationScopes = {
      ...metaCoordinationScopes,
      [channelMetaScope]: {
        ...metaCoordinationScopes?.[channelMetaScope],
        [CoordinationType.IMAGE_CHANNEL]: nextChannels,
      },
    };
  }

  return {
    coordinationSpace,
    metaCoordinationScopes: newMetaCoordinationScopes,
    metaCoordinationScopesBy: newMetaCoordinationScopesBy,
  };
}

export function addImageChannelInMetaCoordinationScopesHelper(viewMetaScopes, viewMetaScopesBy, layerScope, coordinationSpace, metaCoordinationScopes, metaCoordinationScopesBy) {
  let newMetaCoordinationScopes = metaCoordinationScopes;
  let newMetaCoordinationScopesBy = metaCoordinationScopesBy;

  // const layerMetaScope = getMetaScope(metaCoordinationScopes, viewMetaScopes, CoordinationType.IMAGE_LAYER);
  const channelMetaScopeBy = getMetaScopeBy(
    metaCoordinationScopesBy,
    viewMetaScopesBy,
    CoordinationType.IMAGE_LAYER,
    CoordinationType.IMAGE_CHANNEL,
    layerScope,
  );

  // Only used in fallback case.
  const channelMetaScope = getMetaScope(metaCoordinationScopes, viewMetaScopes, CoordinationType.IMAGE_CHANNEL);
  const hasPerLayerChannels = !!channelMetaScopeBy;

  const prevChannels = hasPerLayerChannels
    ? metaCoordinationScopesBy // Per-layer channels case.
      ?.[channelMetaScopeBy]
      ?.[CoordinationType.IMAGE_LAYER]
      ?.[CoordinationType.IMAGE_CHANNEL]
      ?.[layerScope]
    : metaCoordinationScopes // Fallback case.
      ?.[channelMetaScope]
      ?.[CoordinationType.IMAGE_CHANNEL];

  const allPrevChannelScopes = Object.keys(coordinationSpace[CoordinationType.IMAGE_CHANNEL] || {});
  const nextChannelScope = getNextScope(allPrevChannelScopes);
  const nextChannels = [...prevChannels, nextChannelScope];

  // Create scope for new channel in coordination space (with dummy initial value). Also,
  // - Create scopes for channel's spatialTargetC, color, window, and opacity (with initial values).
  // - map channelScope to spatialTargetC, color, window, and opacity in metaCoordinationScopesBy.

  let newCoordinationSpace = coordinationSpace;

  const nextTargetCScope = getNextScope(Object.keys(coordinationSpace[CoordinationType.SPATIAL_TARGET_C] || {}));
  const nextColorScope = getNextScope(Object.keys(coordinationSpace[CoordinationType.SPATIAL_CHANNEL_COLOR] || {}));
  const nextWindowScope = getNextScope(Object.keys(coordinationSpace[CoordinationType.SPATIAL_CHANNEL_WINDOW] || {}));
  const nextVisibleScope = getNextScope(Object.keys(coordinationSpace[CoordinationType.SPATIAL_CHANNEL_VISIBLE] || {}));
  const nextOpacityScope = getNextScope(Object.keys(coordinationSpace[CoordinationType.SPATIAL_CHANNEL_OPACITY] || {}));

  newCoordinationSpace = {
    ...coordinationSpace,
    [CoordinationType.IMAGE_CHANNEL]: {
      ...coordinationSpace[CoordinationType.IMAGE_CHANNEL],
      [nextChannelScope]: '__dummy__',
    },
    [CoordinationType.SPATIAL_TARGET_C]: {
      ...coordinationSpace[CoordinationType.SPATIAL_TARGET_C],
      [nextTargetCScope]: 0, // TODO: Use the default values for each coordination type.
    },
    [CoordinationType.SPATIAL_CHANNEL_COLOR]: {
      ...coordinationSpace[CoordinationType.SPATIAL_CHANNEL_COLOR],
      [nextColorScope]: [255, 255, 255],
    },
    [CoordinationType.SPATIAL_CHANNEL_WINDOW]: {
      ...coordinationSpace[CoordinationType.SPATIAL_CHANNEL_WINDOW],
      [nextWindowScope]: [0, 255],
    },
    [CoordinationType.SPATIAL_CHANNEL_VISIBLE]: {
      ...coordinationSpace[CoordinationType.SPATIAL_CHANNEL_VISIBLE],
      [nextVisibleScope]: true,
    },
    [CoordinationType.SPATIAL_CHANNEL_OPACITY]: {
      ...coordinationSpace[CoordinationType.SPATIAL_CHANNEL_OPACITY],
      [nextOpacityScope]: 1,
    },
  };

  if (hasPerLayerChannels) {
    // Per-layer channels case.
    newMetaCoordinationScopesBy = {
      ...metaCoordinationScopesBy,
      [channelMetaScopeBy]: {
        ...metaCoordinationScopesBy?.[channelMetaScopeBy],
        [CoordinationType.IMAGE_LAYER]: {
          ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_LAYER],
          [CoordinationType.IMAGE_CHANNEL]: {
            ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_LAYER]?.[CoordinationType.IMAGE_CHANNEL],
            [layerScope]: nextChannels,
          },
        },
        [CoordinationType.IMAGE_CHANNEL]: {
          ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_CHANNEL],
          [CoordinationType.SPATIAL_TARGET_C]: {
            ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_TARGET_C],
            [nextChannelScope]: nextTargetCScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_COLOR]: {
            ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_COLOR],
            [nextChannelScope]: nextColorScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_WINDOW]: {
            ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_WINDOW],
            [nextChannelScope]: nextWindowScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_VISIBLE]: {
            ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_VISIBLE],
            [nextChannelScope]: nextVisibleScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_OPACITY]: {
            ...metaCoordinationScopesBy?.[channelMetaScopeBy]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_OPACITY],
            [nextChannelScope]: nextOpacityScope,
          },
        },
      },
    };
  } else {
    // Fallback case.
    newMetaCoordinationScopes = {
      ...metaCoordinationScopes,
      [channelMetaScope]: {
        ...metaCoordinationScopes?.[channelMetaScope],
        [CoordinationType.IMAGE_CHANNEL]: nextChannels,
      },
    };
    newMetaCoordinationScopesBy = {
      ...metaCoordinationScopesBy,
      [channelMetaScope]: {
        ...metaCoordinationScopesBy?.[channelMetaScope],
        [CoordinationType.IMAGE_CHANNEL]: {
          ...metaCoordinationScopesBy?.[channelMetaScope]?.[CoordinationType.IMAGE_CHANNEL],
          [CoordinationType.SPATIAL_TARGET_C]: {
            ...metaCoordinationScopesBy?.[channelMetaScope]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_TARGET_C],
            [nextChannelScope]: nextTargetCScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_COLOR]: {
            ...metaCoordinationScopesBy?.[channelMetaScope]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_COLOR],
            [nextChannelScope]: nextColorScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_WINDOW]: {
            ...metaCoordinationScopesBy?.[channelMetaScope]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_WINDOW],
            [nextChannelScope]: nextWindowScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_VISIBLE]: {
            ...metaCoordinationScopesBy?.[channelMetaScope]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_VISIBLE],
            [nextChannelScope]: nextVisibleScope,
          },
          [CoordinationType.SPATIAL_CHANNEL_OPACITY]: {
            ...metaCoordinationScopesBy?.[channelMetaScope]?.[CoordinationType.IMAGE_CHANNEL]?.[CoordinationType.SPATIAL_CHANNEL_OPACITY],
            [nextChannelScope]: nextOpacityScope,
          },
        },
      },
    };
  }

  return {
    coordinationSpace: newCoordinationSpace,
    metaCoordinationScopes: newMetaCoordinationScopes,
    metaCoordinationScopesBy: newMetaCoordinationScopesBy,
  };
}
