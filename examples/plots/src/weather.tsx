import React, { useEffect } from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineSpec,
} from '@use-coordination/all';
import { FlowEditor } from '@use-coordination/flow-editor';
import { z } from 'zod';
import { default as vegaData } from 'vega-datasets';
import { WeatherBarsView } from './weather-bars.js';
import { TempPrecipView } from './weather-temp-precip.js';
import { TimelineView } from './weather-timeline.js';

const pluginCoordinationTypes = {
  maxTempSelection: z.array(z.number()).length(2).nullable(),
  precipitationSelection: z.array(z.number()).length(2).nullable(),
};

const initialSpec = defineSpec({
  key: 1,
  coordinationSpace: {
    maxTempSelection: {
      "A": [0, 15],
    },
    precipitationSelection: {
        A: [18, 40],
    },
  },
  viewCoordination: {
    precipitationBars: {
      coordinationScopes: {
        maxTempSelection: "A",
        precipitationSelection: "A",
      },
    },
    tempPrecipScatter: {
      coordinationScopes: {
        maxTempSelection: "A",
        precipitationSelection: "A",
      },
    },
    dateTempScatter: {
      coordinationScopes: {
        maxTempSelection: "A",
        precipitationSelection: "A",
      },
    },
  },
});

export function WeatherExample(props: any) {
  const { showFlowEditor } = props;
  const [spec, setSpec] = React.useState<any>(initialSpec);
  const [data, setData] = React.useState<any>(null);

  useEffect(() => {
    vegaData['seattle-weather.csv']().then((v) => {
      setData(v);
    });
  }, []);

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
        <FlowEditor spec={spec} onSpecChange={setSpec} />
      ) : null}
      <ZodErrorBoundary key={spec.key}>
        <ZodCoordinationProvider
          spec={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <div className="multiplot-container">
            <div className="plot-container">
              <WeatherBarsView viewUid="precipitationBars" data={data} />
            </div>
            <div className="plot-container">
              <TempPrecipView viewUid="tempPrecipScatter" data={data} />
            </div>
            <div className="plot-container">
              <TimelineView viewUid="dateTempScatter" data={data} />
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
