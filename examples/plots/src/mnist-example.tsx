import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineSpec,
} from '@use-coordination/all';
import { z } from 'zod';
import DeckGL from '@deck.gl/react';
import { COORDINATE_SYSTEM, OrthographicView } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { FetchStore, open as zarrOpen, root as zarrRoot, get as zarrGet } from 'zarrita';

const GL_OPTIONS = { webgl2: true };
const baseUrl = 'https://storage.googleapis.com/vitessce-demo-data/use-coordination/mnist.zarr';

const colors = [[78,121,167, 255],[242,142,44, 255],[225,87,89, 255],[118,183,178, 255],[89,161,79, 255],[237,201,73, 255],[175,122,161, 255],[255,157,167, 255],[156,117,95, 255],[186,176,171, 255]];

const pluginCoordinationTypes = {
  zoomLevel: z.number().nullable(),
  zoomOffset: z.number().nullable(),
  targetX: z.number().nullable(),
  targetY: z.number().nullable(),
  digitSelection: z.number().nullable(),
  defaultRadius: z.number().nullable(),
  selectionRadius: z.number().nullable(),
  defaultOpacity: z.number().nullable(),
  selectionOpacity: z.number().nullable(),
};

const initialSpec = defineSpec({
  key: 1,
  coordinationSpace: {
    "zoomLevel": {
      "A": 3.408081577867634
    },
    "zoomOffset": {
      "overview": 0,
      "detail": 2
    },
    "targetX": {
      "A": -1.3737042750595396,
      "B": -0.8421135500796049
    },
    "targetY": {
      "A": 0.789629088169244,
      "B": 1.4172548435372825
    },
    digitSelection: {
      "A": 1,
    },
    defaultRadius: {
      "A": 0.35,
    },
    selectionRadius: {
      "A": 0.35,
    },
    defaultOpacity: {
      "A": 0.9,
    },
    selectionOpacity: {
      "A": 0.9,
    },
  },
  viewCoordination: {
    umap: {
      coordinationScopes: {
        zoomLevel: "A",
        zoomOffset: "overview",
        targetX: "A",
        targetY: "A",
        digitSelection: "A",
        defaultRadius: "A",
        selectionRadius: "A",
        defaultOpacity: "A",
        selectionOpacity: "A",
      },
    },
    densmap: {
      coordinationScopes: {
        zoomLevel: "A",
        zoomOffset: "overview",
        targetX: "B",
        targetY: "B",
        digitSelection: "A",
        defaultRadius: "A",
        selectionRadius: "A",
        defaultOpacity: "A",
        selectionOpacity: "A",
      },
    },
    umapDetail: {
      coordinationScopes: {
        zoomLevel: "A",
        zoomOffset: "detail",
        targetX: "A",
        targetY: "A",
        digitSelection: "A",
        defaultRadius: "A",
        selectionRadius: "A",
        defaultOpacity: "A",
        selectionOpacity: "A",
      },
    },
    densmapDetail: {
      coordinationScopes: {
        zoomLevel: "A",
        zoomOffset: "detail",
        targetX: "B",
        targetY: "B",
        digitSelection: "A",
        defaultRadius: "A",
        selectionRadius: "A",
        defaultOpacity: "A",
        selectionOpacity: "A",
      },
    },
    legend: {
      coordinationScopes: {
        digitSelection: "A",
      },
    },
    controls: {
      coordinationScopes: {
        defaultRadius: "A",
        selectionRadius: "A",
        defaultOpacity: "A",
        selectionOpacity: "A",
      },
    },
  },
});

function MnistControls(props: any) {
  const { viewUid } = props;

  const [{
    defaultRadius,
    selectionRadius,
    defaultOpacity,
    selectionOpacity,
  }, {
    setDefaultRadius,
    setSelectionRadius,
    setDefaultOpacity,
    setSelectionOpacity,
  }] = useCoordination(viewUid, ["defaultRadius", "selectionRadius", "defaultOpacity", "selectionOpacity"]);


  const onDefaultRadiusChange = (e: any) => {
    const value = Number(e.target.value);
    setDefaultRadius(value);
  };

  const onSelectionRadiusChange = (e: any) => {
    const value = Number(e.target.value);
    setSelectionRadius(value);
  };

  return (
    <div className="mnist-controls">
      <label>
        Default Radius:
        <input type="range" min="0.01" max="10" step="0.01" value={defaultRadius} onChange={onDefaultRadiusChange} />
      </label>
      <label>
        Selection Radius:
        <input type="range" min="0.01" max="10" step="0.01" value={selectionRadius} onChange={onSelectionRadiusChange} />
      </label>
      <br/>
      <label>
        Default Opacity:
        <input type="range" min="0.01" max="1" step="0.01" value={defaultOpacity} onChange={(e) => setDefaultOpacity(Number(e.target.value))} />
      </label>
      <label>
        Selection Opacity:
        <input type="range" min="0.01" max="1" step="0.01" value={selectionOpacity} onChange={(e) => setSelectionOpacity(Number(e.target.value))} />
      </label>
    </div>
  )
}

