import React from 'react';
import {
  ZodCmvProvider,
  ZodErrorBoundary,
  useCoordination,
  useCoordinationScopesL1,
  useCoordinationL1,
} from '@mm-cmv/all';
import { z } from 'zod';
import { SelectScope } from './example-utils.js';

// Reference: https://stackoverflow.com/a/5624139
function rgbToHex(r: number, g: number, b: number) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

const SliderInput = ({
  sliderValue, 
  setSliderValue,
}: any) => {
  function handleChange(e: any) {
    setSliderValue(parseFloat(e.target.value));
  }
  return (
    <input type="range" min={0} max={255} step={1} value={sliderValue} onChange={handleChange} />
  );
}

const SliderInputContainer = ({
  viewUid,
}: any) => {
  const [{
    channelValue,
  }, {
    setChannelValue,
  }] = useCoordination(viewUid, ['channelValue']);
  return (
    <SliderInput
      sliderValue={channelValue}
      setSliderValue={setChannelValue}
    />
  );
}

const ChannelSlider = ({
  channelCoordination,
  setChannelCoordination,
}: any) => {

  const {
    channelValue
  } = channelCoordination;
  const {
    setChannelValue
  } = setChannelCoordination;

  function handleValueChange(e: any) {
    setChannelValue(parseFloat(e.target.value));
  }

  return (
    <input
      type="range" min={0} max={255} step={1}
      value={channelValue}
      onChange={handleValueChange}
    />
)
}

const ColorfulSliderInput = ({
  channelScopes,
  channelCoordination,
}: any) => {

  const color = channelScopes.map((scopeName: string) => channelCoordination[0][scopeName]["channelValue"]);
  const hexColor = rgbToHex(color[0], color[1], color[2]);
  return (
    <div style={{ border: `5px solid ${hexColor}` }} className="colorful-slider-view">
      {channelScopes.map((scopeName: string) => (
        <ChannelSlider
          key={scopeName}
          channelCoordination={channelCoordination[0][scopeName]}
          setChannelCoordination={channelCoordination[1][scopeName]}
        />
      ))}
    </div>
  );
}

const ColorfulSliderInputContainer = ({
  viewUid,
}: any) => {

  // Support meta-coordination.
  const channelScopes = useCoordinationScopesL1(viewUid, "channel");
  const channelCoordination = useCoordinationL1(viewUid, "channel", [
    "channelValue"
  ]);


  return (
    <ColorfulSliderInput
      channelScopes={channelScopes}
      channelCoordination={channelCoordination}
    />
  );
}

const pluginCoordinationTypes = {
  channel: z.literal('__dummy__'),
  channelValue: z.number(),
};

const initialConfig = {
  key: 1,
  coordinationSpace: {
    "channel": {
      "R": "__dummy__",
      "G": "__dummy__",
      "B": "__dummy__",
    },
    "channelValue": {
      "X": 128,
      "Y": 128,
      "Z": 255,
    },
    metaCoordinationScopes: {
      A: {
        channel: ['R', 'G', 'B'],
      },
      B: {
        channelValue: 'X',
      },
      C: {
        channelValue: 'Y',
      },
      D: {
        channelValue: 'Z',
      }
    },
    metaCoordinationScopesBy: {
      A: {
        channel: {
          channelValue: {
            "R": "X",
            "G": "Y",
            "B": "Z",
          },
        },
      }
    },
  },
  viewCoordination: {
    view1: {
      coordinationScopes: {
        metaCoordinationScopes: ['A'],
        metaCoordinationScopesBy: ['A'],
      },
    },
    view2: {
      coordinationScopes: {
        metaCoordinationScopes: ['A'],
        metaCoordinationScopesBy: ['A'],
      },
    },
    view3: {
      coordinationScopes: {
        metaCoordinationScopes: ['A'],
        metaCoordinationScopesBy: ['A'],
      },
    },
    view4: {
      coordinationScopes: {
        metaCoordinationScopes: ['B'],
      },
    },
    view5: {
      coordinationScopes: {
        metaCoordinationScopes: ['C'],
      },
    },
    view6: {
      coordinationScopes: {
        metaCoordinationScopes: ['D'],
      },
    },
  },
};

export function MetaMultiLevelExample() {
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
          </div>
          <div className="colorful-slider-container">
            <ColorfulSliderInputContainer viewUid="view2" />
          </div>
          <div className="colorful-slider-container">
            <ColorfulSliderInputContainer viewUid="view3" />
          </div>
          <div className="colorful-slider-container">
            <SliderInputContainer viewUid="view4" />
          </div>
          <div className="colorful-slider-container">
            <SliderInputContainer viewUid="view5" />
          </div>
          <div className="colorful-slider-container">
            <SliderInputContainer viewUid="view6" />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

