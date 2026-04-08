/* eslint-disable react-hooks/rules-of-hooks */
import { z } from 'zod';
import type { CoordinationSpace, CoordinationScopesMapping, CoordinationScopesByMapping } from '@use-coordination/types';
import { META_COORDINATION_SCOPES, META_COORDINATION_SCOPES_BY } from '@use-coordination/constants-internal';
import { getNextScope, createPrefixedGetNextScopeNumeric } from '@use-coordination/utils';

type CoordinationScopeName = string;
type CoordinationType = string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoordinationValue = any;

interface ViewJson {
  coordinationScopes?: CoordinationScopesMapping<CoordinationSpace>;
  coordinationScopesBy?: CoordinationScopesByMapping<CoordinationSpace>;
  metaCoordinationScopes?: CoordinationScopeName[];
  metaCoordinationScopesBy?: CoordinationScopeName[];
}

interface MetaCoordinationJson {
  coordinationScopes?: Record<CoordinationScopeName, CoordinationScopesMapping<CoordinationSpace>>;
  coordinationScopesBy?: Record<CoordinationScopeName, CoordinationScopesByMapping<CoordinationSpace>>;
}

export interface CmvConfigJson {
  key: string | number | undefined;
  coordinationSpace: Record<CoordinationType, Record<CoordinationScopeName, CoordinationValue>>;
  viewCoordination: Record<string, ViewJson>;
  metaCoordination?: MetaCoordinationJson;
}

interface ScopeWithChildren {
  scope: CmvConfigCoordinationScope;
  children?: ProcessedLevel;
}
type ProcessedLevelValue = ScopeWithChildren | ScopeWithChildren[];
type ProcessedLevel = Record<CoordinationType, ProcessedLevelValue>;

// Phantom brand that carries CT through the addCoordinationByObject → useCoordinationByObject pipeline.
type ProcessedLevelOf<CT extends Record<string, z.ZodTypeAny>> = ProcessedLevel & { readonly __ct?: CT };

type CoordinationInput = Record<
  CoordinationType,
  CoordinationLevel | CmvConfigCoordinationScope | CoordinationValue
>;

type CoordinationInputOf<CT extends Record<string, z.ZodTypeAny>> = {
  [K in Extract<keyof CT, string>]?: CoordinationLevel | CmvConfigCoordinationScope | z.infer<CT[K]>;
};

type GetNextScopeFn = (prevScopes: string[]) => string;

interface CmvConfigData<CT extends Record<string, z.ZodTypeAny>> {
  key: string | number | undefined;
  coordinationSpace: Record<CoordinationType, Record<CoordinationScopeName, CmvConfigCoordinationScope>>;
  metaCoordination: {
    coordinationScopes: Record<CoordinationScopeName, CmvConfigCoordinationScope>;
    coordinationScopesBy: Record<CoordinationScopeName, CmvConfigCoordinationScope>;
  };
  viewCoordination: Record<string, CmvConfigView<CT>>;
}

interface CmvConfigSpec {
  key?: string | number;
  coordinationSpace?: Record<CoordinationType, Record<CoordinationScopeName, CoordinationValue>>;
  metaCoordination?: {
    coordinationScopes?: Record<CoordinationScopeName, CoordinationValue>;
    coordinationScopesBy?: Record<CoordinationScopeName, CoordinationValue>;
  };
  viewCoordination?: Record<string, ViewJson>;
}

interface LinkViewsByObjectOptions {
  meta?: boolean;
  scopePrefix?: string | null;
}

