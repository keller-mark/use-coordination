import React from 'react';
import {
  ZodCmvProvider,
  ZodErrorBoundary,
  useViewMapping,
  _useCoordination,
} from '@mm-cmv/all';
import { z } from 'zod';
import { SelectScope } from './example-utils.js';

// Reference: https://stackoverflow.com/a/5624139
function rgbToHex(r: number, g: number, b: number) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}


const ColorfulSliderInput = ({
  value, 
  setValue,
  color,
  setColor,
}: any) => {
  function handleValueChange(e: any) {
    setValue(parseFloat(e.target.value));
  }
  function handleColorChange(e: any) {
    const rgbObj = hexToRgb(e.target.value);
    if(rgbObj) {
      setColor([rgbObj.r, rgbObj.g, rgbObj.b]);
    }
  }
  const hexColor = rgbToHex(color[0], color[1], color[2]);
  return (
    <div style={{ border: `5px solid ${hexColor}` }} className="colorful-slider-view">
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={handleValueChange} />
      <input type="color" value={hexColor} onChange={handleColorChange} />
    </div>
  );
}

const ColorfulSliderInputContainer = ({
  viewUid,
}: any) => {
  // Support meta-coordination.
  const [coordinationScopes] = useViewMapping(viewUid);

  const [{
    value,
    color,
  }, {
    setValue,
    setColor,
  }] = _useCoordination(coordinationScopes, ['value', 'color']);
  return (
    <ColorfulSliderInput
      value={value}
      setValue={setValue}
      color={color}
      setColor={setColor}
    />
  );
}

const pluginCoordinationTypes = {
  value: z.number(),
  color: z.array(z.number()).length(3),
};


const initialConfig = {
  key: 1,
  coordinationSpace: {
    "value": {
      "A": 0.5,
      "B": 0.75,
      "C": 0.25,
    },
    "color": {
      "A": [255, 0, 0],
      "B": [0, 255, 0],
      "C": [0, 0, 255],
    }
  },
  viewCoordination: {
    view1: {
      coordinationScopes: {
        value: "A",
        color: "A",
      },
    },
    view2: {
      coordinationScopes: {
        value: "B",
        color: "B",
      },
    },
    view3: {
      coordinationScopes: {
        value: "C",
        color: "C",
      },
    },
  },
};

export function MultiCoordinationTypeExample() {
  const [config, setConfig] = React.useState<any>(initialConfig);
  return (
    <>
      <style>{`
        .colorful-slider-container {
          display: flex;
          flex-direction: row;
        }
        .colorful-slider-container select {
          max-height: 30px;
          margin-right: 10px;
        }
        .colorful-slider-view {
          margin: 5px;
          padding: 5px;
          border-radius: 10px;
        }
      `}</style>
      <ZodErrorBoundary>
        <ZodCmvProvider
          config={config}
          coordinationTypes={pluginCoordinationTypes}
          onConfigChange={setConfig}
        >
          <div className="colorful-slider-container">
            <ColorfulSliderInputContainer viewUid="view1" />
            <SelectScope config={config} viewUid="view1" onConfigChange={setConfig} cType="value" showType />
            <SelectScope config={config} viewUid="view1" onConfigChange={setConfig} cType="color" showType />
          </div>
          <div className="colorful-slider-container">
            <ColorfulSliderInputContainer viewUid="view2" />
            <SelectScope config={config} viewUid="view2" onConfigChange={setConfig} cType="value" showType />
            <SelectScope config={config} viewUid="view2" onConfigChange={setConfig} cType="color" showType />
          </div>
          <div className="colorful-slider-container">
            <ColorfulSliderInputContainer viewUid="view3" />
            <SelectScope config={config} viewUid="view3" onConfigChange={setConfig} cType="value" showType />
            <SelectScope config={config} viewUid="view3" onConfigChange={setConfig} cType="color" showType />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

