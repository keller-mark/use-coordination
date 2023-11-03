import React from 'react';
import { VitS, useCoordination, useCoordinationProps } from '@mm-cmv/vit-s';
import * as Plugins from '@mm-cmv/plugins';
import { z } from 'zod';

const MyPluginSlider = ({
  myCustomCoordinationType, 
  setMyCustomCoordinationType,
}: any) => {
  function handleChange(e: any) {

    setMyCustomCoordinationType(e.target.value);
  }
  return (
    <p>
      <input type="range" min={0} max={1} step={0.01} value={myCustomCoordinationType} onChange={handleChange} />
    </p>
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

const config = {
  coordinationSpace: {
    "myCustomCoordinationType": {
      "A": 0.5,
      "B": 0.75,
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
  initStrategy: "auto"
};




export function CmvProvider(props: any) {
  return (
    <>
      <VitS
        config={config}
        coordinationTypes={pluginCoordinationTypes}
      >
        <div style={{ height: '200px', width: '300px' }}>
          <MyPluginSliderSubscriber viewUid="slider1" />
        </div>
        <div style={{ height: '200px', width: '300px' }}>
          <MyPluginSliderSubscriber viewUid="slider2" />
        </div>
        <div style={{ height: '200px', width: '300px' }}>
          <MyPluginSliderSubscriber viewUid="slider3" />
        </div>
      </VitS> 
    </>
  );
}
