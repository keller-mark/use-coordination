import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineSpec,
} from '@use-coordination/all';
import { z } from 'zod';
import { NiivueCanvas, NVROptions, NVRVolume } from "./niivue-react/index.js";
import { useImmer } from "use-immer";

function NiivueView(props: any) {
  const {
    viewUid
  } = props;
  const [volumes, setVolumes] = useImmer<{[key: string]: NVRVolume}>({
    brain: {
      url: 'https://storage.googleapis.com/vitessce-demo-data/use-coordination/mni152.nii.gz',
    },
  });

  const [
    {
      crosshairX,
      crosshairY,
      crosshairZ,
      azimuth,
      elevation,
    },
    {
      setCrosshairX,
      setCrosshairY,
      setCrosshairZ,
      setAzimuth,
      setElevation,
    },
  ] = useCoordination(viewUid, ['crosshairX', 'crosshairY', 'crosshairZ', 'azimuth', 'elevation']);

  const [options, setOptions] = useImmer<NVROptions>({
    isOrientCube: true,
  });

  return (
    <div className="niivue-canvas">
      <NiivueCanvas
        options={options}
        volumes={Object.values(volumes)}
        crosshairPosX={crosshairX}
        setCrosshairPosX={setCrosshairX}
        crosshairPosY={crosshairY}
        setCrosshairPosY={setCrosshairY}
        crosshairPosZ={crosshairZ}
        setCrosshairPosZ={setCrosshairZ}
        renderAzimuth={azimuth}
        setRenderAzimuth={setAzimuth}
        renderElevation={elevation}
        setRenderElevation={setElevation}
      />
    </div>
  );
}

const pluginCoordinationTypes = {
  crosshairX: z.number(),
  crosshairY: z.number(),
  crosshairZ: z.number(),
  azimuth: z.number(),
  elevation: z.number(),
};

const initialSpec = defineSpec({
  key: 1,
  "coordinationSpace": {
    "crosshairX": {
      "A": 0.5084058046340942
    },
    "crosshairY": {
      "A": 0.3867500424385071,
      "B": 0.7817501425743103
    },
    "crosshairZ": {
      "A": 0.21622326970100403,
      "B": 0.43054866790771484
    },
    "azimuth": {
      "A": 216.5
    },
    "elevation": {
      "A": 27,
      "B": -10
    }
  },
  viewCoordination: {
    niivue1: {
      coordinationScopes: {
        crosshairX: "A",
        crosshairY: "A",
        crosshairZ: "A",
        azimuth: "A",
        elevation: "A",
      },
    },
    niivue2: {
      coordinationScopes: {
        crosshairX: "A",
        crosshairY: "B",
        crosshairZ: "B",
        azimuth: "A",
        elevation: "B",
      },
    },
  },
});

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
          margin-top: 10px;
        }
      `}</style>
      <ZodErrorBoundary>
        <ZodCoordinationProvider
          spec={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <div className="niivue-container">
            <NiivueView viewUid="niivue1" />
            <NiivueView viewUid="niivue2" />
          </div>
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
