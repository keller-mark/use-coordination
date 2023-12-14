import React from 'react';
import {
  ZodCmvProvider,
  ZodErrorBoundary,
  useCoordination,
} from '@use-coordination/all';
import { z } from 'zod';
import { SelectScope, MetaSelectScope } from './example-utils.js';

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
  const [{
    sliderValue,
  }, {
    setSliderValue,
  }] = useCoordination(viewUid, ['sliderValue']);
  return (
    <SliderInput
      sliderValue={sliderValue}
      setSliderValue={setSliderValue}
    />
  );
}

const pluginCoordinationTypes = {
  sliderValue: z.number(),
};

const initialMetaConfig = {
  key: 1,
  coordinationSpace: {
    "sliderValue": {
      "A": 0.5,
      "B": 0.75,
      "C": 0.25
    },
    metaCoordinationScopes: {
      A: {
        sliderValue: "A",
      },
      B: {
        sliderValue: "B",
      },
      C: {
        sliderValue: "C",
      }
    }
  },
  viewCoordination: {
    slider1: {
      coordinationScopes: {
        metaCoordinationScopes: "A",
      },
    },
    slider2: {
      coordinationScopes: {
        metaCoordinationScopes: "B",
      },
    },
    slider3: {
      coordinationScopes: {
        metaCoordinationScopes: "C",
      },
    },
  },
};

export function MetaCoordinationExample() {
  const [config, setConfig] = React.useState<any>(initialMetaConfig);
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
            <MetaSelectScope config={config} viewUid="slider1" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="slider2" />
            <MetaSelectScope config={config} viewUid="slider2" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="slider3" />
            <MetaSelectScope config={config} viewUid="slider3" onConfigChange={setConfig} />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

