import React from 'react';
import {
  defineSpec,
  ZodCoordinationProvider,
  ZodErrorBoundary,
  z,
} from '@use-coordination/all';
import {
  useTrrack,
} from '@use-coordination/trrack-helpers';
import { ProvVis } from '@trrack/vis-react';
import { letterFrequency } from '@visx/mock-data';
import { VegaLitePlotView } from './vega-lite.js';
import { D3BarPlotView } from './d3.js';
import { VisxPlotView } from './visx.js';
import { PlotlyBarPlotView } from './plotly.js';

const pluginCoordinationTypes = {
  barSelection: z.array(z.string()).nullable(),
};

const initialSpec = defineSpec({
  coordinationSpace: {
    "barSelection": {
      "A": [],
    }
  },
  viewCoordination: {
    vegaLite: {
      coordinationScopes: {
        barSelection: "A",
      },
    },
    d3: {
      coordinationScopes: {
        barSelection: "A",
      },
    },
    visx: {
      coordinationScopes: {
        barSelection: "A",
      },
    },
    plotly: {
      coordinationScopes: {
        barSelection: "A",
      },
    },
  },
});

export function TrrackExample(props: any) {
  const {
    trrack,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    spec: specToUse,
    onSpecChange: setSpec,
    onChangeCurrent,
  } = useTrrack(initialSpec);
  
  return (
    <>
      <style>{`
        .multiplot-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
        .plot-lib-title {
          display: none;
        }
      `}</style>
      <div style={{ display: 'flex' }}>
        <div>
          <button onClick={onUndo} disabled={!canUndo}>Undo</button>
          <button onClick={onRedo} disabled={!canRedo}>Redo</button>
          <ZodErrorBoundary key={specToUse.key}>
            <ZodCoordinationProvider
              spec={specToUse}
              coordinationTypes={pluginCoordinationTypes}
              onSpecChange={(newSpec: any) => {
                setSpec(newSpec);
              }}
              remountOnKeyChange={false}
              emitInitialSpecChange={false}
            >
              <div className="multiplot-container">
                <div className="plot-container">
                  <VegaLitePlotView viewUid="vegaLite" data={letterFrequency} />
                </div>
                <div className="plot-container">
                  <D3BarPlotView viewUid="d3" data={letterFrequency} />
                </div>
                <div className="plot-container">
                  <VisxPlotView viewUid="visx" data={letterFrequency} />
                </div>
                <div className="plot-container">
                  <PlotlyBarPlotView viewUid="plotly" data={letterFrequency} />
                </div>
              </div>
            </ZodCoordinationProvider>
          </ZodErrorBoundary>
          <pre>
            {JSON.stringify(specToUse, null, 2)}
          </pre>
        </div>
        <div>
          <ProvVis
            root={trrack.root.id}
            config={{
              changeCurrent: onChangeCurrent,
            }}
            nodeMap={trrack.graph.backend.nodes}
            currentNode={trrack.current.id}
          />
        </div>
      </div>
    </>
  );
}
