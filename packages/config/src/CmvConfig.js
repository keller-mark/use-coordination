/* eslint-disable react-hooks/rules-of-hooks */
import { META_COORDINATION_SCOPES, META_COORDINATION_SCOPES_BY } from '@use-coordination/constants-internal';
import { fromEntries, getNextScope, createPrefixedGetNextScopeNumeric } from '@use-coordination/utils';

function useCoordinationByObjectHelper(scopes, coordinationScopes, coordinationScopesBy) {
  // Set this.coordinationScopes and this.coordinationScopesBy by recursion on `scopes`.
  /*
    // Destructured, `scopes` might look like:
    const {
      [CoordinationType.SPATIAL_IMAGE_LAYER]: [
        {
          scope: imageLayerScope,
          children: {
            [CoordinationType.FILE_UID]: { scope: imageScope },
            [CoordinationType.SPATIAL_LAYER_VISIBLE]: { scope: imageVisibleScope },
            [CoordinationType.SPATIAL_LAYER_OPACITY]: { scope: imageOpacityScope },
            [CoordinationType.SPATIAL_IMAGE_CHANNEL]: [
              {
                scope: imageChannelScopeR,
                children: {
                  [CoordinationType.SPATIAL_TARGET_C]: { scope: rTargetScope },
                  [CoordinationType.SPATIAL_CHANNEL_COLOR]: { scope: rColorScope },
                },
              },
              {
                scope: imageChannelScopeG,
                children: {
                  [CoordinationType.SPATIAL_TARGET_C]: { scope: gTargetScope },
                  [CoordinationType.SPATIAL_CHANNEL_COLOR]: { scope: gColorScope },
                },
              },
            ],
          },
        },
      ],
      // ...
    } = scopes;

    // This would set the values to:
    this.coordinationScopes = {
      // Add the top-level coordination types to `coordinationScopes`.
      [CoordinationType.SPATIAL_IMAGE_LAYER]: [imageLayerScope.cScope],
    };
    this.coordinationScopesBy = {
      [CoordinationType.SPATIAL_IMAGE_LAYER]: {
        [CoordinationType.FILE_UID]: {
          [imageLayerScope.cScope]: imageScope.cScope,
        },
        [CoordinationType.SPATIAL_LAYER_VISIBLE]: {
          [imageLayerScope.cScope]: imageVisibleScope.cScope,
        },
        [CoordinationType.SPATIAL_LAYER_OPACITY]: {
          [imageLayerScope.cScope]: imageOpacityScope.cScope,
        },
        [CoordinationType.SPATIAL_IMAGE_CHANNEL]: {
          [imageLayerScope.cScope]: [imageChannelScopeR.cScope, imageChannelScopeG.cScope],
        },
      },
      [CoordinationType.SPATIAL_IMAGE_CHANNEL]: {
        [CoordinationType.SPATIAL_TARGET_C]: {
          [imageChannelScopeR.cScope]: rTargetScope.cScope,
          [imageChannelScopeG.cScope]: gTargetScope.cScope,
        },
        [CoordinationType.SPATIAL_CHANNEL_COLOR]: {
          [imageChannelScopeR.cScope]: rColorScope.cScope,
          [imageChannelScopeG.cScope]: gColorScope.cScope,
        },
      },
    };
   */

  // Recursive inner function.
  function processLevel(parentType, parentScope, levelType, levelVal) {
    if (Array.isArray(levelVal)) {
      // eslint-disable-next-line no-param-reassign
      coordinationScopesBy[parentType] = {
        ...(coordinationScopesBy[parentType] || {}),
        [levelType]: {
          ...(coordinationScopesBy[parentType]?.[levelType] || {}),
          [parentScope.cScope]: levelVal.map(childVal => childVal.scope.cScope),
        },
      };
      levelVal.forEach((childVal) => {
        if (childVal.children) {
          // Continue recursion.
          Object.entries(childVal.children)
            .forEach(([nextLevelType, nextLevelVal]) => processLevel(
              levelType, childVal.scope, nextLevelType, nextLevelVal,
            ));
        } // Else is the base case: no children
      });
    } else {
      // eslint-disable-next-line no-param-reassign
      coordinationScopesBy[parentType] = {
        ...(coordinationScopesBy[parentType] || {}),
        [levelType]: {
          ...(coordinationScopesBy[parentType]?.[levelType] || {}),
          [parentScope.cScope]: levelVal.scope.cScope,
        },
      };

      if (levelVal.children) {
        // Continue recursion.
        Object.entries(levelVal.children)
          .forEach(([nextLevelType, nextLevelVal]) => processLevel(
            levelType, levelVal.scope, nextLevelType, nextLevelVal,
          ));
      } // Else is the base case: no children
    }
  }

  Object.entries(scopes).forEach(([topLevelType, topLevelVal]) => {
    if (Array.isArray(topLevelVal)) {
      // eslint-disable-next-line no-param-reassign
      coordinationScopes[topLevelType] = topLevelVal.map(levelVal => levelVal.scope.cScope);

      topLevelVal.forEach((levelVal) => {
        if (levelVal.children) {
          // Begin recursion.
          Object.entries(levelVal.children)
            .forEach(([nextLevelType, nextLevelVal]) => processLevel(
              topLevelType, levelVal.scope, nextLevelType, nextLevelVal,
            ));
        }
      });
    } else {
      // eslint-disable-next-line no-param-reassign
      coordinationScopes[topLevelType] = topLevelVal.scope.cScope;
      if (topLevelVal.children) {
        // Begin recursion.
        Object.entries(topLevelVal.children)
          .forEach(([nextLevelType, nextLevelVal]) => processLevel(
            topLevelType, topLevelVal.scope, nextLevelType, nextLevelVal,
          ));
      }
    }
  });
  return [coordinationScopes, coordinationScopesBy];
}

