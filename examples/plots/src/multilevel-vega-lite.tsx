import React, { useMemo, useState, Suspense, useCallback } from 'react';
import { clamp } from 'lodash-es';
import { useCoordination, useCoordinationScopesL1, useCoordinationL1 } from '@use-coordination/all';
import { Vega, VisualizationSpec } from 'react-vega';

const DATASET_NAME = 'table';
const partialSpec = {
  mark: { type: 'bar', stroke: 'black', cursor: 'pointer' },
  params: [
    {
      name: 'highlight',
      select: {
        type: 'point',
        on: 'mouseover[event.shiftKey === false]',
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
        toggle: false,
      },
    },
    {
      name: 'shift_bar_select',
      select: {
        type: 'point',
        on: 'click[event.shiftKey]',
        fields: ['letter', 'isSelected'],
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
    fillOpacity: {
      field: 'isSelected',
      type: 'nominal',
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
      width = 400,
      height = 400,
      marginRight = 90,
      marginBottom = 60,
    } = props;

    const spec = useMemo(() => ({
      ...partialSpec,
      width: clamp(width - marginRight, 10, Infinity),
      height: clamp(height - marginBottom, 10, Infinity),
      data: { name: DATASET_NAME },
    }), [partialSpec]);

    
    const handleSignal = useCallback((name: any, value: any) => {
      if (name === 'bar_select') {
        setBarSelection(value.letter);
      } else if (name === 'shift_bar_select') {
        const newLetter = value.letter[0];
        // If the bar is already selected, remove it from the selection.
        // Otherwise, add it to the selection.
        if (barSelection.includes(newLetter)) {
          setBarSelection(barSelection.filter((letter: any) => letter !== newLetter));
        } else {
          setBarSelection([...barSelection, newLetter]);
        }
      }
    }, [barSelection]);

    const signalListeners = useMemo(() => ({
      bar_select: handleSignal,
      shift_bar_select: handleSignal
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
    data: dataProp,
  } = props;

  const selectionScopes = useCoordinationScopesL1(viewUid, "barSelection");
  const selectionCoordination = useCoordinationL1(viewUid, "barSelection", ["barColor", "barValue"]);

  console.log(selectionScopes, selectionCoordination);

  const barSelection = selectionScopes.map(scope => selectionCoordination[0][scope].barValue);
  const setBarSelection = () => {};

  const data = useMemo(() => {
    return dataProp.map((d: any) => ({
      ...d,
      isSelected: barSelection?.includes(d.letter),
    }));
  }, [dataProp, barSelection]);

  const selectBar = useSelectBarInMetaCoordinationScopes(); // TODO: define this hook and import
  const handleSelectBar = useCallback((letter: string) => {
    selectBar(viewUid, letter);
  }, [selectBar]);

  return (
    <MultiLevelVegaLitePlot
      data={data}
      barSelection={barSelection}
      setBarSelection={setBarSelection}
    />
  )
}