import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
} from '@use-coordination/all';
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
  const [{
    value,
  }, {
    setValue,
  }] = useCoordination(viewUid, ['value']);
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
  const [{
    value,
  }, {
    setValue,
  }] = useCoordination(viewUid, ['value']);
  return (
    <NumericInput
    value={value}
      setValue={setValue}
    />
  );
}



const pluginCoordinationTypes = {
  value: z.number(),
}

const initialSpec2 = {
  key: 1,
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
  const [spec, setSpec] = React.useState<any>(initialSpec2);
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
          spec={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <div className="slider-container">
            <SliderInputContainer viewUid="view1" />
            <SelectScope spec={spec} viewUid="view1" onSpecChange={setSpec} cType="value" />
          </div>
          <div className="slider-container">
            <NumericInputContainer viewUid="view2" />
            <SelectScope spec={spec} viewUid="view2" onSpecChange={setSpec} cType="value" />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="view3" />
            <SelectScope spec={spec} viewUid="view3" onSpecChange={setSpec} cType="value" />
          </div>
          <div className="slider-container">
            <NumericInputContainer viewUid="view4" />
            <SelectScope spec={spec} viewUid="view4" onSpecChange={setSpec} cType="value" />
          </div>
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