/**
 * Class representing a view within a Vitessce layout.
 */
export class CmvConfigView {
  /**
   * Construct a new view instance.
   * @param {object} coordinationScopes A mapping from coordination type
   * names to coordination scope names.
   * @param {object} coordinationScopesBy A mapping from coordination type
   * names to coordination scope names, for multi-level coordination.
   */
  constructor(coordinationScopes, coordinationScopesBy) {
    this.view = {
      coordinationScopes,
      coordinationScopesBy,
    };
  }

  /**
   * Attach coordination scopes to this view.
   * @param  {CmvConfigCoordinationScope[]} cScopes A variable number of
   * coordination scope instances.
   * @returns {CmvConfigView} This, to allow chaining.
   */
  useCoordination(cScopes) {
    if (!this.view.coordinationScopes) {
      this.view.coordinationScopes = {};
    }
    cScopes.forEach((cScope) => {
      this.view.coordinationScopes[cScope.cType] = cScope.cScope;
    });
    return this;
  }

  /**
   * Attach potentially multi-level coordination scopes to this view.
   * @param {object} scopes A value returned by `CmvConfig.addCoordinationByObject`.
   * Not intended to be a manually-constructed object.
   * @returns {CmvConfigView} This, to allow chaining.
   */
  useCoordinationByObject(scopes) {
    if (!this.view.coordinationScopes) {
      this.view.coordinationScopes = {};
    }
    if (!this.view.coordinationScopesBy) {
      this.view.coordinationScopesBy = {};
    }
    const [nextCoordinationScopes, nextCoordinationScopesBy] = useCoordinationByObjectHelper(
      scopes,
      this.view.coordinationScopes,
      this.view.coordinationScopesBy,
    );
    this.view.coordinationScopes = nextCoordinationScopes;
    this.view.coordinationScopesBy = nextCoordinationScopesBy;
    return this;
  }

