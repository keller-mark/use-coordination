import React from 'react';
import Plot from 'react-plotly.js';
import { useCoordination } from '@use-coordination/all';

function PlotlyBarPlot(props: any) {
  const {
    data,
    barSelection,
    setBarSelection,
    width = 450,
    height = 500,
    marginBottom = 60,
    marginLeft = 60,
    marginRight = 2,
    marginTop = 0,
  } = props;

  return (
    <Plot.default
      data={[
        {
          type: 'bar',
          x: data.map((d: any) => d.letter),
          y: data.map((d: any) => d.frequency),
          marker: {
            color: data.map((d: any) => barSelection?.includes(d.letter) ? 'BlueViolet' : 'plum'),
          },
        },
      ]}
      layout={{
        width,
        height,
        margin: {
          t: marginTop,
          b: marginBottom,
        },
        xaxis: {
          title: {
            text: 'Letter',
            standoff: 0,
          },
          nticks: data?.length,
          tickangle: 0,
        },
        yaxis: {
          title: 'Frequency',
        },
      }}
      onClick={(e: any) => {
        if(e?.points?.[0]?.pointIndex) {
          setBarSelection([data[e.points[0].pointIndex].letter]);
        } else {
          setBarSelection([]);
        }
      }}
    />
  );
}

export function PlotlyBarPlotView(props: any) {
  const {
    viewUid,
    data,
  } = props;
  const [
    { barSelection },
    { setBarSelection },
  ] = useCoordination(viewUid, ["barSelection"]);

  return (
    <PlotlyBarPlot
      data={data}
      barSelection={barSelection}
      setBarSelection={setBarSelection}
    />
  )
}