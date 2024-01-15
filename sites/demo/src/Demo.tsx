import React, { useRef, useMemo, useCallback } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { Typography, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { z } from 'zod';
import {
  ZodCmvProvider,
  ZodErrorBoundary,
  useCoordination,
} from '@use-coordination/all';

const initializationCounters = {};

const NavBarGrid = styled(Grid)`
  border-bottom: 1px solid gray;
` as typeof Grid;

function SelectScope(props: any) {
  const {
    config,
    viewUid,
    cType = "sliderValue",
    onConfigChange,
    showType = false,
  } = props;

  const allScopes = Object.keys(config.coordinationSpace[cType]);

  function handleChange(event: any) {
    const newScope = event.target.value;
    const newConfig = {
      ...config,
      key: config.key + 1,
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
      <label>{showType ? cType : "Coordination"} scope for {viewUid}:&nbsp;</label>
      <select onChange={handleChange} value={config.viewCoordination[viewUid].coordinationScopes[cType]} title={`select-${viewUid}`}>
        {allScopes.map((scope: any) => (
          <option key={scope} value={scope}>{scope}</option>
        ))}
      </select>
    </>
  )
}

const SliderInput = ({
  viewUid,
  sliderValue, 
  setSliderValue,
}: any) => {
  const onIncrement = useCallback(() => {
    setSliderValue(sliderValue + 1);
  }, [sliderValue, setSliderValue]);
  const onDecrement = useCallback(() => {
    setSliderValue(sliderValue - 1);
  }, [sliderValue, setSliderValue]);

  const renderCounter  = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  const initCounter = useMemo(() => {
    const initKey = `SliderInput-${viewUid}`;
    if(initializationCounters[initKey]) {
      initializationCounters[initKey] += 1;
    } else {
      initializationCounters[initKey] = 1;
    }
    return initializationCounters[initKey];
  }, [viewUid]);

  return (
    <>
      <span {...{ 'data-inits': initCounter, 'data-renders': renderCounter.current }}>SliderInput-{viewUid}&nbsp;</span>
      <button onClick={onIncrement}>increment-{viewUid}</button>
      <button onClick={onDecrement}>decrement-{viewUid}</button>
    </>
  );
}

const SliderInputContainer = ({
  viewUid,
}: any) => {
  const [{
    sliderValue,
  }, {
    setSliderValue,
  }] = useCoordination(viewUid, ['sliderValue']);

  const renderCounter  = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  const initCounter = useMemo(() => {
    const initKey = `SliderInputContainer-${viewUid}`;
    if(initializationCounters[initKey]) {
      initializationCounters[initKey] += 1;
    } else {
      initializationCounters[initKey] = 1;
    }
    return initializationCounters[initKey];
  }, [viewUid]);


  return (
    <>
      <span {...{ 'data-inits': initCounter, 'data-renders': renderCounter.current }}>SliderInputContainer-{viewUid}&nbsp;</span>
      <SliderInput
        viewUid={viewUid}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
      />
    </>
  );
}


const pluginCoordinationTypes = {
  sliderValue: z.number(),
};

const initialConfig = {
  key: 1,
  coordinationSpace: {
    "sliderValue": {
      "A": 1,
      "B": 20,
      "C": 300
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

function BaseExample() {
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

export default function Demo() {

  return (
    <>
      <CssBaseline />
      <Container>
        <NavBarGrid container spacing={1} alignItems="center">
          <Grid container xs={3} alignItems="center">
            <Grid xs={6}>
              <Typography sx={{ whiteSpace: 'nowrap' }}>use-coordination</Typography>
            </Grid>
          </Grid>
        </NavBarGrid>
      
        <BaseExample />
      </Container>
    </>
  );
}