import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
} from '@use-coordination/all';
import { z } from 'zod';
import { NiivueCanvas, NVROptions, NVRVolume } from "./niivue-react/index.js";
import {useImmer} from "use-immer";

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
      crosshairPosX,
      crosshairPosY,
      crosshairPosZ,
      renderAzimuth,
      renderElevation,
    },
    {
      setCrosshairPosX,
      setCrosshairPosY,
      setCrosshairPosZ,
      setRenderAzimuth,
      setRenderElevation,
    },
  ] = useCoordination(viewUid, ['crosshairPosX', 'crosshairPosY', 'crosshairPosZ', 'renderAzimuth', 'renderElevation']);

  const [options, setOptions] = useImmer<NVROptions>({
    isOrientCube: true,
  });

  return (
    <div className="niivue-canvas">
      <NiivueCanvas
        options={options}
        volumes={Object.values(volumes)}
        crosshairPosX={crosshairPosX}
        setCrosshairPosX={setCrosshairPosX}
        crosshairPosY={crosshairPosY}
        setCrosshairPosY={setCrosshairPosY}
        crosshairPosZ={crosshairPosZ}
        setCrosshairPosZ={setCrosshairPosZ}
        renderAzimuth={renderAzimuth}
        setRenderAzimuth={setRenderAzimuth}
        renderElevation={renderElevation}
        setRenderElevation={setRenderElevation}
      />
    </div>
  );
}

const pluginCoordinationTypes = {
  crosshairPosX: z.number(),
  crosshairPosY: z.number(),
  crosshairPosZ: z.number(),
  renderAzimuth: z.number().nullable(),
  renderElevation: z.number(),
};

const initialSpec = {
  key: 1,
  coordinationSpace: {
    crosshairPosX: {
      "A": 0.6554589867591858
    },
    crosshairPosY: {
      "A": 0.3514062762260437,
      "B": 0.3514062762260437,
    },
    crosshairPosZ: {
      "A": 0.48532092571258545,
      "B": 0.48532092571258545,
    },
    renderAzimuth: {
      "A": 0.5,
    },
    renderElevation: {
      "A": 2,
      "B": 3,
    },
  },
  viewCoordination: {
    niivue1: {
      coordinationScopes: {
        crosshairPosX: "A",
        crosshairPosY: "A",
        crosshairPosZ: "A",
        renderAzimuth: "A",
        renderElevation: "A",
      },
    },
    niivue2: {
      coordinationScopes: {
        crosshairPosX: "A",
        crosshairPosY: "B",
        crosshairPosZ: "B",
        renderAzimuth: "A",
        renderElevation: "B",
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
