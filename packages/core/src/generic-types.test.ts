import { describe, it, expect, expectTypeOf } from 'vitest';
import { defineSpec } from './generic-types.js';

// Helper to build spec objects with literal string types preserved.
// Without `as const` on string values, TypeScript widens scope name strings
// (e.g. 'A') to `string`, which breaks the type constraints in defineSpec.
// These helpers use explicit literal type annotations to preserve narrowness.

describe('defineSpec', () => {
  describe('runtime behavior', () => {
    it('returns the spec object identity unchanged', () => {
      const spec = { key: 1 };
      expect(defineSpec(spec)).toBe(spec);
    });

    it('works with an empty spec', () => {
      expect(defineSpec({})).toEqual({});
    });

    it('works with coordinationSpace only', () => {
      const spec = {
        coordinationSpace: {
          obsType: { A: 'cell', B: 'nucleus' },
        },
      };
      expect(defineSpec(spec)).toEqual(spec);
    });

    it('works with top-level metaCoordinationScopes and metaCoordinationScopesBy as siblings of viewCoordination', () => {
      const spec = {
        coordinationSpace: {
          obsType: { A: 'cell', B: 'nucleus' },
          obsColor: { X: '#ff0000' as const, Y: '#00ff00' as const },
        },
        metaCoordinationScopes: {
          metaA: { obsType: 'A' as const },
        },
        metaCoordinationScopesBy: {
          metaA: {
            obsType: {
              obsColor: { A: 'X' as const, B: 'Y' as const },
            },
          },
        },
        viewCoordination: {
          view1: {
            metaCoordinationScopes: 'metaA' as const,
            metaCoordinationScopesBy: 'metaA' as const,
          },
          view2: {
            metaCoordinationScopes: ['metaA'] as const,
            metaCoordinationScopesBy: ['metaA'] as const,
          },
        },
      };
      expect(defineSpec(spec)).toEqual(spec);
    });

    it('works with both coordinationScopes and metaCoordinationScopes as sibling properties in a view', () => {
      const spec = {
        coordinationSpace: {
          obsType: { A: 'cell' as const },
          featureType: { F: 'gene' as const },
        },
        metaCoordinationScopes: {
          metaA: { obsType: 'A' as const },
        },
        metaCoordinationScopesBy: {},
        viewCoordination: {
          view1: {
            coordinationScopes: { featureType: 'F' as const },
            metaCoordinationScopes: 'metaA' as const,
          },
        },
      };
      expect(defineSpec(spec)).toEqual(spec);
    });

    it('works with multiple meta scopes assigned as an array', () => {
      const spec = {
        coordinationSpace: {
          obsType: { A: 'cell' as const },
          featureType: { F: 'gene' as const },
        },
        metaCoordinationScopes: {
          metaA: { obsType: 'A' as const },
          metaB: { featureType: 'F' as const },
        },
        metaCoordinationScopesBy: {},
        viewCoordination: {
          view1: {
            metaCoordinationScopes: ['metaA', 'metaB'] as const,
          },
        },
      };
      expect(defineSpec(spec)).toEqual(spec);
    });
  });

  describe('two-level structure (spatialImageLayer → spatialImageChannel)', () => {
    // Spec modelling one image layer with two channels, using meta-coordination.
    // Mirrors the JSON produced by the CmvConfig API in CmvConfig.test.js.
    const twoLevelSpec = {
      coordinationSpace: {
        spatialImageLayer: { A: '__dummy__' as const },
        spatialImageChannel: { A: '__dummy__' as const, B: '__dummy__' as const },
        spatialTargetC: { A: 0 as const, B: 1 as const },
        spatialChannelColor: { A: '#ff0000' as const, B: '#00ff00' as const },
      },
      metaCoordinationScopes: {
        metaA: {
          spatialImageLayer: ['A'] as const,
        },
      },
      metaCoordinationScopesBy: {
        metaA: {
          spatialImageLayer: {
            spatialImageChannel: { A: ['A', 'B'] as const },
          },
          spatialImageChannel: {
            spatialTargetC: { A: 'A' as const, B: 'B' as const },
            spatialChannelColor: { A: 'A' as const, B: 'B' as const },
          },
        },
      },
      viewCoordination: {
        spatial: {
          metaCoordinationScopes: 'metaA' as const,
          metaCoordinationScopesBy: 'metaA' as const,
        },
        layerController: {
          metaCoordinationScopes: ['metaA'] as const,
          metaCoordinationScopesBy: ['metaA'] as const,
        },
      },
    };

    it('returns the spec object identity unchanged', () => {
      expect(defineSpec(twoLevelSpec)).toBe(twoLevelSpec);
    });

    it('infers view-level metaCoordinationScopes type from top-level metaCoordinationScopes keys', () => {
      const spec = defineSpec(twoLevelSpec);
      // Only 'metaA' is a key of the top-level metaCoordinationScopes.
      expectTypeOf(spec.viewCoordination!.spatial!.metaCoordinationScopes).toEqualTypeOf<
        'metaA' | ('metaA')[] | undefined
      >();
    });

    it('infers metaCoordinationScopes value scope names from coordinationSpace', () => {
      const spec = defineSpec(twoLevelSpec);
      // spatialImageLayer only has scope 'A', so the value must be 'A' or 'A'[].
      expectTypeOf(spec.metaCoordinationScopes!.metaA!.spatialImageLayer).toEqualTypeOf<
        'A' | ('A')[] | undefined
      >();
    });

    it('infers metaCoordinationScopesBy leaf scope names from coordinationSpace', () => {
      const spec = defineSpec(twoLevelSpec);
      // spatialImageChannel has scopes 'A' and 'B', so channel assignments under
      // spatialImageLayer must be 'A' | 'B' (or arrays thereof).
      expectTypeOf(
        spec.metaCoordinationScopesBy!.metaA!.spatialImageLayer!.spatialImageChannel!.A,
      ).toEqualTypeOf<'A' | 'B' | ('A' | 'B')[] | undefined>();
      // spatialTargetC has scopes 'A' and 'B', so target assignments under
      // spatialImageChannel must be 'A' | 'B' (or arrays thereof).
      expectTypeOf(
        spec.metaCoordinationScopesBy!.metaA!.spatialImageChannel!.spatialTargetC!.A,
      ).toEqualTypeOf<'A' | 'B' | ('A' | 'B')[] | undefined>();
    });

    it('rejects invalid scope names in metaCoordinationScopes values', () => {
      defineSpec({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' as const },
          spatialImageChannel: { A: '__dummy__' as const, B: '__dummy__' as const },
        },
        metaCoordinationScopes: {
          metaA: {
            // @ts-expect-error 'Z' is not a valid scope for spatialImageLayer (only 'A' exists)
            spatialImageLayer: 'Z',
          },
        },
        metaCoordinationScopesBy: {},
        viewCoordination: {
          spatial: { metaCoordinationScopes: 'metaA' as const },
        },
      });
    });

    it('rejects invalid scope names in metaCoordinationScopesBy leaf values', () => {
      defineSpec({
        coordinationSpace: {
          spatialImageLayer: { A: '__dummy__' as const },
          spatialImageChannel: { A: '__dummy__' as const, B: '__dummy__' as const },
          spatialTargetC: { A: 0 as const, B: 1 as const },
        },
        metaCoordinationScopes: {},
        metaCoordinationScopesBy: {
          metaA: {
            spatialImageChannel: {
              spatialTargetC: {
                // @ts-expect-error 'Z' is not a valid scope for spatialTargetC (only 'A' | 'B')
                A: 'Z',
              },
            },
          },
        },
        viewCoordination: {
          spatial: { metaCoordinationScopesBy: 'metaA' as const },
        },
      });
    });
  });

  describe('TypeScript type inference — valid specs', () => {
    it('infers correct return type matching input type', () => {
      const input = {
        key: 1 as const,
        coordinationSpace: {
          obsType: { A: 'cell' as const },
        },
        metaCoordinationScopes: {
          metaA: { obsType: 'A' as const },
        },
        metaCoordinationScopesBy: {} as const,
        viewCoordination: {
          view1: {
            coordinationScopes: { obsType: 'A' as const },
            metaCoordinationScopes: 'metaA' as const,
          },
        },
      };
      const result = defineSpec(input);
      expectTypeOf(result).toEqualTypeOf(input);
    });

    it('infers view-level metaCoordinationScopes type from top-level metaCoordinationScopes keys', () => {
      const spec = defineSpec({
        coordinationSpace: {
          obsType: { A: 'cell' as const },
        },
        metaCoordinationScopes: {
          metaA: { obsType: 'A' as const },
          metaB: { obsType: 'A' as const },
        },
        metaCoordinationScopesBy: {},
        viewCoordination: {
          view1: {
            metaCoordinationScopes: 'metaA' as const,
          },
        },
      });
      // View-level metaCoordinationScopes is constrained to keys of the
      // top-level metaCoordinationScopes ('metaA' | 'metaB').
      expectTypeOf(spec.viewCoordination!.view1!.metaCoordinationScopes).toEqualTypeOf<
        'metaA' | 'metaB' | ('metaA' | 'metaB')[] | undefined
      >();
    });

    it('infers view-level metaCoordinationScopesBy type from top-level metaCoordinationScopesBy keys', () => {
      const spec = defineSpec({
        coordinationSpace: {
          obsType: { A: 'cell' as const },
          obsColor: { X: '#ff0000' as const },
        },
        metaCoordinationScopes: {},
        metaCoordinationScopesBy: {
          byA: {
            obsType: { obsColor: { A: 'X' as const } },
          },
          byB: {
            obsType: { obsColor: { A: 'X' as const } },
          },
        },
        viewCoordination: {
          view1: {
            metaCoordinationScopesBy: 'byA' as const,
          },
        },
      });
      // View-level metaCoordinationScopesBy is constrained to keys of the
      // top-level metaCoordinationScopesBy ('byA' | 'byB').
      expectTypeOf(spec.viewCoordination!.view1!.metaCoordinationScopesBy).toEqualTypeOf<
        'byA' | 'byB' | ('byA' | 'byB')[] | undefined
      >();
    });

    it('infers coordinationScopes type from coordinationSpace scope names', () => {
      const spec = defineSpec({
        coordinationSpace: {
          obsType: { A: 'cell' as const, B: 'nucleus' as const },
        },
        metaCoordinationScopes: {},
        metaCoordinationScopesBy: {},
        viewCoordination: {
          view1: {
            coordinationScopes: { obsType: 'A' as const },
          },
        },
      });
      // coordinationScopes.obsType should be constrained to 'A' | 'B' or arrays thereof.
      expectTypeOf(spec.viewCoordination!.view1!.coordinationScopes!.obsType).toEqualTypeOf<
        'A' | 'B' | ('A' | 'B')[] | undefined
      >();
    });
  });

  describe('TypeScript type checking — invalid specs', () => {
    it('rejects coordinationScope names not present in coordinationSpace', () => {
      defineSpec({
        coordinationSpace: {
          obsType: { A: 'cell' as const },
        },
        metaCoordinationScopes: {},
        metaCoordinationScopesBy: {},
        viewCoordination: {
          view1: {
            coordinationScopes: {
              // @ts-expect-error 'Z' is not a valid scope name for obsType (only 'A' is valid)
              obsType: 'Z',
            },
          },
        },
      });
    });

    it('rejects metaCoordinationScopes names not present in top-level metaCoordinationScopes', () => {
      defineSpec({
        coordinationSpace: {
          obsType: { A: 'cell' as const },
        },
        metaCoordinationScopes: {
          metaA: { obsType: 'A' as const },
        },
        metaCoordinationScopesBy: {},
        viewCoordination: {
          view1: {
            // @ts-expect-error 'metaB' is not a key of the top-level metaCoordinationScopes
            metaCoordinationScopes: 'metaB',
          },
        },
      });
    });

    it('rejects metaCoordinationScopesBy names not present in top-level metaCoordinationScopesBy', () => {
      defineSpec({
        coordinationSpace: {
          obsType: { A: 'cell' as const },
        },
        metaCoordinationScopes: {},
        metaCoordinationScopesBy: {
          byA: {},
        },
        viewCoordination: {
          view1: {
            // @ts-expect-error 'byB' is not a key of the top-level metaCoordinationScopesBy
            metaCoordinationScopesBy: 'byB',
          },
        },
      });
    });
  });
});
