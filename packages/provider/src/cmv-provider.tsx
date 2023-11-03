import React from 'react';
import { VitS, useCoordination, TitleInfo } from '@mm-cmv/vit-s';
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
  coordinationScopes,
  removeGridComponent,
  theme,
  title = 'My plugin slider',
}: any) => {
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
    <TitleInfo title={title} theme={theme} removeGridComponent={removeGridComponent} isReady >
      <MyPluginSlider
        myCustomCoordinationType={myCustomCoordinationType}
        setMyCustomCoordinationType={setMyCustomCoordinationType}
      />
    </TitleInfo>
  );
}


const pluginCoordinationTypes = [
  new Plugins.PluginCoordinationType('myCustomCoordinationType', 0.75, z.number()),
];
const pluginViewTypes = [
  new Plugins.PluginViewType('myCustomSlider', MyPluginSliderSubscriber, ['myCustomCoordinationType']),
  //new Plugins.PluginViewType('description', Description.DescriptionSubscriber, ['dataset']),
];

const config = {
  name: "test",
  description: "This is a test of using vit-s with plugin views and coordination types!",
  version: "1.0.16",
  datasets: [
    {
      uid: "my-dataset",
      name: "My dataset",
      files: [],
    }
  ],
  coordinationSpace: {
    "myCustomCoordinationType": {
      "A": 0.5,
      "B": 0.75,
    }
  },
  layout: [
    {
      component: "myCustomSlider",
      coordinationScopes: {
        myCustomCoordinationType: "B",
      },
      x: 0, y: 6, w: 6, h: 6
    },
    {
      component: "myCustomSlider",
      coordinationScopes: {
        myCustomCoordinationType: "A",
      },
      x: 6, y: 0, w: 6, h: 6
    },
    {
      component: "myCustomSlider",
      coordinationScopes: {
        myCustomCoordinationType: "A",
      },
      x: 6, y: 6, w: 6, h: 6
    }
  ],
  initStrategy: "auto"
};


export function CmvProvider(props: any) {
  return (
    <>
      <p>
        mmCMV provider
      </p>
      <VitS
        config={config}
        height={400}
        theme="light"
        viewTypes={pluginViewTypes}
        coordinationTypes={pluginCoordinationTypes}
      /> 
    </>
  );
}
