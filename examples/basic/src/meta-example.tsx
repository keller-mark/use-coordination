import React from 'react';
import {
  ZodCoordinationProvider,
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

const initialMetaSpec = {
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
  const [spec, setSpec] = React.useState<any>(initialMetaSpec);
  return (
    <>
      <style>{`
        .slider-container {
          display: flex;
          flex-direction: row;
        }
      `}</style>
      <ZodErrorBoundary>
        <ZodCoordinationProvider
          config={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <div className="slider-container">
            <SliderInputContainer viewUid="slider1" />
            <MetaSelectScope config={spec} viewUid="slider1" onSpecChange={setSpec} />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="slider2" />
            <MetaSelectScope config={spec} viewUid="slider2" onSpecChange={setSpec} />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="slider3" />
            <MetaSelectScope config={spec} viewUid="slider3" onSpecChange={setSpec} />
          </div>
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

