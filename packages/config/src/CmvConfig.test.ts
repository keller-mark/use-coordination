import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import {
  CmvConfig,
  CmvConfigView,
  CmvConfigMetaCoordinationScope,
  CmvConfigCoordinationScope,
  CL,
} from './CmvConfig.js';

describe('src/api/CmvConfig.js', () => {
  describe('CmvConfig', () => {
    it('can be instantiated', () => {
      const config = new CmvConfig('My config');

      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        coordinationSpace: {},
        viewCoordination: {},
        key: 'My config',
      });
    });

    it('can add a view', () => {
      const config = new CmvConfig('My config');
      config.addView('description');
      config.addView('scatterplot');

      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        coordinationSpace: {},
        viewCoordination: {
          description: {

          },
          scatterplot: {

          },
        },
        key: 'My config',
      });
    });
    it('can add a coordination scope', () => {
      const config = new CmvConfig('My config');
      const pca = config.addView('pca');
      const tsne = config.addView('tsne');

      const [ezScope, etxScope, etyScope] = config.addCoordination([
        'embeddingZoom',
        'embeddingTargetX',
        'embeddingTargetY',
      ]);
      pca.useCoordination([ezScope, etxScope, etyScope]);
      tsne.useCoordination([ezScope, etxScope, etyScope]);

      ezScope.setValue(10);
      etxScope.setValue(11);
      etyScope.setValue(12);


      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        coordinationSpace: {
          embeddingZoom: {
            A: 10,
          },
          embeddingTargetX: {
            A: 11,
          },
          embeddingTargetY: {
            A: 12,
          },
        },
        viewCoordination: {
          pca: {
            coordinationScopes: {
              embeddingZoom: 'A',
              embeddingTargetX: 'A',
              embeddingTargetY: 'A',
            },
          },
          tsne: {
            coordinationScopes: {
              embeddingZoom: 'A',
              embeddingTargetX: 'A',
              embeddingTargetY: 'A',
            },
          },
        },
        key: 'My config',
      });
    });

    it('can add complex coordination', () => {
      const config = new CmvConfig('My config');
      config.addCoordinationByObject({
        spatialImageLayer: CL([
          {
            image: 'S-1905-017737_bf',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialImageChannel: CL([
              {
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                spatialTargetC: 1,
                spatialChannelColor: [0, 255, 0],
              },
            ]),
          },
        ]),
        spatialSegmentationLayer: CL([
          {
            image: 'S-1905-017737',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialSegmentationChannel: CL([
              {
                obsType: 'Cortical Interstitia',
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Non-Globally Sclerotic Glomeruli',
                spatialTargetC: 1,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Globally Sclerotic Glomeruli',
                spatialTargetC: 2,
                spatialChannelColor: [255, 0, 0],
              },
            ]),
          },
        ]),
      });
      const specJSON = config.toJSON();
      expect(specJSON.coordinationSpace).toEqual({
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
      });
    });

    it('can add _and use_ complex coordination', () => {
      const config = new CmvConfig('My config');

      // Coordinate all segmentation channels on the same color,
      // to test out the use of a coordination scope instance as a value.
      const [colorScope] = config.addCoordination([
        'spatialChannelColor',
      ]);
      colorScope.setValue([255, 0, 0]);

      const scopes = config.addCoordinationByObject({
        spatialImageLayer: CL([
          {
            image: 'S-1905-017737_bf',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialImageChannel: CL([
              {
                spatialTargetC: 0,
                spatialChannelColor: [0, 255, 0],
              },
              {
                spatialTargetC: 1,
                spatialChannelColor: [0, 0, 255],
              },
            ]),
          },
        ]),
        spatialSegmentationLayer: CL([
          {
            image: 'S-1905-017737',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialSegmentationChannel: CL([
              {
                obsType: 'Cortical Interstitia',
                spatialTargetC: 0,
                spatialChannelColor: colorScope,
              },
              {
                obsType: 'Non-Globally Sclerotic Glomeruli',
                spatialTargetC: 1,
                spatialChannelColor: colorScope,
              },
              {
                obsType: 'Globally Sclerotic Glomeruli',
                spatialTargetC: 2,
                spatialChannelColor: colorScope,
              },
            ]),
          },
        ]),
      });

      const spatialView = config.addView('spatial');
      spatialView.useCoordinationByObject(scopes);

      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        key: 'My config',
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
            A: [255, 0, 0],
            B: [0, 255, 0],
            C: [0, 0, 255],
          },
          spatialSegmentationLayer: { A: '__dummy__' },
          spatialSegmentationChannel: { A: '__dummy__', B: '__dummy__', C: '__dummy__' },
          obsType: {
            A: 'Cortical Interstitia',
            B: 'Non-Globally Sclerotic Glomeruli',
            C: 'Globally Sclerotic Glomeruli',
          },
        },
        viewCoordination: {
          spatial: {
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
                spatialChannelColor: { A: 'B', B: 'C' },
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
                spatialChannelColor: { A: 'A', B: 'A', C: 'A' },
              },
            },
          },
        },
      });
    });

    it('can use _meta_ complex coordination', () => {
      const config = new CmvConfig('My config');

      const scopes = config.addCoordinationByObject({
        spatialImageLayer: CL([
          {
            image: 'S-1905-017737_bf',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialImageChannel: CL([
              {
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                spatialTargetC: 1,
                spatialChannelColor: [0, 255, 0],
              },
            ]),
          },
        ]),
        spatialSegmentationLayer: CL([
          {
            image: 'S-1905-017737',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialSegmentationChannel: CL([
              {
                obsType: 'Cortical Interstitia',
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Non-Globally Sclerotic Glomeruli',
                spatialTargetC: 1,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Globally Sclerotic Glomeruli',
                spatialTargetC: 2,
                spatialChannelColor: [255, 0, 0],
              },
            ]),
          },
        ]),
      });

      const metaCoordinationScope = config.addMetaCoordination();
      metaCoordinationScope.useCoordinationByObject(scopes);

      const spatialView = config.addView('spatial');
      const lcView = config.addView('layerController');
      spatialView.useMetaCoordination(metaCoordinationScope);
      lcView.useMetaCoordination(metaCoordinationScope);

      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        key: 'My config',
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
            A: [255, 0, 0],
            B: [0, 255, 0],
            C: [255, 0, 0],
            D: [255, 0, 0],
            E: [255, 0, 0],
          },
          spatialSegmentationLayer: { A: '__dummy__' },
          spatialSegmentationChannel: { A: '__dummy__', B: '__dummy__', C: '__dummy__' },
          obsType: {
            A: 'Cortical Interstitia',
            B: 'Non-Globally Sclerotic Glomeruli',
            C: 'Globally Sclerotic Glomeruli',
          },
        },
        metaCoordination: {
          coordinationScopes: {
            A: {
              spatialImageLayer: ['A'],
              spatialSegmentationLayer: ['A'],
            },
          },
          coordinationScopesBy: {
            A: {
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
          },
        },
        viewCoordination: {
          spatial: {
            metaCoordinationScopes: ['A'],
            metaCoordinationScopesBy: ['A'],
          },
          layerController: {
            metaCoordinationScopes: ['A'],
            metaCoordinationScopesBy: ['A'],
          },
        },
      });
    });

    it('can use _meta_ complex coordination via the linkViewsByObject convenience function', () => {
      const config = new CmvConfig('My config');

      const spatialView = config.addView('spatial');
      const lcView = config.addView('layerController');

      config.linkViewsByObject([spatialView, lcView], {
        spatialImageLayer: CL([
          {
            image: 'S-1905-017737_bf',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialImageChannel: CL([
              {
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                spatialTargetC: 1,
                spatialChannelColor: [0, 255, 0],
              },
            ]),
          },
        ]),
        spatialSegmentationLayer: CL([
          {
            image: 'S-1905-017737',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialSegmentationChannel: CL([
              {
                obsType: 'Cortical Interstitia',
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Non-Globally Sclerotic Glomeruli',
                spatialTargetC: 1,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Globally Sclerotic Glomeruli',
                spatialTargetC: 2,
                spatialChannelColor: [255, 0, 0],
              },
            ]),
          },
        ]),
      });

      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        key: 'My config',
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
            A: [255, 0, 0],
            B: [0, 255, 0],
            C: [255, 0, 0],
            D: [255, 0, 0],
            E: [255, 0, 0],
          },
          spatialSegmentationLayer: { A: '__dummy__' },
          spatialSegmentationChannel: { A: '__dummy__', B: '__dummy__', C: '__dummy__' },
          obsType: {
            A: 'Cortical Interstitia',
            B: 'Non-Globally Sclerotic Glomeruli',
            C: 'Globally Sclerotic Glomeruli',
          },
        },
        metaCoordination: {
          coordinationScopes: {
            A: {
              spatialImageLayer: ['A'],
              spatialSegmentationLayer: ['A'],
            },
          },
          coordinationScopesBy: {
            A: {
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
          },
        },
        viewCoordination: {
          spatial: {
            metaCoordinationScopes: ['A'],
            metaCoordinationScopesBy: ['A'],
          },
          layerController: {
            metaCoordinationScopes: ['A'],
            metaCoordinationScopesBy: ['A'],
          },
        },
      });
    });

    it('can use _meta_ complex coordination with a scope prefix via the linkViewsByObject convenience function', () => {
      const config = new CmvConfig('My config');

      const spatialView = config.addView('spatial');
      const lcView = config.addView('layerController');

      config.linkViewsByObject([spatialView, lcView], {
        spatialImageLayer: CL([
          {
            image: 'S-1905-017737_bf',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialImageChannel: CL([
              {
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                spatialTargetC: 1,
                spatialChannelColor: [0, 255, 0],
              },
            ]),
          },
        ]),
        spatialSegmentationLayer: CL([
          {
            image: 'S-1905-017737',
            spatialLayerVisible: true,
            spatialLayerOpacity: 1,
            spatialSegmentationChannel: CL([
              {
                obsType: 'Cortical Interstitia',
                spatialTargetC: 0,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Non-Globally Sclerotic Glomeruli',
                spatialTargetC: 1,
                spatialChannelColor: [255, 0, 0],
              },
              {
                obsType: 'Globally Sclerotic Glomeruli',
                spatialTargetC: 2,
                spatialChannelColor: [255, 0, 0],
              },
            ]),
          },
        ]),
      }, { scopePrefix: 'SOME_PREFIX_' });

      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        key: 'My config',
        coordinationSpace: {
          spatialImageLayer: { SOME_PREFIX_0: '__dummy__' },
          image: { SOME_PREFIX_0: 'S-1905-017737_bf', SOME_PREFIX_1: 'S-1905-017737' },
          spatialLayerVisible: { SOME_PREFIX_0: true, SOME_PREFIX_1: true },
          spatialLayerOpacity: { SOME_PREFIX_0: 1, SOME_PREFIX_1: 1 },
          spatialImageChannel: { SOME_PREFIX_0: '__dummy__', SOME_PREFIX_1: '__dummy__' },
          spatialTargetC: {
            SOME_PREFIX_0: 0, SOME_PREFIX_1: 1, SOME_PREFIX_2: 0, SOME_PREFIX_3: 1, SOME_PREFIX_4: 2,
          },
          spatialChannelColor: {
            SOME_PREFIX_0: [255, 0, 0],
            SOME_PREFIX_1: [0, 255, 0],
            SOME_PREFIX_2: [255, 0, 0],
            SOME_PREFIX_3: [255, 0, 0],
            SOME_PREFIX_4: [255, 0, 0],
          },
          spatialSegmentationLayer: { SOME_PREFIX_0: '__dummy__' },
          spatialSegmentationChannel: { SOME_PREFIX_0: '__dummy__', SOME_PREFIX_1: '__dummy__', SOME_PREFIX_2: '__dummy__' },
          obsType: {
            SOME_PREFIX_0: 'Cortical Interstitia',
            SOME_PREFIX_1: 'Non-Globally Sclerotic Glomeruli',
            SOME_PREFIX_2: 'Globally Sclerotic Glomeruli',
          },
        },
        metaCoordination: {
          coordinationScopes: {
            SOME_PREFIX_0: {
              spatialImageLayer: ['SOME_PREFIX_0'],
              spatialSegmentationLayer: ['SOME_PREFIX_0'],
            },
          },
          coordinationScopesBy: {
            SOME_PREFIX_0: {
              spatialImageLayer: {
                image: { SOME_PREFIX_0: 'SOME_PREFIX_0' },
                spatialLayerVisible: { SOME_PREFIX_0: 'SOME_PREFIX_0' },
                spatialLayerOpacity: { SOME_PREFIX_0: 'SOME_PREFIX_0' },
                spatialImageChannel: { SOME_PREFIX_0: ['SOME_PREFIX_0', 'SOME_PREFIX_1'] },
              },
              spatialImageChannel: {
                spatialTargetC: { SOME_PREFIX_0: 'SOME_PREFIX_0', SOME_PREFIX_1: 'SOME_PREFIX_1' },
                spatialChannelColor: { SOME_PREFIX_0: 'SOME_PREFIX_0', SOME_PREFIX_1: 'SOME_PREFIX_1' },
              },
              spatialSegmentationLayer: {
                image: { SOME_PREFIX_0: 'SOME_PREFIX_1' },
                spatialLayerVisible: { SOME_PREFIX_0: 'SOME_PREFIX_1' },
                spatialLayerOpacity: { SOME_PREFIX_0: 'SOME_PREFIX_1' },
                spatialSegmentationChannel: { SOME_PREFIX_0: ['SOME_PREFIX_0', 'SOME_PREFIX_1', 'SOME_PREFIX_2'] },
              },
              spatialSegmentationChannel: {
                obsType: { SOME_PREFIX_0: 'SOME_PREFIX_0', SOME_PREFIX_1: 'SOME_PREFIX_1', SOME_PREFIX_2: 'SOME_PREFIX_2' },
                spatialTargetC: { SOME_PREFIX_0: 'SOME_PREFIX_2', SOME_PREFIX_1: 'SOME_PREFIX_3', SOME_PREFIX_2: 'SOME_PREFIX_4' },
                spatialChannelColor: { SOME_PREFIX_0: 'SOME_PREFIX_2', SOME_PREFIX_1: 'SOME_PREFIX_3', SOME_PREFIX_2: 'SOME_PREFIX_4' },
              },
            },
          },
        },
        viewCoordination: {
          spatial: {
            metaCoordinationScopes: ['SOME_PREFIX_0'],
            metaCoordinationScopesBy: ['SOME_PREFIX_0'],
          },
          layerController: {
            metaCoordinationScopes: ['SOME_PREFIX_0'],
            metaCoordinationScopesBy: ['SOME_PREFIX_0'],
          },
        },
      });
    });

    it('can add a coordination scope using the link views convenience function', () => {
      const config = new CmvConfig('My config');
      const pca = config.addView('pca');
      const tsne = config.addView('tsne');

      config.linkViews(
        [pca, tsne],
        [
          'embeddingZoom',
        ],
      );

      config.linkViews(
        [pca, tsne],
        [
          'embeddingTargetX',
          'embeddingTargetY',
        ],
        [
          2,
          3,
        ],
      );

      const specJSON = config.toJSON();
      expect(specJSON).toEqual({
        coordinationSpace: {
          embeddingZoom: {
            A: null,
          },
          embeddingTargetX: {
            A: 2,
          },
          embeddingTargetY: {
            A: 3,
          },
        },
        viewCoordination: {
          pca: {
            coordinationScopes: {
              embeddingTargetX: 'A',
              embeddingTargetY: 'A',
              embeddingZoom: 'A',
            },
          },
          tsne: {
            coordinationScopes: {
              embeddingTargetX: 'A',
              embeddingTargetY: 'A',
              embeddingZoom: 'A',
            },
          },
        },
        key: 'My config',
      });
    });

    it('can load a view config from JSON', () => {
      const config = new CmvConfig('My config');
      const v1 = config.addView('spatial');
      const v2 = config.addView('scatterplot');
      const v3 = config.addView('status');

      config.linkViews(
        [v1, v2, v3],
        [
          'dataset',
        ],
        [
          'My dataset'
        ]
      );
      config.linkViews(
        [v2],
        [
          'embeddingType',
        ],
        [
          'PCA'
        ]
      );


      const origConfigJSON = config.toJSON();

      const loadedConfig = CmvConfig.fromJSON(origConfigJSON);
      const loadedConfigJSON = loadedConfig.toJSON();

      expect(loadedConfigJSON).toEqual({
        coordinationSpace: {
          dataset: {
            A: 'My dataset',
          },
          embeddingType: {
            A: 'PCA',
          },
        },
        viewCoordination: {
          spatial: {
            coordinationScopes: {
              dataset: 'A',
            },
          },
          scatterplot: {
            coordinationScopes: {
              dataset: 'A',
              embeddingType: 'A',
            },
          },
          status: {
            coordinationScopes: {
              dataset: 'A',
            },
          },
        },
        key: 'My config',
      });
    });
    it('generic CT param constrains coordination type names', () => {
      const pluginCoordinationTypes = {
        embeddingZoom: z.number().nullable(),
        embeddingType: z.string(),
        dataset: z.string(),
      };
      type CT = typeof pluginCoordinationTypes;

      // Valid coordination types are accepted at runtime and produce correct JSON.
      const config = new CmvConfig<CT>('My config');
      const [zoomScope] = config.addCoordination(['embeddingZoom']);
      zoomScope.setValue(10);
      const pca = config.addView('pca');
      pca.useCoordination([zoomScope]);
      config.linkViews([pca], ['embeddingType'], ['PCA']);

      expect(config.toJSON()).toEqual({
        key: 'My config',
        coordinationSpace: {
          embeddingZoom: { A: 10 },
          embeddingType: { A: 'PCA' },
        },
        viewCoordination: {
          pca: {
            coordinationScopes: {
              embeddingZoom: 'A',
              embeddingType: 'A',
            },
          },
        },
      });

      // Return type of addCoordination is a typed tuple matching the inferred value type per key.
      expectTypeOf(config.addCoordination(['embeddingZoom'])).toEqualTypeOf<[CmvConfigCoordinationScope<number | null>]>();

      // Return type of addView is CmvConfigView<CT>.
      expectTypeOf(config.addView('x')).toEqualTypeOf<CmvConfigView<CT>>();
      // Return type of addMetaCoordination is CmvConfigMetaCoordinationScope<CT>.
      expectTypeOf(config.addMetaCoordination()).toEqualTypeOf<CmvConfigMetaCoordinationScope<CT>>();

      // ProcessedLevelOf is CT-branded: scopes from one CT cannot be passed to views/meta-scopes of another CT.
      const configB = new CmvConfig<{ otherType: z.ZodString }>('config B');
      const viewB = configB.addView('v');
      const metaB = configB.addMetaCoordination();
      const scopesA = config.addCoordinationByObject({ embeddingZoom: 10 });
      // @ts-expect-error scopes from CT cannot be used with a CmvConfigView<different CT>
      viewB.useCoordinationByObject(scopesA);
      // @ts-expect-error scopes from CT cannot be used with a CmvConfigMetaCoordinationScope<different CT>
      metaB.useCoordinationByObject(scopesA);

      // Invalid coordination types are rejected by TypeScript.
      const config2 = new CmvConfig<CT>('type checks');
      const view2 = config2.addView('v');
      // @ts-expect-error 'notAType' is not a key of CT
      config2.addCoordination(['notAType']);
      // @ts-expect-error 'notAType' is not a key of CT
      config2.linkViews([view2], ['notAType']);
      // @ts-expect-error 'notAType' is not a key of CT
      config2.setCoordinationValue('notAType', 'A', 0);
      // @ts-expect-error 'notAType' is not a key of CT
      config2.addCoordinationByObject({ notAType: 0 });
      // @ts-expect-error 'notAType' is not a key of CT
      config2.linkViewsByObject([view2], { notAType: CL([{}]) });

      config2.linkViewsByObject([view2], {
        // @ts-expect-error 10 is not assignable to string (z.infer<z.ZodString>)
        embeddingType: 10,
      });

      // @ts-expect-error 10 is not assignable to string (z.infer<z.ZodString>)
      config2.setCoordinationValue('embeddingType', 'A', 10);

      // @ts-expect-error
      config2.linkViews([view2], ['embeddingType'], [10]);
      config2.linkViews([view2], ['embeddingType'], ['test']);
      // @ts-expect-error
      config2.linkViews([view2], ['embeddingType', 'embeddingZoom'], ['test', 'test']);
    });
  });
});