  /**
   * Attach meta coordination scopes to this view.
   * @param {CmvConfigMetaCoordinationScope} metaScope A meta coordination scope instance.
   * @returns {CmvConfigView} This, to allow chaining.
   */
  useMetaCoordination(metaScope) {
    if (!this.view.coordinationScopes) {
      this.view.coordinationScopes = {};
    }
    this.view.coordinationScopes[META_COORDINATION_SCOPES] = [
      ...(this.view.coordinationScopes[META_COORDINATION_SCOPES] || []),
      metaScope.metaScope.cScope,
    ];
    this.view.coordinationScopes[META_COORDINATION_SCOPES_BY] = [
      ...(this.view.coordinationScopes[META_COORDINATION_SCOPES_BY] || []),
      metaScope.metaByScope.cScope,
    ];
    return this;
  }


  /**
   * @returns {object} This view as a JSON object.
   */
  toJSON() {
    return this.view;
  }
}

// would import as CL for convenience
class CoordinationLevel {
  constructor(value) {
    this.value = value;
    this.cachedValue = null;
  }

  setCached(processedLevel) {
    this.cachedValue = processedLevel;
  }

  getCached() {
    return this.cachedValue;
  }

  isCached() {
    return this.cachedValue !== null;
  }
}

export function CL(value) {
  return new CoordinationLevel(value);
}

/**
 * Class representing a coordination scope in the coordination space.
 */
export class CmvConfigCoordinationScope {
  /**
   * Construct a new coordination scope instance.
   * @param {string} cType The coordination type for this coordination scope.
   * @param {string} cScope The name of the coordination scope.
   */
  constructor(cType, cScope, cValue = null) {
    this.cType = cType;
    this.cScope = cScope;
    this.cValue = cValue;
  }

  /**
   * Set the coordination value of the coordination scope.
   * @param {any} cValue The value to set.
   * @returns {CmvConfigCoordinationScope} This, to allow chaining.
   */
  setValue(cValue) {
    this.cValue = cValue;
    return this;
  }
}

/**
 * Class representing a pair of coordination scopes,
 * for metaCoordinationScopes and metaCoordinationScopesBy,
 * respectively, in the coordination space.
 */
export class CmvConfigMetaCoordinationScope {
  /**
   * Construct a new coordination scope instance.
   * @param {string} metaScope The name of the coordination scope for metaCoordinationScopes.
   * @param {string} metaByScope The name of the coordination scope for metaCoordinationScopesBy.
   */
  constructor(metaScope, metaByScope) {
    this.metaScope = new CmvConfigCoordinationScope(
      META_COORDINATION_SCOPES,
      metaScope,
    );
    this.metaByScope = new CmvConfigCoordinationScope(
      META_COORDINATION_SCOPES_BY,
      metaByScope,
    );
  }

  /**
   * Attach coordination scopes to this meta scope.
   * @param  {CmvConfigCoordinationScope[]} cScopes A variable number of
   * coordination scope instances.
   * @returns {CmvConfigMetaCoordinationScope} This, to allow chaining.
   */
  useCoordination(cScopes) {
    const metaScopesVal = this.metaScope.cValue;
    cScopes.forEach((cScope) => {
      metaScopesVal[cScope.cType] = cScope.cScope;
    });
    this.metaScope.setValue(metaScopesVal);
    return this;
  }

  /**
   * Attach potentially multi-level coordination scopes to this meta coordination
   * scope instance.
   * @param {object} scopes A value returned by `CmvConfig.addCoordinationByObject`.
   * Not intended to be a manually-constructed object.
   * @returns {CmvConfigView} This, to allow chaining.
   */
  useCoordinationByObject(scopes) {
    if (!this.metaScope.cValue) {
      this.metaScope.setValue({});
    }
    if (!this.metaByScope.cValue) {
      this.metaByScope.setValue({});
    }
    const [metaScopesVal, metaByScopesVal] = useCoordinationByObjectHelper(
      scopes,
      this.metaScope.cValue,
      this.metaByScope.cValue,
    );
    this.metaScope.setValue(metaScopesVal);
    this.metaByScope.setValue(metaByScopesVal);
    return this;
  }
}

