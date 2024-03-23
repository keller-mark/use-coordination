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

const colors = [[78,121,167],[242,142,44],[225,87,89],[118,183,178],[89,161,79],[237,201,73],[175,122,161],[255,157,167],[156,117,95],[186,176,171]];

const pluginCoordinationTypes = {
  zoomLevel: z.number().nullable(),
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
    zoomLevel: {
      "A": 3.5,
    },
    targetX: {
      "A": 8,
      "B": 8,
    },
    targetY: {
      "A": 8,
      "B": 8,
    },
    digitSelection: {
      "A": 1,
    },
    defaultRadius: {
      "A": 1,
    },
    selectionRadius: {
      "A": 5,
    },
    defaultOpacity: {
      "A": 0.1,
    },
    selectionOpacity: {
      "A": 0.5,
    },
  },
  viewCoordination: {
    umap: {
      coordinationScopes: {
        zoomLevel: "A",
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
  return (
    <div className="mnist-controls">
      <input type="range" min="0" max="10" step="1" />
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
    digitSelection,
    defaultRadius,
    selectionRadius,
  }, {
    setZoomLevel,
    setDigitSelection,
    setDefaultRadius,
    setSelectionRadius,
  }] = useCoordination(viewUid, ["zoomLevel", "digitSelection", "defaultRadius", "selectionRadius"]);

  const [viewState, setViewState] = useState({
    target: [8, -8, 0],
    zoom: 3,
  });
  const onViewStateChange = useCallback(({viewState}: any) => {
    setViewState(viewState);
    setZoomLevel(viewState.zoom);
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
    const pointData = data[viewUid];
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
          return colors[digit];
        },
        getRadius: 1,
      }),
    ];
  }, [data]);
  return (
    <div className="deckgl-scatterplot">
      <DeckGL
        width="100%"
        height="100%"
        controller={true}
        layers={layers}
        viewState={{
          target: viewState.target,
          zoom: zoomLevel,
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
          <MnistControls viewUid="controls" />
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
