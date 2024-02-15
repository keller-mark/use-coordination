import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineSpec,
} from '@use-coordination/all';
import { FlowEditor } from '@use-coordination/flow-editor';
import { z } from 'zod';
import { letterFrequency } from '@visx/mock-data';
import { VegaLitePlotView } from './vega-lite.js';
import { D3BarPlotView } from './d3.js';
import { VisxPlotView } from './visx.js';
import { PlotlyBarPlotView } from './plotly.js';


const pluginCoordinationTypes = {
  barSelection: z.array(z.string()).nullable(),
};

const initialSpec = defineSpec({
  key: 1,
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

export function PlotsExample(props: any) {
  const { showFlowEditor } = props;
  const [spec, setSpec] = React.useState<any>(initialSpec);
  return (
    <>
      <style>{`
        .multiplot-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
      `}</style>
      {showFlowEditor ? (
        <FlowEditor config={spec} onSpecChange={setSpec} />
      ) : null}
      <ZodErrorBoundary key={spec.key}>
        <ZodCoordinationProvider
          config={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
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
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
