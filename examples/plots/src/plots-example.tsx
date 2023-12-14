import React from 'react';
import {
  ZodCmvProvider,
  ZodErrorBoundary,
  useCoordination,
} from '@use-coordination/all';
import { z } from 'zod';
import { letterFrequency } from '@visx/mock-data';
import { VegaLitePlotView } from './vega-lite.js';
import { D3BarPlotView } from './d3.js';
import { VisxPlotView } from './visx.js';


const pluginCoordinationTypes = {
  barSelection: z.array(z.string()),
};

const initialConfig = {
  key: 1,
  coordinationSpace: {
    "barSelection": {
      "A": ["bar1"],
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
        barSelection: "B",
      },
    },
    visx: {
      coordinationScopes: {
        barSelection: "C",
      },
    },
  },
};

export function PlotsExample() {
  const [config, setConfig] = React.useState<any>(initialConfig);
  return (
    <>
      <style>{`
        .slider-container {
          display: flex;
          flex-direction: row;
        }
      `}</style>
      <ZodErrorBoundary>
        <ZodCmvProvider
          config={config}
          coordinationTypes={pluginCoordinationTypes}
          onConfigChange={setConfig}
        >
          <div className="plot-container">
            <VegaLitePlotView viewUid="vegaLite" data={letterFrequency} />
          </div>
          <div className="plot-container">
            <D3BarPlotView viewUid="d3" data={letterFrequency} />
          </div>
          <div className="plot-container">
            <VisxPlotView viewUid="visx" data={letterFrequency} />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
