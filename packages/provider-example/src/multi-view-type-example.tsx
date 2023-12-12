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
  value, 
  setValue,
}: any) => {
  function handleChange(e: any) {
    setValue(parseFloat(e.target.value));
  }
  return (
    <input type="range" min={0} max={1} step={0.01} value={value} onChange={handleChange} />
  );
}

const SliderInputContainer = ({
  viewUid,
}: any) => {
  // Support meta-coordination.
  const coordinationScopes = useCoordinationScopes(viewUid);

  const [{
    value,
  }, {
    setValue,
  }] = useCoordination(['value'], coordinationScopes);
  return (
    <SliderInput
      value={value}
      setValue={setValue}
    />
  );
}

const NumericInput = ({
  value, 
  setValue,
}: any) => {
  function handleChange(e: any) {
    setValue(parseFloat(e.target.value));
  }
  return (
    <input type="number" min={0} max={1} step={0.01} value={value} onChange={handleChange} />
  );
}

const NumericInputContainer = ({
  viewUid,
}: any) => {
  // Support meta-coordination.
  const coordinationScopes = useCoordinationScopes(viewUid);

  const [{
    value,
  }, {
    setValue,
  }] = useCoordination(['value'], coordinationScopes);
  return (
    <NumericInput
    value={value}
      setValue={setValue}
    />
  );
}



const pluginCoordinationTypes = [
  new CoordinationType('value', 0.75, z.number()),
];


const initialConfig2 = {
  uid: 1,
  coordinationSpace: {
    "value": {
      "A": 0.5,
      "B": 0.75,
      "C": 0.25,
      "D": 0.1,
    }
  },
  viewCoordination: {
    view1: {
      coordinationScopes: {
        value: "A",
      },
    },
    view2: {
      coordinationScopes: {
        value: "A",
      },
    },
    view3: {
      coordinationScopes: {
        value: "B",
      },
    },
    view4: {
      coordinationScopes: {
        value: "B",
      },
    },
  },
};

export function MultiViewTypeExample() {
  const [config, setConfig] = React.useState<any>(initialConfig2);
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
            <SliderInputContainer viewUid="view1" />
            <SelectScope config={config} viewUid="view1" onConfigChange={setConfig} cType="value" />
          </div>
          <div className="slider-container">
            <NumericInputContainer viewUid="view2" />
            <SelectScope config={config} viewUid="view2" onConfigChange={setConfig} cType="value" />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="view3" />
            <SelectScope config={config} viewUid="view3" onConfigChange={setConfig} cType="value" />
          </div>
          <div className="slider-container">
            <NumericInputContainer viewUid="view4" />
            <SelectScope config={config} viewUid="view4" onConfigChange={setConfig} cType="value" />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

