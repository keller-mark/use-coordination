import React from 'react';
import {
  ZodCmvProvider,
  ZodErrorBoundary,
  useCoordination,
  useCoordinationScopes,
} from '@mm-cmv/provider';
import { CoordinationType } from '@mm-cmv/schemas';
import { z } from 'zod';
import { SelectScope } from './example-utils.js';

const SliderInput = ({
  sliderValue, 
  setSliderValue,
}: any) => {
  function handleChange(e: any) {
    setSliderValue(parseFloat(e.target.value));
  }
  return (
    <input type="range" min={0} max={1} step={0.01} value={sliderValue} onChange={handleChange} />
  );
}

const SliderInputContainer = ({
  viewUid,
}: any) => {

  // Support meta-coordination.
  const coordinationScopes = useCoordinationScopes(viewUid);

  const [{
    sliderValue,
  }, {
    setSliderValue,
  }] = useCoordination(['sliderValue'], coordinationScopes);
  return (
    <SliderInput
      sliderValue={sliderValue}
      setSliderValue={setSliderValue}
    />
  );
}


const pluginCoordinationTypes = [
  new CoordinationType('sliderValue', 0.75, z.number()),
];

const initialConfig = {
  uid: 1,
  coordinationSpace: {
    "sliderValue": {
      "A": 0.5,
      "B": 0.75,
      "C": 0.25
    }
  },
  viewCoordination: {
    slider1: {
      coordinationScopes: {
        sliderValue: "A",
      },
    },
    slider2: {
      coordinationScopes: {
        sliderValue: "B",
      },
    },
    slider3: {
      coordinationScopes: {
        sliderValue: "C",
      },
    },
  },
};

export function BaseExample() {
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
          <div className="slider-container">
            <SliderInputContainer viewUid="slider1" />
            <SelectScope config={config} viewUid="slider1" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="slider2" />
            <SelectScope config={config} viewUid="slider2" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="slider3" />
            <SelectScope config={config} viewUid="slider3" onConfigChange={setConfig} />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
