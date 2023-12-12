import { describe, it, expect } from 'vitest';
import {
  CmvConfig,
  CL,
} from './CmvConfig.js';

describe('src/api/CmvConfig.js', () => {
  describe('CmvConfig', () => {
    it('can be instantiated', () => {
      const config = new CmvConfig('My config');

      const configJSON = config.toJSON();
      expect(configJSON).toEqual({
        coordinationSpace: {},
        viewCoordination: {},
        uid: 'My config',
      });
    });

    it('can add a view', () => {
      const config = new CmvConfig('My config');
      config.addView('description');
      config.addView('scatterplot');

      const configJSON = config.toJSON();
      expect(configJSON).toEqual({
        coordinationSpace: {},
        viewCoordination: {
          description: {

          },
          scatterplot: {

          },
        },
        uid: 'My config',
      });
    });
    it('can add a coordination scope', () => {
      const config = new CmvConfig('My config');
      const pca = config.addView('pca');
      const tsne = config.addView('tsne');

      const [ezScope, etxScope, etyScope] = config.addCoordination(
        'embeddingZoom',
        'embeddingTargetX',
        'embeddingTargetY',
      );
      pca.useCoordination(ezScope, etxScope, etyScope);
      tsne.useCoordination(ezScope, etxScope, etyScope);

      ezScope.setValue(10);
      etxScope.setValue(11);
      etyScope.setValue(12);


      const configJSON = config.toJSON();
      expect(configJSON).toEqual({
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
        uid: 'My config',
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
      const configJSON = config.toJSON();
      expect(configJSON.coordinationSpace).toEqual({
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
      const [colorScope] = config.addCoordination(
        'spatialChannelColor',
      );
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

      const configJSON = config.toJSON();
      expect(configJSON).toEqual({
        uid: 'My config',
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

      const configJSON = config.toJSON();
      expect(configJSON).toEqual({
        uid: 'My config',
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
          metaCoordinationScopes: {
            A: {
              spatialImageLayer: ['A'],
              spatialSegmentationLayer: ['A'],
            },
          },
          metaCoordinationScopesBy: {
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
            coordinationScopes: {
              metaCoordinationScopes: ['A'],
              metaCoordinationScopesBy: ['A'],
            },
          },
          layerController: {
            coordinationScopes: {
              metaCoordinationScopes: ['A'],
              metaCoordinationScopesBy: ['A'],
            },
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

      const configJSON = config.toJSON();
      expect(configJSON).toEqual({
        uid: 'My config',
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
          metaCoordinationScopes: {
            A: {
              spatialImageLayer: ['A'],
              spatialSegmentationLayer: ['A'],
            },
          },
          metaCoordinationScopesBy: {
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
            coordinationScopes: {
              metaCoordinationScopes: ['A'],
              metaCoordinationScopesBy: ['A'],
            },
          },
          layerController: {
            coordinationScopes: {
              metaCoordinationScopes: ['A'],
              metaCoordinationScopesBy: ['A'],
            },
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

      const configJSON = config.toJSON();
      expect(configJSON).toEqual({
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
        uid: 'My config',
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
        uid: 'My config',
      });
    });
  });
});
