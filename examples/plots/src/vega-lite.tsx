import React, { useMemo, useState, Suspense } from 'react';
import { clamp } from 'lodash-es';
import { useCoordination } from '@use-coordination/all';
import { Vega, VisualizationSpec } from 'react-vega';

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
        on: 'click[event.shiftKey === false]',
        fields: ['letter', 'isSelected'],
        empty: 'none',
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
    fillOpacity: {
      condition: {
        param: 'select',
        value: 1,
      },
      value: 0.3,
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

function VegaLitePlot(props: any) {
    const {
      viewUid,
      data,
      width = 500,
      height = 500,
      marginRight = 90,
      marginBottom = 120,
    } = props;

    const [
      { barSelection },
      { setBarSelection },
    ] = useCoordination(viewUid, ["barSelection"]);
    

    const spec = useMemo(() => ({
      ...partialSpec,
      width: clamp(width - marginRight, 10, Infinity),
      height: clamp(height - marginBottom, 10, Infinity),
      data: { name: DATASET_NAME },
    }), [partialSpec]);

    
    const handleSignal = (name: any, value: any) => {
      if (name === 'bar_select') {
        const isSelected = value.isSelected[0];
        setBarSelection(value.letter);
      }
    };
    const signalListeners = { bar_select: handleSignal, shift_bar_select: handleSignal };

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

export function VegaLitePlotView(props: any) {
  const {
    viewUid,
    data,
  } = props;
  const [
    { barSelection },
    { setBarSelection },
  ] = useCoordination(viewUid, ["barSelection"]);

  return (
    <VegaLitePlot
      data={data}
      barSelection={barSelection}
      onBarSelection={setBarSelection}
    />
  )
}