function useCoordinationByObjectHelper(
  scopes: ProcessedLevel,
  coordinationScopes: CoordinationScopesMapping<CoordinationSpace>,
  coordinationScopesBy: CoordinationScopesByMapping<CoordinationSpace>,
): [CoordinationScopesMapping<CoordinationSpace>, CoordinationScopesByMapping<CoordinationSpace>] {
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
  function processLevel(
    parentType: CoordinationType,
    parentScope: CmvConfigCoordinationScope,
    levelType: CoordinationType,
    levelVal: ProcessedLevelValue,
  ): void {
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
 * Class representing a view.
 */
export class CmvConfigView<CT extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>> {
  view: ViewJson;

  /**
   * Construct a new view instance.
   * @param {object} coordinationScopes A mapping from coordination type
   * names to coordination scope names.
   * @param {object} coordinationScopesBy A mapping from coordination type
   * names to coordination scope names, for multi-level coordination.
   */
  constructor(
    coordinationScopes: CoordinationScopesMapping<CoordinationSpace> | undefined,
    coordinationScopesBy: CoordinationScopesByMapping<CoordinationSpace> | undefined,
    metaCoordinationScopes?: CoordinationScopeName[],
    metaCoordinationScopesBy?: CoordinationScopeName[],
  ) {
    this.view = {
      coordinationScopes,
      coordinationScopesBy,
      metaCoordinationScopes,
      metaCoordinationScopesBy,
    };
  }

  /**
   * Attach coordination scopes to this view.
   * @param  {CmvConfigCoordinationScope[]} cScopes A variable number of
   * coordination scope instances.
   * @returns {CmvConfigView} This, to allow chaining.
   */
  useCoordination(cScopes: CmvConfigCoordinationScope[]): this {
    if (!this.view.coordinationScopes) {
      this.view.coordinationScopes = {};
    }
    cScopes.forEach((cScope) => {
      this.view.coordinationScopes![cScope.cType] = cScope.cScope;
    });
    return this;
  }

  /**
   * Attach potentially multi-level coordination scopes to this view.
   * @param {object} scopes A value returned by `CmvConfig.addCoordinationByObject`.
   * Not intended to be a manually-constructed object.
   * @returns {CmvConfigView} This, to allow chaining.
   */
  useCoordinationByObject(scopes: ProcessedLevelOf<CT>): this {
    if (!this.view.coordinationScopes) {
      this.view.coordinationScopes = {};
    }
    if (!this.view.coordinationScopesBy) {
      this.view.coordinationScopesBy = {};
    }
    const [nextCoordinationScopes, nextCoordinationScopesBy] = useCoordinationByObjectHelper(
      scopes as ProcessedLevel,
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
  useMetaCoordination(metaScope: CmvConfigMetaCoordinationScope<CT>): this {
    this.view.metaCoordinationScopes = [
      ...(this.view.metaCoordinationScopes || []),
      metaScope.metaScope.cScope,
    ];
    this.view.metaCoordinationScopesBy = [
      ...(this.view.metaCoordinationScopesBy || []),
      metaScope.metaByScope.cScope,
    ];
    return this;
  }


  /**
   * @returns {object} This view as a JSON object.
   */
  toJSON(): ViewJson {
    return this.view;
  }
}

// would import as CL for convenience
class CoordinationLevel {
  value: CoordinationInput | CoordinationInput[];
  cachedValue: ProcessedLevelValue | null;

  constructor(value: CoordinationInput | CoordinationInput[]) {
    this.value = value;
    this.cachedValue = null;
  }

  setCached(processedLevel: ProcessedLevelValue): void {
    this.cachedValue = processedLevel;
  }

  getCached(): ProcessedLevelValue | null {
    return this.cachedValue;
  }

  isCached(): boolean {
    return this.cachedValue !== null;
  }
}

export function CL(value: CoordinationInput | CoordinationInput[]): CoordinationLevel {
  return new CoordinationLevel(value);
}

/**
 * Class representing a coordination scope in the coordination space.
 */
export class CmvConfigCoordinationScope<V = CoordinationValue> {
  cType: CoordinationType;
  cScope: CoordinationScopeName;
  cValue: V | null;

  /**
   * Construct a new coordination scope instance.
   * @param {string} cType The coordination type for this coordination scope.
   * @param {string} cScope The name of the coordination scope.
   */
  constructor(cType: CoordinationType, cScope: CoordinationScopeName, cValue: V | null = null) {
    this.cType = cType;
    this.cScope = cScope;
    this.cValue = cValue;
  }

  /**
   * Set the coordination value of the coordination scope.
   * @param {V} cValue The value to set.
   * @returns {CmvConfigCoordinationScope} This, to allow chaining.
   */
  setValue(cValue: V): this {
    this.cValue = cValue;
    return this;
  }
}

/**
 * Class representing a pair of coordination scopes,
 * for metaCoordinationScopes and metaCoordinationScopesBy,
 * respectively, in the coordination space.
 */
export class CmvConfigMetaCoordinationScope<CT extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>> {
  metaScope: CmvConfigCoordinationScope;
  metaByScope: CmvConfigCoordinationScope;

  /**
   * Construct a new coordination scope instance.
   * @param {string} metaScope The name of the coordination scope for metaCoordinationScopes.
   * @param {string} metaByScope The name of the coordination scope for metaCoordinationScopesBy.
   */
  constructor(metaScope: CoordinationScopeName, metaByScope: CoordinationScopeName) {
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
  useCoordination(cScopes: CmvConfigCoordinationScope[]): this {
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
   * @returns {CmvConfigMetaCoordinationScope} This, to allow chaining.
   */
  useCoordinationByObject(scopes: ProcessedLevelOf<CT>): this {
    if (!this.metaScope.cValue) {
      this.metaScope.setValue({});
    }
    if (!this.metaByScope.cValue) {
      this.metaByScope.setValue({});
    }
    const [metaScopesVal, metaByScopesVal] = useCoordinationByObjectHelper(
      scopes as ProcessedLevel,
      this.metaScope.cValue,
      this.metaByScope.cValue,
    );
    this.metaScope.setValue(metaScopesVal);
    this.metaByScope.setValue(metaByScopesVal);
    return this;
  }
}

/**
 * Class representing a coordination spec.
 */
export class CmvConfig<CT extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>> {
  config: CmvConfigData<CT>;
  getNextScope: GetNextScopeFn;

  /**
   * Construct a new spec instance.
   * @param {object} params An object with named arguments.
   * @param {string|number|undefined} params.key The spec key.
   */
  constructor(key: string | number | undefined) {
    this.config = {
      key,
      coordinationSpace: {},
      metaCoordination: {
        coordinationScopes: {},
        coordinationScopesBy: {},
      },
      viewCoordination: {},
    };
    this.getNextScope = getNextScope;
  }

  /**
   * Add a new view to the spec.
   * @param {string} viewUid The unique identifier for the view.
   * @returns {CmvConfigView} A new view instance.
   */
  addView(viewUid: string): CmvConfigView<CT> {
    const newView = new CmvConfigView<CT>(undefined, undefined);
    this.config.viewCoordination[viewUid] = newView;
    return newView;
  }

  /**
   * Get an array of new coordination scope instances corresponding to coordination types
   * of interest.
   * @param {string[]} cTypes A variable number of coordination type names.
   * @returns {CmvConfigCoordinationScope[]} An array of coordination scope instances.
   */
  addCoordination<const K extends Extract<keyof CT, string>[]>(
    cTypes: K,
  ): { [I in keyof K]: CmvConfigCoordinationScope<z.infer<CT[K[I] & keyof CT]>> } {
    const result: CmvConfigCoordinationScope[] = [];
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
    return result as unknown as { [I in keyof K]: CmvConfigCoordinationScope<z.infer<CT[K[I] & keyof CT]>> };
  }

  /**
   * Initialize a new meta coordination scope in the coordination space,
   * and get a reference to it in the form of a meta coordination scope instance.
   * @returns {CmvConfigMetaCoordinationScope} A new meta coordination scope instance.
   */
  addMetaCoordination(): CmvConfigMetaCoordinationScope<CT> {
    const prevMetaScopes = Object.keys(this.config.metaCoordination.coordinationScopes);
    const prevMetaByScopes = Object.keys(this.config.metaCoordination.coordinationScopesBy);
    const metaContainer = new CmvConfigMetaCoordinationScope(
      this.getNextScope(prevMetaScopes),
      this.getNextScope(prevMetaByScopes),
    );
    this.config.metaCoordination.coordinationScopes[metaContainer.metaScope.cScope] = metaContainer.metaScope;
    this.config.metaCoordination.coordinationScopesBy[metaContainer.metaByScope.cScope] = metaContainer.metaByScope;
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
  addCoordinationByObject(input: CoordinationInputOf<CT>): ProcessedLevelOf<CT> {
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
    const processLevel = (level: CoordinationInput | null): ProcessedLevel => {
      const result: ProcessedLevel = {};
      if (level === null) {
        return result;
      }
      Object.entries(level).forEach(([cType, nextLevelOrInitialValue]) => {
        // Check if value of object is instanceof CoordinationLevel
        // (otherwise assume it is the coordination value).
        if (nextLevelOrInitialValue instanceof CoordinationLevel) {
          const nextLevel = nextLevelOrInitialValue.value;
          if (nextLevelOrInitialValue.isCached()) {
            result[cType] = nextLevelOrInitialValue.getCached()!;
          } else if (Array.isArray(nextLevel)) {
            const processedLevel: ScopeWithChildren[] = nextLevel.map((nextEl) => {
              const [dummyScope] = this.addCoordination([cType as Extract<keyof CT, string>]) as unknown as CmvConfigCoordinationScope[];
              // TODO: set a better initial value for dummy cases.
              dummyScope.setValue('__dummy__');
              return {
                scope: dummyScope,
                children: processLevel(nextEl as CoordinationInput),
              };
            });
            nextLevelOrInitialValue.setCached(processedLevel);
            result[cType] = processedLevel;
          } else {
            const nextEl = nextLevel;
            const [dummyScope] = this.addCoordination([cType as Extract<keyof CT, string>]) as unknown as CmvConfigCoordinationScope[];
            // TODO: set a better initial value for dummy cases.
            dummyScope.setValue('__dummy__');
            const processedLevel: ScopeWithChildren = {
              scope: dummyScope,
              children: processLevel(nextEl as CoordinationInput),
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
            const [scope] = this.addCoordination([cType as Extract<keyof CT, string>]);
            scope.setValue(initialValue);
            result[cType] = { scope };
          }
        }
      });
      return result;
    };
    // Begin recursion.
    const output = processLevel(input as CoordinationInput) as ProcessedLevelOf<CT>;
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
  linkViews<const K extends Extract<keyof CT, string>[]>(
    views: CmvConfigView<CT>[],
    cTypes: K,
    cValues: { [I in keyof K]: z.infer<CT[K[I] & keyof CT]> } | null = null,
  ): this {
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
  linkViewsByObject(
    views: CmvConfigView<CT>[],
    input: CoordinationInputOf<CT>,
    options: LinkViewsByObjectOptions | null = null,
  ): this {
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
  setCoordinationValue<K extends Extract<keyof CT, string>>(
    cType: K,
    cScope: CoordinationScopeName,
    cValue: z.infer<CT[K]>,
  ): CmvConfigCoordinationScope<z.infer<CT[K]>> {
    const scope = new CmvConfigCoordinationScope<z.infer<CT[K]>>(cType, cScope, cValue);
    if (!this.config.coordinationSpace[scope.cType]) {
      this.config.coordinationSpace[scope.cType] = {};
    }
    this.config.coordinationSpace[scope.cType][scope.cScope] = scope as CmvConfigCoordinationScope;
    return scope;
  }

  /**
   * Convert this instance to a JSON object that can be passed to a provider component.
   * @returns {object} The spec as a JSON object.
   */
  toJSON(): CmvConfigJson {
    const metaCoordinationScopes = Object.fromEntries(
      Object.entries(this.config.metaCoordination.coordinationScopes).map(([cScopeName, cScope]) => ([
        cScopeName,
        cScope.cValue,
      ])),
    );
    const metaCoordinationScopesBy = Object.fromEntries(
      Object.entries(this.config.metaCoordination.coordinationScopesBy).map(([cScopeName, cScope]) => ([
        cScopeName,
        cScope.cValue,
      ])),
    );
    const result: CmvConfigJson = {
      key: this.config.key,
      coordinationSpace: Object.fromEntries(
        Object.entries(this.config.coordinationSpace).map(([cType, cScopes]) => ([
          cType,
          Object.fromEntries(
            Object.entries(cScopes).map(([cScopeName, cScope]) => ([
              cScopeName,
              cScope.cValue,
            ])),
          ),
        ])),
      ),
      viewCoordination: Object.fromEntries(
        Object.entries(this.config.viewCoordination).map(([viewUid, viewObj]) => ([
          viewUid,
          viewObj.toJSON(),
        ])),
      ),
    };
    if (Object.keys(metaCoordinationScopes).length > 0 || Object.keys(metaCoordinationScopesBy).length > 0) {
      result.metaCoordination = {};
      if (Object.keys(metaCoordinationScopes).length > 0) {
        result.metaCoordination.coordinationScopes = metaCoordinationScopes;
      }
      if (Object.keys(metaCoordinationScopesBy).length > 0) {
        result.metaCoordination.coordinationScopesBy = metaCoordinationScopesBy;
      }
    }
    return result;
  }

  /**
   * Create a CmvConfig instance from an existing spec, to enable
   * manipulation with the JavaScript API.
   * @param {object} spec An existing spec as a JSON object.
   * @returns {CmvConfig} A new config instance, with values set to match
   * the spec parameter.
   */
  static fromJSON<CT extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>>(spec: CmvConfigSpec): CmvConfig<CT> {
    const { key } = spec;
    const vc = new CmvConfig<CT>(key);
    Object.keys(spec.coordinationSpace || {}).forEach((cType) => {
      const cObj = spec.coordinationSpace![cType];
      vc.config.coordinationSpace[cType] = {};
      Object.entries(cObj).forEach(([cScopeName, cScopeValue]) => {
        const scope = new CmvConfigCoordinationScope(cType, cScopeName);
        scope.setValue(cScopeValue);
        vc.config.coordinationSpace[cType][cScopeName] = scope;
      });
    });
    Object.entries(spec.metaCoordination?.coordinationScopes || {}).forEach(([cScopeName, cScopeValue]) => {
      const scope = new CmvConfigCoordinationScope(META_COORDINATION_SCOPES, cScopeName);
      scope.setValue(cScopeValue);
      vc.config.metaCoordination.coordinationScopes[cScopeName] = scope;
    });
    Object.entries(spec.metaCoordination?.coordinationScopesBy || {}).forEach(([cScopeName, cScopeValue]) => {
      const scope = new CmvConfigCoordinationScope(META_COORDINATION_SCOPES_BY, cScopeName);
      scope.setValue(cScopeValue);
      vc.config.metaCoordination.coordinationScopesBy[cScopeName] = scope;
    });
    Object.keys(spec.viewCoordination || {}).forEach((viewUid) => {
      const viewObj = spec.viewCoordination![viewUid];
      const newView = new CmvConfigView<CT>(
        viewObj.coordinationScopes,
        viewObj.coordinationScopesBy,
        viewObj.metaCoordinationScopes,
        viewObj.metaCoordinationScopesBy,
      );
      vc.config.viewCoordination[viewUid] = newView;
    });
    return vc;
  }
}

export interface CoordinationSpaceAndScopesResult {
  coordinationSpace: Record<CoordinationType, Record<CoordinationScopeName, CoordinationValue>>;
  metaCoordinationScopes: Record<CoordinationScopeName, CoordinationScopesMapping<CoordinationSpace>>;
  metaCoordinationScopesBy: Record<CoordinationScopeName, CoordinationScopesByMapping<CoordinationSpace>>;
  coordinationScopes: CoordinationScopesMapping<CoordinationSpace> | undefined;
  coordinationScopesBy: CoordinationScopesByMapping<CoordinationSpace> | undefined;
  viewMetaCoordinationScopes: CoordinationScopeName[] | undefined;
  viewMetaCoordinationScopesBy: CoordinationScopeName[] | undefined;
}

// For usage during auto-initialization.
export function getCoordinationSpaceAndScopes<CT extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>>(
  partialCoordinationValues: CoordinationInputOf<CT>,
  scopePrefix: string,
): CoordinationSpaceAndScopesResult {
  const vc = new CmvConfig<CT>('__dummy__');
  vc.getNextScope = createPrefixedGetNextScopeNumeric(scopePrefix);
  const v1 = vc.addView('__dummy__');
  vc.linkViewsByObject([v1], partialCoordinationValues, { meta: true });
  const vcJson = vc.toJSON();
  const { coordinationSpace, metaCoordination } = vcJson;
  const viewData = vcJson.viewCoordination['__dummy__'];
  const coordinationScopes = viewData?.coordinationScopes;
  const coordinationScopesBy = viewData?.coordinationScopesBy;
  const viewMetaCoordinationScopes = viewData?.metaCoordinationScopes;
  const viewMetaCoordinationScopesBy = viewData?.metaCoordinationScopesBy;

  return {
    coordinationSpace,
    metaCoordinationScopes: metaCoordination?.coordinationScopes || {},
    metaCoordinationScopesBy: metaCoordination?.coordinationScopesBy || {},
    coordinationScopes,
    coordinationScopesBy,
    viewMetaCoordinationScopes,
    viewMetaCoordinationScopesBy,
  };
}
