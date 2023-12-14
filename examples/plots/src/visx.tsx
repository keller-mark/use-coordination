import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { LetterFrequency } from '@visx/mock-data/lib/mocks/letterFrequency';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { useCoordination } from '@use-coordination/all';

const getLetter = (d: LetterFrequency) => d.letter;
const getLetterFrequency = (d: LetterFrequency) => Number(d.frequency);

function VisxPlot(props: any) {
  const {
    data,
    barSelection,
    onBarSelection,
    width = 500,
    height = 500,
    marginBottom = 60,
    marginLeft = 60,
    marginRight = 2,
    marginTop = 2,
  } = props;

  const verticalMargin = marginTop + marginBottom;
  const horizontalMargin = marginLeft + marginRight;

  // bounds
  const xMax = width - horizontalMargin;
  const yMax = height - verticalMargin;

  // scales, memoize for performance
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        range: [marginLeft, width - marginRight],
        round: true,
        domain: data.map(getLetter),
        padding: 0.4,
      }),
    [xMax],
  );
  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, marginBottom],
        round: true,
        domain: [0, Math.max(...data.map(getLetterFrequency))],
      }),
    [yMax],
  );


  return (
    <svg width={width} height={height}>
      <rect width={width} height={height} fill="url(#teal)" rx={14} />
      <Group top={verticalMargin / 2}>
        {data.map((d: any) => {
          const letter = getLetter(d);
          const barWidth = xScale.bandwidth();
          const barHeight = yMax - (yScale(getLetterFrequency(d)) ?? 0);
          const barX = xScale(letter);
          const barY = yMax - barHeight;
          return (
            <Bar
              key={`bar-${letter}`}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill="rgba(23, 233, 217, .5)"
              onClick={() => {
                // if (events) alert(`clicked: ${JSON.stringify(Object.values(d))}`);
              }}
            />
          );
        })}
        <AxisLeft
          scale={yScale}
          left={marginLeft}
          label="Frequency"
        />
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={data.length}
          label="Letter"
        />
      </Group>
    </svg>
  );
}

export function VisxPlotView(props: any) {
  const {
    viewUid,
    data,
  } = props;

  const [
    { barSelection },
    { setBarSelection },
  ] = useCoordination(viewUid, ["barSelection"]);

  return (
    <VisxPlot
      data={data}
      barSelection={barSelection}
      onBarSelection={setBarSelection}
    />
  );
}
