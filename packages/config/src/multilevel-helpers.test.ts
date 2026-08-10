import { describe, it, expect } from 'vitest';
import { expandMultiLevelObject, tryCollapseMultiLevelObject } from './multilevel-helpers.js';

describe('src/multilevel-helpers.js', () => {
  describe('expandMultiLevelObject', () => {
    it('expands a single-level object', () => {
      expect(expandMultiLevelObject({
        embeddingZoom: { $value: 10 },
        embeddingTargetX: { $value: 11 },
      })).toEqual({
        coordinationSpace: {
          embeddingZoom: { A: 10 },
          embeddingTargetX: { A: 11 },
        },
        coordinationScopes: {
          embeddingZoom: 'A',
          embeddingTargetX: 'A',
        },
        coordinationScopesBy: {},
      });
    });

    it('expands a multi-level object', () => {
      // Same input and output as the `addCoordinationByObject` unit tests.
      expect(expandMultiLevelObject({
        spatialImageLayer: {
          $CL: [
            {
              image: { $value: 'S-1905-017737_bf' },
              spatialLayerVisible: { $value: true },
              spatialLayerOpacity: { $value: 1 },
              spatialImageChannel: {
                $CL: [
                  {
                    spatialTargetC: { $value: 0 },
                    spatialChannelColor: { $value: [255, 0, 0] },
                  },
                  {
                    spatialTargetC: { $value: 1 },
                    spatialChannelColor: { $value: [0, 255, 0] },
                  },
                ],
              },
            },
          ],
        },
        spatialSegmentationLayer: {
          $CL: [
            {
              image: { $value: 'S-1905-017737' },
              spatialLayerVisible: { $value: true },
              spatialLayerOpacity: { $value: 1 },
              spatialSegmentationChannel: {
                $CL: [
                  {
                    obsType: { $value: 'Cortical Interstitia' },
                    spatialTargetC: { $value: 0 },
                    spatialChannelColor: { $value: [255, 0, 0] },
                  },
                  {
                    obsType: { $value: 'Non-Globally Sclerotic Glomeruli' },
                    spatialTargetC: { $value: 1 },
                    spatialChannelColor: { $value: [255, 0, 0] },
                  },
                  {
                    obsType: { $value: 'Globally Sclerotic Glomeruli' },
                    spatialTargetC: { $value: 2 },
                    spatialChannelColor: { $value: [255, 0, 0] },
                  },
                ],
              },
            },
          ],
        },
      })).toEqual({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' },
          image: { A: 'S-1905-017737_bf', B: 'S-1905-017737' },
          spatialLayerVisible: { A: true, B: true },
          spatialLayerOpacity: { A: 1, B: 1 },
          spatialImageChannel: { A: '__dummy__', B: '__dummy__' },
          spatialTargetC: {
            A: 0, B: 1, C: 0, D: 1, E: 2,
          },
          spatialChannelColor: {
            A: [255, 0, 0], B: [0, 255, 0], C: [255, 0, 0], D: [255, 0, 0], E: [255, 0, 0],
          },
          spatialSegmentationLayer: { A: '__dummy__' },
          spatialSegmentationChannel: { A: '__dummy__', B: '__dummy__', C: '__dummy__' },
          obsType: {
            A: 'Cortical Interstitia',
            B: 'Non-Globally Sclerotic Glomeruli',
            C: 'Globally Sclerotic Glomeruli',
          },
        },
        coordinationScopes: {
          spatialImageLayer: ['A'],
          spatialSegmentationLayer: ['A'],
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            image: { A: 'A' },
            spatialLayerVisible: { A: 'A' },
            spatialLayerOpacity: { A: 'A' },
            spatialImageChannel: { A: ['A', 'B'] },
          },
          spatialImageChannel: {
            spatialTargetC: { A: 'A', B: 'B' },
            spatialChannelColor: { A: 'A', B: 'B' },
          },
          spatialSegmentationLayer: {
            image: { A: 'B' },
            spatialLayerVisible: { A: 'B' },
            spatialLayerOpacity: { A: 'B' },
            spatialSegmentationChannel: { A: ['A', 'B', 'C'] },
          },
          spatialSegmentationChannel: {
            obsType: { A: 'A', B: 'B', C: 'C' },
            spatialTargetC: { A: 'C', B: 'D', C: 'E' },
            spatialChannelColor: { A: 'C', B: 'D', C: 'E' },
          },
        },
      });
    });

    it('expands a non-array coordination level', () => {
      expect(expandMultiLevelObject({
        spatialImageLayer: {
          $CL: {
            image: { $value: 'S-1905-017737_bf' },
            spatialLayerOpacity: { $value: 1 },
          },
        },
      })).toEqual({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' },
          image: { A: 'S-1905-017737_bf' },
          spatialLayerOpacity: { A: 1 },
        },
        coordinationScopes: {
          spatialImageLayer: 'A',
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            image: { A: 'A' },
            spatialLayerOpacity: { A: 'A' },
          },
        },
      });
    });

    it('references existing coordination scopes without modifying them', () => {
      expect(expandMultiLevelObject({
        spatialImageLayer: {
          $CL: [
            {
              spatialImageChannel: {
                $CL: [
                  {
                    spatialTargetC: { $value: 0 },
                    spatialChannelColor: { $value: [255, 0, 0] },
                  },
                  {
                    spatialTargetC: { $value: 1 },
                    spatialChannelColor: { $scope: 'myExistingColorScope' },
                  },
                ],
              },
            },
          ],
        },
      }, {
        coordinationSpace: {
          spatialChannelColor: { myExistingColorScope: [0, 0, 255] },
        },
      })).toEqual({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' },
          spatialImageChannel: { A: '__dummy__', B: '__dummy__' },
          spatialTargetC: { A: 0, B: 1 },
          spatialChannelColor: { myExistingColorScope: [0, 0, 255], A: [255, 0, 0] },
        },
        coordinationScopes: {
          spatialImageLayer: ['A'],
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            spatialImageChannel: { A: ['A', 'B'] },
          },
          spatialImageChannel: {
            spatialTargetC: { A: 'A', B: 'B' },
            spatialChannelColor: { A: 'A', B: 'myExistingColorScope' },
          },
        },
      });
    });

    it('does not generate scope names which conflict with existing or referenced ones', () => {
      const result = expandMultiLevelObject({
        embeddingZoom: { $value: 10 },
        embeddingTargetX: { $scope: 'A' },
      }, {
        coordinationSpace: {
          embeddingZoom: { A: 9 },
        },
      });
      expect(result).toEqual({
        coordinationSpace: {
          embeddingZoom: { A: 9, B: 10 },
        },
        coordinationScopes: {
          embeddingZoom: 'B',
          embeddingTargetX: 'A',
        },
        coordinationScopesBy: {},
      });
    });

    it('supports a scope prefix', () => {
      expect(expandMultiLevelObject({
        spatialImageLayer: {
          $CL: [
            { image: { $value: 'S-1905-017737_bf' } },
          ],
        },
      }, { scopePrefix: 'init_' })).toEqual({
        coordinationSpace: {
          spatialImageLayer: { init_0: '__dummy__' },
          image: { init_0: 'S-1905-017737_bf' },
        },
        coordinationScopes: {
          spatialImageLayer: ['init_0'],
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            image: { init_0: 'init_0' },
          },
        },
      });
    });

    it('treats the contents of $value verbatim', () => {
      expect(expandMultiLevelObject({
        myObjectType: { $value: { $CL: 1, nested: { $scope: 'A' } } },
      })).toEqual({
        coordinationSpace: {
          myObjectType: { A: { $CL: 1, nested: { $scope: 'A' } } },
        },
        coordinationScopes: {
          myObjectType: 'A',
        },
        coordinationScopesBy: {},
      });
    });

    it('errors when a sentinel key is missing', () => {
      expect(() => expandMultiLevelObject({
        // @ts-expect-error Testing runtime validation.
        embeddingZoom: 10,
      })).toThrow(/to be an object containing one of the keys/);
      expect(() => expandMultiLevelObject({
        // @ts-expect-error Testing runtime validation.
        embeddingZoom: { value: 10 },
      })).toThrow(/to contain one of the keys/);
    });

    it('errors when there are multiple sentinel keys', () => {
      expect(() => expandMultiLevelObject({
        // @ts-expect-error Testing runtime validation.
        embeddingZoom: { $value: 10, $scope: 'A' },
      })).toThrow(/to contain only one of the keys/);
    });

    it('errors when a sentinel key has sibling keys', () => {
      expect(() => expandMultiLevelObject({
        // @ts-expect-error Testing runtime validation.
        spatialImageLayer: { $CL: [{ image: { $value: 'a' } }], other: 1 },
      })).toThrow(/to be the only key of the object which contains it/);
    });

    it('errors when the $CL value is not an object', () => {
      expect(() => expandMultiLevelObject({
        // @ts-expect-error Testing runtime validation.
        spatialImageLayer: { $CL: 10 },
      })).toThrow(/to be an object or an array of objects/);
      expect(() => expandMultiLevelObject({
        // @ts-expect-error Testing runtime validation.
        spatialImageLayer: { $CL: [10] },
      })).toThrow(/Expected each coordination level to be an object of coordination types/);
    });

    it('errors when the $scope value is not a non-empty string', () => {
      expect(() => expandMultiLevelObject({
        // @ts-expect-error Testing runtime validation.
        spatialChannelColor: { $scope: 1 },
      })).toThrow(/to be a non-empty string/);
      expect(() => expandMultiLevelObject({
        spatialChannelColor: { $scope: '' },
      })).toThrow(/to be a non-empty string/);
    });
  });

  describe('tryCollapseMultiLevelObject', () => {
    it('collapses a single-level object', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          embeddingZoom: { A: 10 },
          embeddingTargetX: { A: 11 },
        },
        coordinationScopes: {
          embeddingZoom: 'A',
          embeddingTargetX: 'A',
        },
        coordinationScopesBy: {},
      })).toEqual({
        embeddingZoom: { $value: 10 },
        embeddingTargetX: { $value: 11 },
      });
    });

    it('collapses a multi-level object', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' },
          image: { A: 'S-1905-017737_bf' },
          spatialLayerVisible: { A: true },
          spatialImageChannel: { A: '__dummy__', B: '__dummy__' },
          spatialTargetC: { A: 0, B: 1 },
          spatialChannelColor: { A: [255, 0, 0], B: [0, 255, 0] },
        },
        coordinationScopes: {
          spatialImageLayer: ['A'],
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            image: { A: 'A' },
            spatialLayerVisible: { A: 'A' },
            spatialImageChannel: { A: ['A', 'B'] },
          },
          spatialImageChannel: {
            spatialTargetC: { A: 'A', B: 'B' },
            spatialChannelColor: { A: 'A', B: 'B' },
          },
        },
      })).toEqual({
        spatialImageLayer: {
          $CL: [
            {
              image: { $value: 'S-1905-017737_bf' },
              spatialLayerVisible: { $value: true },
              spatialImageChannel: {
                $CL: [
                  {
                    spatialTargetC: { $value: 0 },
                    spatialChannelColor: { $value: [255, 0, 0] },
                  },
                  {
                    spatialTargetC: { $value: 1 },
                    spatialChannelColor: { $value: [0, 255, 0] },
                  },
                ],
              },
            },
          ],
        },
      });
    });

    it('preserves whether a coordination level is an array', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' },
          image: { A: 'S-1905-017737_bf' },
        },
        coordinationScopes: {
          spatialImageLayer: 'A',
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            image: { A: 'A' },
          },
        },
      })).toEqual({
        spatialImageLayer: {
          $CL: {
            image: { $value: 'S-1905-017737_bf' },
          },
        },
      });
    });

    it('references scopes which are shared or absent from the coordination space', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          spatialImageChannel: { A: '__dummy__', B: '__dummy__' },
          spatialChannelColor: { shared: [255, 0, 0] },
        },
        coordinationScopes: {
          spatialImageChannel: ['A', 'B'],
        },
        coordinationScopesBy: {
          spatialImageChannel: {
            spatialTargetC: { A: 'A', B: 'B' },
            spatialChannelColor: { A: 'shared', B: 'shared' },
          },
        },
      })).toEqual({
        spatialImageChannel: {
          $CL: [
            {
              // Absent from the coordination space.
              spatialTargetC: { $scope: 'A' },
              // Shared between the two channels.
              spatialChannelColor: { $scope: 'shared' },
            },
            {
              spatialTargetC: { $scope: 'B' },
              spatialChannelColor: { $scope: 'shared' },
            },
          ],
        },
      });
    });

    it('returns null when a coordination level is shared', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__', B: '__dummy__' },
          spatialImageChannel: { A: '__dummy__' },
          spatialTargetC: { A: 0 },
        },
        coordinationScopes: {
          spatialImageLayer: ['A', 'B'],
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            // Both layers reference the same channel.
            spatialImageChannel: { A: ['A'], B: ['A'] },
          },
          spatialImageChannel: {
            spatialTargetC: { A: 'A' },
          },
        },
      })).toBeNull();
    });

    it('returns null when a scopes-by entry is unreachable', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__', B: '__dummy__' },
          image: { A: 'a', B: 'b' },
        },
        coordinationScopes: {
          spatialImageLayer: ['A'],
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            // The mapping for layer B is not reachable from `coordinationScopes`.
            image: { A: 'A', B: 'B' },
          },
        },
      })).toBeNull();
    });

    it('returns null when multiple scopes of a non-level type are used', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          obsType: { A: 'cell', B: 'nucleus' },
        },
        coordinationScopes: {
          obsType: ['A', 'B'],
        },
        coordinationScopesBy: {},
      })).toBeNull();
    });

    it('returns null when the mappings are cyclic', () => {
      expect(tryCollapseMultiLevelObject({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' },
          spatialImageChannel: { A: '__dummy__' },
        },
        coordinationScopes: {
          spatialImageLayer: ['A'],
        },
        coordinationScopesBy: {
          spatialImageLayer: {
            spatialImageChannel: { A: ['A'] },
          },
          spatialImageChannel: {
            spatialImageLayer: { A: ['A'] },
          },
        },
      })).toBeNull();
    });

    it('round-trips the output of expandMultiLevelObject', () => {
      const inputObj = {
        spatialImageLayer: {
          $CL: [
            {
              image: { $value: 'S-1905-017737_bf' },
              spatialLayerVisible: { $value: true },
              spatialLayerOpacity: { $value: 1 },
              spatialImageChannel: {
                $CL: [
                  {
                    spatialTargetC: { $value: 0 },
                    spatialChannelColor: { $value: [255, 0, 0] },
                  },
                  {
                    spatialTargetC: { $value: 1 },
                    spatialChannelColor: { $value: [0, 255, 0] },
                  },
                ],
              },
            },
          ],
        },
        embeddingZoom: { $value: 10 },
      };
      const expanded = expandMultiLevelObject(inputObj);
      expect(tryCollapseMultiLevelObject(expanded)).toEqual(inputObj);
      // Collapsing and re-expanding is a fixed point.
      expect(expandMultiLevelObject(tryCollapseMultiLevelObject(expanded)!)).toEqual(expanded);
    });

    it('inlines the value of a $scope reference which is used only once', () => {
      // A `$scope` reference is indistinguishable from a `$value` once expanded,
      // so the value is inlined rather than referenced.
      const expanded = expandMultiLevelObject({
        spatialImageChannel: {
          $CL: [
            {
              spatialTargetC: { $value: 0 },
              spatialChannelColor: { $scope: 'myExistingColorScope' },
            },
          ],
        },
      }, {
        coordinationSpace: {
          spatialChannelColor: { myExistingColorScope: [0, 0, 255] },
        },
      });
      expect(tryCollapseMultiLevelObject(expanded)).toEqual({
        spatialImageChannel: {
          $CL: [
            {
              spatialTargetC: { $value: 0 },
              spatialChannelColor: { $value: [0, 0, 255] },
            },
          ],
        },
      });
    });
  });
});