/**
 * Class representing a Vitessce view config.
 */
export class CmvConfig {
  /**
   * Construct a new view config instance.
   * @param {object} params An object with named arguments.
   * @param {string} params.schemaVersion The view config schema version. Required.
   * @param {string} params.name A name for the config. Optional.
   * @param {string|undefined} params.description A description for the config. Optional.
   */
  constructor(key) {
    this.config = {
      key,
      coordinationSpace: {},
      viewCoordination: {},
    };
    this.getNextScope = getNextScope;
  }

  /**
   * Add a new view to the config.
   * @param {CmvConfigDataset} dataset The dataset instance which defines the data
   * that will be displayed in the view.
   * @param {string} component A component name, such as "scatterplot" or "spatial".
   * @param {object} options Extra options for the component.
   * @param {number} options.x The x-coordinate for the view in the grid layout.
   * @param {number} options.y The y-coordinate for the view in the grid layout.
   * @param {number} options.w The width for the view in the grid layout.
   * @param {number} options.h The height for the view in the grid layout.
   * @param {number} options.mapping A convenience parameter for setting the EMBEDDING_TYPE
   * coordination value. Only applicable if the component is "scatterplot".
   * @returns {CmvConfigView} A new view instance.
   */
  addView(viewUid) {
    const newView = new CmvConfigView(undefined, undefined);
    this.config.viewCoordination[viewUid] = newView;
    return newView;
  }

  /**
   * Get an array of new coordination scope instances corresponding to coordination types
   * of interest.
   * @param {string[]} cTypes A variable number of coordination type names.
   * @returns {CmvConfigCoordinationScope[]} An array of coordination scope instances.
   */
  addCoordination(cTypes) {
    const result = [];
    cTypes.forEach((cType) => {
      const prevScopes = (
        this.config.coordinationSpace[cType]
          ? Object.keys(this.config.coordinationSpace[cType])
          : []
      );
      const scope = new CmvConfigCoordinationScope(cType, this.getNextScope(prevScopes));
      if (!this.config.coordinationSpace[scope.cType]) {
        this.config.coordinationSpace[scope.cType] = {};
      }
      this.config.coordinationSpace[scope.cType][scope.cScope] = scope;
      result.push(scope);
    });
    return result;
  }

  /**
   * Initialize a new meta coordination scope in the coordination space,
   * and get a reference to it in the form of a meta coordination scope instance.
   * @returns {CmvConfigMetaCoordinationScope} A new meta coordination scope instance.
   */
  addMetaCoordination() {
    const prevMetaScopes = (
      this.config.coordinationSpace[META_COORDINATION_SCOPES]
        ? Object.keys(this.config.coordinationSpace[META_COORDINATION_SCOPES])
        : []
    );
    const prevMetaByScopes = (
      this.config.coordinationSpace[META_COORDINATION_SCOPES_BY]
        ? Object.keys(this.config.coordinationSpace[META_COORDINATION_SCOPES_BY])
        : []
    );
    const metaContainer = new CmvConfigMetaCoordinationScope(
      this.getNextScope(prevMetaScopes),
      this.getNextScope(prevMetaByScopes),
    );
    if (!this.config.coordinationSpace[META_COORDINATION_SCOPES]) {
      this.config.coordinationSpace[META_COORDINATION_SCOPES] = {};
    }
    if (!this.config.coordinationSpace[META_COORDINATION_SCOPES_BY]) {
      this.config.coordinationSpace[META_COORDINATION_SCOPES_BY] = {};
    }
    // eslint-disable-next-line max-len
    this.config.coordinationSpace[META_COORDINATION_SCOPES][metaContainer.metaScope.cScope] = metaContainer.metaScope;
    // eslint-disable-next-line max-len
    this.config.coordinationSpace[META_COORDINATION_SCOPES_BY][metaContainer.metaByScope.cScope] = metaContainer.metaByScope;
    return metaContainer;
  }

