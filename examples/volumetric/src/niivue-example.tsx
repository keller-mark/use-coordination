import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
} from '@use-coordination/all';
import { z } from 'zod';
import { NiivueCanvas, NVROptions, NVRVolume } from "./niivue-react/index.js";
import {useImmer} from "use-immer";

function ReadmeExample() {
  const [volumes, setVolumes] = useImmer<{[key: string]: NVRVolume}>({
    brain: {
      url: 'https://storage.googleapis.com/vitessce-demo-data/use-coordination/mni152.nii.gz',
    },
  });
  const [options, setOptions] = useImmer<NVROptions>({
    isOrientCube: true,
    onLocationChange: console.log
  });

  const setOpacity = (value: number) => {
    setVolumes((draft) => {
      draft.brain.opacity = value;
    });
  };

  const setOrientCube = (value: boolean) => {
    setOptions((draft) => {
      draft.isOrientCube = !value;
    });
  };

  return (<>
    <div>
      <label>
        Show Orient Cube
        <input
          type="checkbox"
          onChange={(e) => setOrientCube(!e.target.checked)}
          checked={options.isOrientCube}
        />
      </label>
      <label>
        Brain Opacity
        <input
          type="range" min="0.0" max="1.0" step="0.1"
          onChange={(e: any) => setOpacity(e.target.value)}
          value={volumes.brain.opacity}
        />
      </label>
    </div>
    <div className="niivue-canvas">
      <NiivueCanvas options={options} volumes={Object.values(volumes)} onChanged={console.log} />
    </div>
  </>);
}

const pluginCoordinationTypes = {
  sliderValue: z.number(),
};

const initialSpec = {
  key: 1,
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

export function NiivueExample() {
  const [spec, setSpec] = React.useState<any>(initialSpec);
  return (
    <>
      <style>{`
        .niivue-container {
          width: 100%;
        }
        .niivue-container .niivue-canvas {
          height: 200px;
          width: 100%;
          margin: 0;
        }
      `}</style>
      <ZodErrorBoundary>
        <ZodCoordinationProvider
          spec={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <div className="niivue-container">
            <ReadmeExample />
          </div>
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
