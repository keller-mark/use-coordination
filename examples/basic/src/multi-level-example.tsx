import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  useCoordinationScopes,
  useCoordinationL1,
} from '@use-coordination/all';
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

  // Support meta-coordination.

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
  const channelScopes = useCoordinationScopes(viewUid, "channel");
  const channelCoordination = useCoordinationL1(viewUid, "channel", ["channelValue"]);
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

const initialSpec = {
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
    }
  },
  viewCoordination: {
    view1: {
      coordinationScopes: {
        channel: ['R', 'G', 'B'],
      },
      coordinationScopesBy: {
        channel: {
          channelValue: {
            "R": "X",
            "G": "Y",
            "B": "Z",
          },
        },
      },
    },
    view2: {
      coordinationScopes: {
        channel: ['R', 'G', 'B'],
      },
      coordinationScopesBy: {
        channel: {
          channelValue: {
            "R": "X",
            "G": "Y",
            "B": "Z",
          },
        },
      },
    },
    view3: {
      coordinationScopes: {
        channel: ['R', 'G', 'B'],
      },
      coordinationScopesBy: {
        channel: {
          channelValue: {
            "R": "X",
            "G": "Y",
            "B": "Z",
          },
        },
      },
    },
    view4: {
      coordinationScopes: {
        channelValue: 'X',
      },
    },
    view5: {
      coordinationScopes: {
        channelValue: 'Y',
      },
    },
    view6: {
      coordinationScopes: {
        channelValue: 'Z',
      },
    },
  },
};

export function MultiLevelExample() {
  const [config, setConfig] = React.useState<any>(initialSpec);
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
        <ZodCoordinationProvider
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
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