  /**
   * Set up the initial values for multi-level coordination in the coordination space.
   * Get a reference to these values to pass to the `useCoordinationByObject` method
   * of either view or meta coordination scope instances.
   * @param {object} input A (potentially nested) object with coordination types as keys
   * and values being either the initial coordination value, a `CmvConfigCoordinationScope`
   * instance, or a `CoordinationLevel` instance.
   * The CL function takes an array of objects as its argument, and returns a CoordinationLevel
   * instance, to support nesting.
   * @returns {object} A (potentially nested) object with coordination types as keys and values
   * being either { scope }, { scope, children }, or an array of these. Not intended to be
   * manipulated before being passed to a `useCoordinationByObject` function.
   */
  addCoordinationByObject(input) {
    /*
      // The value for `input` might look like:
      {
        [CoordinationType.SPATIAL_IMAGE_LAYER]: CL([
          {
            [CoordinationType.FILE_UID]: 'S-1905-017737_bf',
            [CoordinationType.SPATIAL_LAYER_VISIBLE]: true,
            [CoordinationType.SPATIAL_LAYER_OPACITY]: 1,
            [CoordinationType.SPATIAL_IMAGE_CHANNEL]: CL([
              {
                [CoordinationType.SPATIAL_TARGET_C]: 0,
                [CoordinationType.SPATIAL_CHANNEL_COLOR]: [255, 0, 0],
              },
              {
                [CoordinationType.SPATIAL_TARGET_C]: 1,
                [CoordinationType.SPATIAL_CHANNEL_COLOR]: [0, 255, 0],
              },
            ]),
          },
        ]),
        [CoordinationType.SPATIAL_SEGMENTATION_LAYER]: CL([
          {
            [CoordinationType.FILE_UID]: 'S-1905-017737',
            [CoordinationType.SPATIAL_LAYER_VISIBLE]: true,
            [CoordinationType.SPATIAL_LAYER_OPACITY]: 1,
            [CoordinationType.SPATIAL_SEGMENTATION_CHANNEL]: CL([
              {
                [CoordinationType.OBS_TYPE]: 'Cortical Interstitia',
                [CoordinationType.SPATIAL_TARGET_C]: 0,
                [CoordinationType.SPATIAL_CHANNEL_COLOR]: [255, 0, 0],
              },
              {
                [CoordinationType.OBS_TYPE]: 'Non-Globally Sclerotic Glomeruli',
                [CoordinationType.SPATIAL_TARGET_C]: 1,
                [CoordinationType.SPATIAL_CHANNEL_COLOR]: [255, 0, 0],
              },
              {
                [CoordinationType.OBS_TYPE]: 'Globally Sclerotic Glomeruli',
                [CoordinationType.SPATIAL_TARGET_C]: 2,
                [CoordinationType.SPATIAL_CHANNEL_COLOR]: [255, 0, 0],
              },
            ]),
          },
        ]),
      }
      // Which would correspond to this `output`,
      // a valid input for `CmvConfigMetaCoordinationScope.useCoordinationByObject()`:
      {
        [CoordinationType.SPATIAL_IMAGE_LAYER]: [
          {
            scope: imageLayerScope,
            children: {
              [CoordinationType.FILE_UID]: { scope: imageScope },
              [CoordinationType.SPATIAL_LAYER_VISIBLE]: { scope: imageVisibleScope },
              [CoordinationType.SPATIAL_LAYER_OPACITY]: { scope: imageOpacityScope },
              [CoordinationType.SPATIAL_IMAGE_CHANNEL]: [
                {
                  scope: imageChannelScopeR,
                  children: {
                    [CoordinationType.SPATIAL_TARGET_C]: { scope: rTargetScope },
                    [CoordinationType.SPATIAL_CHANNEL_COLOR]: { scope: rColorScope },
                  },
                },
                {
                  scope: imageChannelScopeG,
                  children: {
                    [CoordinationType.SPATIAL_TARGET_C]: { scope: gTargetScope },
                    [CoordinationType.SPATIAL_CHANNEL_COLOR]: { scope: gColorScope },
                  },
                },
              ],
            },
          },
        ],
        // ...
      }
    */
    const processLevel = (level) => {
      const result = {};
      if (level === null) {
        return result;
      }
      Object.entries(level).forEach(([cType, nextLevelOrInitialValue]) => {
        // Check if value of object is instanceof CoordinationLevel
        // (otherwise assume it is the coordination value).
        if (nextLevelOrInitialValue instanceof CoordinationLevel) {
          const nextLevel = nextLevelOrInitialValue.value;
          if (nextLevelOrInitialValue.isCached()) {
            result[cType] = nextLevelOrInitialValue.getCached();
          } else if (Array.isArray(nextLevel)) {
            const processedLevel = nextLevel.map((nextEl) => {
              const [dummyScope] = this.addCoordination([cType]);
              // TODO: set a better initial value for dummy cases.
              dummyScope.setValue('__dummy__');
              return {
                scope: dummyScope,
                children: processLevel(nextEl),
              };
            });
            nextLevelOrInitialValue.setCached(processedLevel);
            result[cType] = processedLevel;
          } else {
            const nextEl = nextLevel;
            const [dummyScope] = this.addCoordination([cType]);
            // TODO: set a better initial value for dummy cases.
            dummyScope.setValue('__dummy__');
            const processedLevel = {
              scope: dummyScope,
              children: processLevel(nextEl),
            };
            nextLevelOrInitialValue.setCached(processedLevel);
            result[cType] = processedLevel;
          }
        } else {
          // Base case.
          const initialValue = nextLevelOrInitialValue;
          if (initialValue instanceof CmvConfigCoordinationScope) {
            result[cType] = { scope: initialValue };
          } else {
            const [scope] = this.addCoordination([cType]);
            scope.setValue(initialValue);
            result[cType] = { scope };
          }
        }
      });
      return result;
    };
    // Begin recursion.
    const output = processLevel(input);
    return output;
  }

