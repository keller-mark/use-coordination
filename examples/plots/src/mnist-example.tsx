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
import { FlowEditor } from '@use-coordination/flow-editor';


const GL_OPTIONS = { webgl2: true };
const baseUrl = 'https://storage.googleapis.com/vitessce-demo-data/use-coordination/mnist.zarr';

const colors = [[78,121,167, 255],[242,142,44, 255],[225,87,89, 255],[118,183,178, 255],[89,161,79, 255],[237,201,73, 255],[175,122,161, 255],[255,157,167, 255],[156,117,95, 255],[186,176,171, 255]];

const pluginCoordinationTypes = {
  zoomLevel: z.number().nullable(),
  zoomOffset: z.number().nullable(),
  targetX: z.number().nullable(),
  targetY: z.number().nullable(),
};

const initialSpec = defineSpec({
  key: 1,
  coordinationSpace: {
    "zoomLevel": {
      "shared": 3.282928374353915
    },
    "zoomOffset": {
      "overview": 0,
      "detail": 2
    },
    "targetX": {
      "umap": 0.5722378595673838,
      "densmap": 0.19160931736478615
    },
    "targetY": {
      "umap": -0.24042483622122024,
      "densmap": -0.01400468369125818
    }
  },
  viewCoordination: {
    umap: {
      coordinationScopes: {
        zoomLevel: "shared",
        zoomOffset: "overview",
        targetX: "umap",
        targetY: "umap",
      },
    },
    densmap: {
      coordinationScopes: {
        zoomLevel: "shared",
        zoomOffset: "overview",
        targetX: "densmap",
        targetY: "densmap",
      },
    },
    umapDetail: {
      coordinationScopes: {
        zoomLevel: "shared",
        zoomOffset: "detail",
        targetX: "umap",
        targetY: "umap",
      },
    },
    densmapDetail: {
      coordinationScopes: {
        zoomLevel: "shared",
        zoomOffset: "detail",
        targetX: "densmap",
        targetY: "densmap",
      },
    },
  },
});

function MnistLegend(props: any) {

  return (
    <div className="mnist-legend">
      <p>MNIST Digit</p>
      <svg width="100" height="385">
        {colors.map((color, i) => (
          <>
            <rect
              key={i}
              x={0}
              y={i * 25}
              width={20}
              height={20}
              fill={`rgb(${color.join(',')})`}
            />
            <text x={25} y={i * 25 + 15}>{i}</text>
          </>
        ))}
      </svg>
    </div>
  )
}

function MnistScatterplot(props: any) {
  const { data, viewUid, name } = props;

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
          color[3] = 0.9 * 255;
          return color;
        },
        getRadius: 0.35,
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
      <span className="plot-name">{name}</span>
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
        .deckgl-scatterplot .plot-name {
          position: absolute;
          bottom: 0;
          right: 5px;
          font-size: 20px;
        }
        .mnist-legend {
          display: inline-block;
          position: relative;
        }
        .mnist-legend p {
          margin-bottom: 0;
        }
      `}</style>
      <ZodErrorBoundary key={spec.key}>
        <ZodCoordinationProvider
          spec={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <MnistScatterplot data={mnistData} viewUid="umap" name="UMAP (overview)" />
          <MnistScatterplot data={mnistData} viewUid="densmap" name="densMAP (overview)" />
          <MnistLegend />
          <MnistScatterplot data={mnistData} viewUid="umapDetail" name="UMAP (detail)"/>
          <MnistScatterplot data={mnistData} viewUid="densmapDetail" name="densMAP (detail)" />
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
      <FlowEditor spec={spec} onSpecChange={setSpec} />
    </>
  );
}