function MnistLegend(props: any) {
  const { viewUid } = props;

  const [{
    digitSelection,
  }, {
    setDigitSelection,
  }] = useCoordination(viewUid, ["digitSelection"]);

  return (
    <div className="mnist-legend">
      <svg width="100" height="405">
        {colors.map((color, i) => (
          <>
            <rect
              key={i}
              x={(i === digitSelection ? 0 : 5)}
              y={i * 25 + (i === digitSelection ? 0 : 5)}
              width={digitSelection === i ? 20 : 10}
              height={digitSelection === i ? 20 : 10}
              fill={`rgb(${color.join(',')})`}
              onClick={() => setDigitSelection(i)}
            />
            <text x={25} y={i * 25 + 15} onClick={() => setDigitSelection(i)}>{i}</text>
          </>
        ))}
      </svg>
    </div>
  )
}

function MnistScatterplot(props: any) {
  const { data, viewUid } = props;

  const [{
    zoomLevel,
    zoomOffset,
    targetX,
    targetY,
    digitSelection,
    defaultRadius,
    selectionRadius,
    defaultOpacity,
    selectionOpacity,
  }, {
    setZoomLevel,
    setTargetX,
    setTargetY,
  }] = useCoordination(viewUid, ["zoomLevel", "zoomOffset", "targetX", "targetY", "digitSelection", "defaultRadius", "selectionRadius", "defaultOpacity", "selectionOpacity"]);

  const onViewStateChange = useCallback(({viewState}: any) => {
    setZoomLevel(viewState.zoom - zoomOffset);
    setTargetX(viewState.target[0]);
    setTargetY(viewState.target[1]);
  }, []);
  const views = useMemo(() => {
    return [
      new OrthographicView({
        id: 'ortho',
      }),
    ];
  }, []);

  const layers = useMemo(() => {
    if (!data) return [];
    const { target: targetData } = data;
    const dataset = viewUid.startsWith('umap') ? 'umap' : 'densmap';
    const pointData = data[dataset];
    return [
      new ScatterplotLayer({
        id: 'mnist-scatterplot',
        data: {
          src: {
            targetData,
            pointData,
          },
          length: targetData.shape[0],
        },
        pickable: true,
        opacity: 0.1,
        filled: true,
        stroked: false,
        radiusMinPixels: 0.5,
        radiusMaxPixels: 5,
        radiusScale: 0.05,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: (object: any, {index, data, target}: { data: any, index: number, target: any }) => {
          target[0] = data.src.pointData.X.data[index];
          target[1] = -data.src.pointData.Y.data[index];
          target[2] = 0;
          return target;
        },
        getFillColor: (object: any, {index, data}: { data: any, index: number }) => {
          const digit = data.src.targetData.data[index];
          const color = colors[digit];
          color[3] = digit === digitSelection ? selectionOpacity * 255 : defaultOpacity * 255;
          return color;
        },
        getRadius: (object: any, {index, data}: { data: any, index: number }) => {
          const digit = data.src.targetData.data[index];
          return digit === digitSelection ? selectionRadius : defaultRadius;
        },
      }),
    ];
  }, [data, digitSelection, defaultRadius, selectionRadius, defaultOpacity, selectionOpacity]);
  return (
    <div className="deckgl-scatterplot">
      <DeckGL
        width="100%"
        height="100%"
        controller={true}
        layers={layers}
        viewState={{
          target: [targetX, targetY, 0],
          zoom: zoomLevel + zoomOffset,
        }}
        onViewStateChange={onViewStateChange}
        views={views}
        useDevicePixels
        glOptions={GL_OPTIONS}

      />
    </div>
  )
}

export function MnistExample(props: any) {
  const [spec, setSpec] = React.useState<any>(initialSpec);
  const [mnistData, setMnistData] = React.useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const store = new FetchStore(baseUrl);
      const umapX = await zarrOpen(zarrRoot(store).resolve('/umap/X'), { kind: "array" });
      const umapY = await zarrOpen(zarrRoot(store).resolve('/umap/Y'), { kind: "array" });
      const densmapX = await zarrOpen(zarrRoot(store).resolve('/densmap/X'), { kind: "array" });
      const densmapY = await zarrOpen(zarrRoot(store).resolve('/densmap/Y'), { kind: "array" });
      const target = await zarrOpen(zarrRoot(store).resolve('/umap/target'), { kind: "array" });
      const arrs = await Promise.all(
        [umapX, umapY, densmapX, densmapY, target].map(arr => zarrGet(arr))
      );
      return {
        "umap": {
          "X": arrs[0],
          "Y": arrs[1],
        },
        "densmap": {
          "X": arrs[2],
          "Y": arrs[3],
        },
        "target": arrs[4],
      };
    }
    fetchData().then(data => setMnistData(data))
  }, []);

  return (
    <>
      <style>{`
        .deckgl-scatterplot {
          width: 400px;
          height: 400px;
          display: inline-block;
          position: relative;
          border: 1px solid gray;
          margin: 5px;
        }
        .mnist-legend {
          display: inline-block;
          position: relative;
        }
        .mnist-legend rect, .mnist-legend text {
          cursor: pointer;
        }
        .plot-lib-title {
          font-size: 20px;
          font-weight: bold;
          margin: 10px;
        }
      `}</style>
      <ZodErrorBoundary key={spec.key}>
        <ZodCoordinationProvider
          spec={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <MnistScatterplot data={mnistData} viewUid="umap" />
          <MnistScatterplot data={mnistData} viewUid="densmap" />
          <MnistLegend viewUid="legend" />
          <MnistScatterplot data={mnistData} viewUid="umapDetail" />
          <MnistScatterplot data={mnistData} viewUid="densmapDetail" />
          <MnistControls viewUid="controls" />
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