  /**
   * A convenience function for setting up new coordination scopes across a set of views.
   * @param {CmvConfigView[]} views An array of view objects to link together.
   * @param {string[]} cTypes The coordination types on which to coordinate the views.
   * @param {any[]} cValues Initial values corresponding to each coordination type.
   * Should have the same length as the cTypes array. Optional.
   * @returns {CmvConfig} This, to allow chaining.
   */
  linkViews(views, cTypes, cValues = null) {
    const cScopes = this.addCoordination(cTypes);
    views.forEach((view) => {
      cScopes.forEach((cScope) => {
        view.useCoordination([cScope]);
      });
    });
    if (Array.isArray(cValues) && cValues.length === cTypes.length) {
      cScopes.forEach((cScope, i) => {
        cScope.setValue(cValues[i]);
      });
    }
    return this;
  }

  /**
   * A convenience function for setting up multi-level and meta-coordination scopes
   * across a set of views.
   * @param {CmvConfigView[]} views An array of view objects to link together.
   * @param {object} input A (potentially nested) object with coordination types as keys
   * and values being either the initial coordination value, a `CmvConfigCoordinationScope`
   * instance, or a `CoordinationLevel` instance.
   * The CL function takes an array of objects as its argument, and returns a CoordinationLevel
   * instance, to support nesting.
   * @param {object|null} options
   * @param {bool} options.meta Should meta-coordination be used? Optional.
   * By default, true.
   * @param {string|null} options.scopePrefix A prefix to add to all
   * coordination scope names. Optional.
   * @returns {CmvConfig} This, to allow chaining.
   */
  linkViewsByObject(views, input, options = null) {
    const { meta = true, scopePrefix = null } = options || {};

    if (scopePrefix) {
      this.getNextScope = createPrefixedGetNextScopeNumeric(scopePrefix);
    }
    const scopes = this.addCoordinationByObject(input);
    if (meta) {
      const metaScope = this.addMetaCoordination();
      metaScope.useCoordinationByObject(scopes);

      views.forEach((view) => {
        view.useMetaCoordination(metaScope);
      });
    } else {
      views.forEach((view) => {
        view.useCoordinationByObject(scopes);
      });
    }
    if (scopePrefix) {
      this.getNextScope = getNextScope;
    }
    return this;
  }

