import React from 'react';
import {
  CoordinationProvider,
  defineConfig,
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

const initialConfig = defineConfig({
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
    config: configToUse,
    onConfigChange: setConfig,
    onChangeCurrent,
  } = useTrrack(initialConfig);
  
  return (
    <>
      <style>{`
        .multiplot-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
      `}</style>
      <div style={{ display: 'flex' }}>
        <div>
          <button onClick={onUndo} disabled={!canUndo}>Undo</button>
          <button onClick={onRedo} disabled={!canRedo}>Redo</button>
          <ZodErrorBoundary key={configToUse.key}>
            <ZodCoordinationProvider
              config={configToUse}
              coordinationTypes={pluginCoordinationTypes}
              onConfigChange={(newConfig: any) => {
                setConfig(newConfig);
              }}
              diffByKey={false}
              emitInitialConfigChange={false}
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
            {JSON.stringify(configToUse, null, 2)}
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
