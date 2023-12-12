import React from 'react';
import {
  ZodCmvProvider,
  ZodErrorBoundary,
  useCoordination,
  useCoordinationProps,
  useCoordinationScopes,
} from '@mm-cmv/provider';
import * as Plugins from '@mm-cmv/plugins';
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

  const coordinationScopesRaw = useCoordinationProps(viewUid);
  // Support meta-coordination.
  const coordinationScopes = useCoordinationScopes(coordinationScopesRaw);

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

const NumericInput = ({
  sliderValue, 
  setSliderValue,
}: any) => {
  function handleChange(e: any) {
    setSliderValue(parseFloat(e.target.value));
  }
  return (
    <input type="number" min={0} max={1} step={0.01} value={sliderValue} onChange={handleChange} />
  );
}

const NumericInputContainer = ({
  viewUid,
}: any) => {

  const coordinationScopesRaw = useCoordinationProps(viewUid);
  // Support meta-coordination.
  const coordinationScopes = useCoordinationScopes(coordinationScopesRaw);

  const [{
    sliderValue,
  }, {
    setSliderValue,
  }] = useCoordination(['sliderValue'], coordinationScopes);
  return (
    <NumericInput
    sliderValue={sliderValue}
      setSliderValue={setSliderValue}
    />
  );
}



const pluginCoordinationTypes = [
  new Plugins.PluginCoordinationType('sliderValue', 0.75, z.number()),
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

export function CmvProviderExample(props: any) {
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

const initialConfig2 = {
  uid: 1,
  coordinationSpace: {
    "sliderValue": {
      "A": 0.5,
      "B": 0.75,
      "C": 0.25,
      "D": 0.1,
    }
  },
  viewCoordination: {
    view1: {
      coordinationScopes: {
        sliderValue: "A",
      },
    },
    view2: {
      coordinationScopes: {
        sliderValue: "A",
      },
    },
    view3: {
      coordinationScopes: {
        sliderValue: "B",
      },
    },
    view4: {
      coordinationScopes: {
        sliderValue: "B",
      },
    },
  },
};

export function MultiViewTypeExample(props: any) {
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
            <SelectScope config={config} viewUid="view1" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <NumericInputContainer viewUid="view2" />
            <SelectScope config={config} viewUid="view2" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <SliderInputContainer viewUid="view3" />
            <SelectScope config={config} viewUid="view3" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <NumericInputContainer viewUid="view4" />
            <SelectScope config={config} viewUid="view4" onConfigChange={setConfig} />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}

const initialMetaConfig = {
  uid: 1,
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

export function MetaCoordinationExample(props: any) {
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