  /**
   * Set the value for a coordination scope.
   * If a coordination object for the coordination type does not yet exist
   * in the coordination space, it will be created.
   * @param {string} cType The coordination type.
   * @param {string} cScope The coordination scope.
   * @param {any} cValue The initial value for the coordination scope.
   * @returns {CmvConfigCoordinationScope} A coordination scope instance.
   */
  setCoordinationValue(cType, cScope, cValue) {
    const scope = new CmvConfigCoordinationScope(cType, cScope, cValue);
    if (!this.config.coordinationSpace[scope.cType]) {
      this.config.coordinationSpace[scope.cType] = {};
    }
    this.config.coordinationSpace[scope.cType][scope.cScope] = scope;
    return scope;
  }

  /**
   * Convert this instance to a JSON object that can be passed to the Vitessce component.
   * @returns {object} The view config as a JSON object.
   */
  toJSON() {
    return {
      ...this.config,
      coordinationSpace: fromEntries(
        Object.entries(this.config.coordinationSpace).map(([cType, cScopes]) => ([
          cType,
          fromEntries(
            Object.entries(cScopes).map(([cScopeName, cScope]) => ([
              cScopeName,
              cScope.cValue,
            ])),
          ),
        ])),
      ),
      viewCoordination: fromEntries(
        Object.entries(this.config.viewCoordination).map(([viewUid, viewObj]) => ([
          viewUid,
          viewObj.toJSON(),
        ])),
      ),
    };
  }

  /**
   * Create a CmvConfig instance from an existing view config, to enable
   * manipulation with the JavaScript API.
   * @param {object} config An existing Vitessce view config as a JSON object.
   * @returns {CmvConfig} A new config instance, with values set to match
   * the config parameter.
   */
  static fromJSON(config) {
    const { key } = config;
    const vc = new CmvConfig(key);
    Object.keys(config.coordinationSpace).forEach((cType) => {
      const cObj = config.coordinationSpace[cType];
      vc.config.coordinationSpace[cType] = {};
      Object.entries(cObj).forEach(([cScopeName, cScopeValue]) => {
        const scope = new CmvConfigCoordinationScope(cType, cScopeName);
        scope.setValue(cScopeValue);
        vc.config.coordinationSpace[cType][cScopeName] = scope;
      });
    });
    Object.keys(config.viewCoordination).forEach((viewUid) => {
      const viewObj = config.viewCoordination[viewUid];
      const newView = new CmvConfigView(viewObj.coordinationScopes, viewObj.coordinationScopesBy);
      vc.config.viewCoordination[viewUid] = newView;
    });
    return vc;
  }
}

// For usage during auto-initialization.
export function getCoordinationSpaceAndScopes(partialCoordinationValues, scopePrefix) {
  const vc = new CmvConfig('__dummy__');
  vc.getNextScope = createPrefixedGetNextScopeNumeric(scopePrefix);
  const v1 = vc.addView('__dummy__');
  vc.linkViewsByObject([v1], partialCoordinationValues, { meta: true });
  const vcJson = vc.toJSON();
  // TODO: remove the "dataset" coordination type from these objects.
  const { coordinationSpace } = vcJson;
  const { coordinationScopes } = vcJson.layout[0];
  const { coordinationScopesBy } = vcJson.layout[0];

  return {
    coordinationSpace,
    coordinationScopes,
    coordinationScopesBy,
  };
}
