import React from 'react';
import { ZodCmvProvider, useCoordination, useCoordinationProps } from '@mm-cmv/provider';
import * as Plugins from '@mm-cmv/plugins';
import { z } from 'zod';

const MyPluginSlider = ({
  myCustomCoordinationType, 
  setMyCustomCoordinationType,
}: any) => {
  function handleChange(e: any) {
    setMyCustomCoordinationType(parseFloat(e.target.value));
  }
  return (
    <input type="range" min={0} max={1} step={0.01} value={myCustomCoordinationType} onChange={handleChange} />
  );
}

const MyPluginSliderSubscriber = ({
  viewUid,
}: any) => {

  const coordinationScopes = useCoordinationProps(viewUid);

  const [{
    myCustomCoordinationType,
  }, {
    setMyCustomCoordinationType,
  }] = useCoordination(
    [
      'myCustomCoordinationType',
    ],
    coordinationScopes,
  );
  return (
    <MyPluginSlider
      myCustomCoordinationType={myCustomCoordinationType}
      setMyCustomCoordinationType={setMyCustomCoordinationType}
    />
  );
}

const pluginCoordinationTypes = [
  new Plugins.PluginCoordinationType('myCustomCoordinationType', 0.75, z.number()),
];

const initialConfig = {
  uid: 1,
  coordinationSpace: {
    "myCustomCoordinationType": {
      "A": 0.5,
      "B": 0.75,
      "C": 0.25
    }
  },
  viewCoordination: {
    slider1: {
      coordinationScopes: {
        myCustomCoordinationType: "B",
      },
    },
    slider2: {
      coordinationScopes: {
        myCustomCoordinationType: "A",
      },
    },
    slider3: {
      coordinationScopes: {
        myCustomCoordinationType: "A",
      },
    },
  },
};

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: { message: any; name: any; }) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, name: error.name, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <h1>{this.state.name}</h1>
          <pre>{this.state.message}</pre>
        </>
      );
    }

    return this.props.children;
  }
}

function SelectScope(props: any) {
  const {
    config,
    viewUid,
    cType = "myCustomCoordinationType",
    onConfigChange,
  } = props;

  const allScopes = Object.keys(config.coordinationSpace[cType]);

  function handleChange(event: any) {
    const newScope = event.target.value;
    const newConfig = {
      ...config,
      uid: config.uid + 1,
      viewCoordination: {
        ...config.viewCoordination,
        [viewUid]: {
          ...config.viewCoordination[viewUid],
          coordinationScopes: {
            ...config.viewCoordination[viewUid].coordinationScopes,
            [cType]: newScope,
          },
        },
      },
    };
    onConfigChange(newConfig)
  }

  return (
    <>
      <label>Coordination scope for {viewUid}:&nbsp;</label>
      <select onChange={handleChange} value={config.viewCoordination[viewUid].coordinationScopes[cType]}>
        {allScopes.map((scope: any) => (
          <option key={scope} value={scope}>{scope}</option>
        ))}
      </select>
    </>
  )
}

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
      <ErrorBoundary>
        <ZodCmvProvider
          config={config}
          coordinationTypes={pluginCoordinationTypes}
          onConfigChange={setConfig}
        >
          <div className="slider-container">
            <MyPluginSliderSubscriber viewUid="slider1" />
            <SelectScope config={config} viewUid="slider1" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <MyPluginSliderSubscriber viewUid="slider2" />
            <SelectScope config={config} viewUid="slider2" onConfigChange={setConfig} />
          </div>
          <div className="slider-container">
            <MyPluginSliderSubscriber viewUid="slider3" />
            <SelectScope config={config} viewUid="slider3" onConfigChange={setConfig} />
          </div>
        </ZodCmvProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ErrorBoundary>
    </>
  );
}
