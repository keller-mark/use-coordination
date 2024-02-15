import React, { useMemo, Suspense, useCallback } from 'react';
import { clamp } from 'lodash-es';
import { useCoordinationScopes, useCoordinationL1, useCoordinationObject } from '@use-coordination/all';
import { Vega, VisualizationSpec } from 'react-vega';
import { useSelectBar, useUnselectBar } from './multilevel-example.js';

const DATASET_NAME = 'table';
const partialSpec = {
  mark: { type: 'bar', stroke: 'black', cursor: 'pointer' },
  params: [
    {
      name: 'highlight',
      select: {
        type: 'point',
        on: 'mouseover',
      },
    },
    {
      name: 'select',
      select: 'point',
    },
    {
      name: 'bar_select',
      select: {
        type: 'point',
        on: 'click',
        fields: ['letter'],
        empty: 'none',
        toggle: false,
      },
    },
  ],
  encoding: {
    x: {
      field: 'letter',
      type: 'nominal',
      title: 'Letter',
    },
    y: {
      field: 'frequency',
      type: 'quantitative',
      title: 'Frequency',
    },
    tooltip: {
      field: 'frequency',
      type: 'quantitative',
    },
    color: {
      field: 'letter',
      type: 'nominal',
      scale: null,
      legend: null,
    },
    strokeWidth: {
      condition: [
        {
          param: 'select',
          empty: false,
          value: 1,
        },
        {
          param: 'highlight',
          empty: false,
          value: 2,
        },
      ],
      value: 0,
    },
  },
};

function MultiLevelVegaLitePlot(props: any) {
    const {
      data,
      barSelection,
      setBarSelection,
      barColors,
      width = 400,
      height = 400,
      marginRight = 90,
      marginBottom = 60,
    } = props;

    const spec = useMemo(() => ({
      ...partialSpec,
      encoding: {
        ...partialSpec.encoding,
        color: {
          ...partialSpec.encoding.color,
          scale: {
            domain: Object.keys(barColors)
              .concat(data.map((d: any) => d.letter).filter((letter: any) => !Object.keys(barColors).includes(letter))),
            range: Object.values(barColors)
              .concat(data.map((d: any) => d.letter).filter((letter: any) => !Object.keys(barColors).includes(letter)).map(() => '#cccccc')),
          },
        },
      },
      width: clamp(width - marginRight, 10, Infinity),
      height: clamp(height - marginBottom, 10, Infinity),
      data: { name: DATASET_NAME },
    }), [partialSpec, barColors, data]);

    
    const handleSignal = useCallback((name: any, value: any) => {
      if (name === 'bar_select') {
        setBarSelection(value.letter[0]);
      }
    }, [barSelection]);

    const signalListeners = useMemo(() => ({
      bar_select: handleSignal,
    }), [handleSignal]);

    const vegaComponent = useMemo(() => (
      // @ts-ignore
      <Vega
        spec={spec as VisualizationSpec}
        data={{
          [DATASET_NAME]: data,
        }}
        signalListeners={signalListeners}
        //tooltip={tooltipHandler}
        renderer="canvas"
        scaleFactor={3}
      />
    ), [spec, data, signalListeners]);

    return (
      spec && data && data.length > 0 ? (
        <Suspense fallback={<div>Loading...</div>}>
          {vegaComponent}
        </Suspense>
      ) : null
    );
}

export function MultiLevelVegaLitePlotView(props: any) {
  const {
    viewUid,
    data,
  } = props;

  const selectBar = useSelectBar();
  const unselectBar = useUnselectBar();

  const selectionScopes = useCoordinationScopes(viewUid, "barSelection");
  const selectionCoordination = useCoordinationL1(viewUid, "barSelection", ["barColor", "barValue"]);
  const selectionValues = useCoordinationObject(viewUid, "barSelection");

  const barSelection = selectionScopes.map(scope => selectionValues[scope]);
  const barColors = Object.fromEntries(selectionScopes.map(scope => ([
    selectionValues[scope],
    selectionCoordination[0][scope].barColor,
  ])));

  const setBarSelection = useCallback((letter: string) => {
    if(!barSelection?.includes(letter)) {
      selectBar(viewUid, letter);
    } else {
      unselectBar(viewUid, letter);
    }
  }, [selectBar, barSelection]);

  return (
    <MultiLevelVegaLitePlot
      data={data}
      barSelection={barSelection}
      setBarSelection={setBarSelection}
      barColors={barColors}
    />
  );
}