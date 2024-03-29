import React, { useRef, useEffect, useCallback } from 'react';
import { scaleLinear } from 'd3-scale';
import { scale as vega_scale } from 'vega-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';
import { select } from 'd3-selection';
import { useCoordinationScopes, useCoordinationL1, useCoordinationObject } from '@use-coordination/all';
import { useSelectBar, useUnselectBar } from './multilevel-example.js';

const scaleBand = vega_scale('band');

function MultiLevelD3BarPlot(props: any) {
  const {
    data,
    barSelection,
    setBarSelection,
    barColors,
    width = 360,
    height = 400,
    marginBottom = 60,
    marginLeft = 60,
    marginRight = 2,
    marginTop = 2,
  } = props;

  const svgRef = useRef(null);

  useEffect(() => {
    const domElement = svgRef.current;

    const svg = select(domElement);
    svg.selectAll('g').remove();
    svg
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('width', width)
      .attr('height', height);

    const yTitle = 'Frequency';
    const xTitle = 'Letter';

    const innerWidth = width - marginLeft;
    const innerHeight = height - marginBottom;

    const xScale = scaleBand()
      .range([marginLeft, width - marginRight])
      .domain(data.map((d: any) => d.letter))
      .padding(0.1);

    const yMax = max(data, (d: any) => d.frequency);

    const yScale = scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, marginTop]);

    // Bar areas
    g
      .selectAll('bar')
      .data(data)
      .enter()
        .append('rect')
          .attr('x', (d: any) => xScale(d.letter))
          .attr('y', (d: any) => yScale(d.frequency))
          .attr('width', xScale.bandwidth())
          .attr('height', (d: any) => innerHeight - yScale(d.frequency))
          .style('cursor', 'pointer')
          .style('fill', (d: any) => {
            const selectionColor = barColors?.[d.letter];
            return selectionColor || '#cccccc';
          })
          .on('click', (event: any, d: any) => {
            setBarSelection(d.letter);
          });
    
    // Y-axis ticks
    g
      .append('g')
        .attr('transform', `translate(${marginLeft},0)`)
      .call(axisLeft(yScale))
      .selectAll('text')
        .style('font-size', '11px');

    // X-axis ticks
    g
      .append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .style('font-size', '14px')
      .call(axisBottom(xScale))
      .selectAll('text')
        .style('font-size', '11px')
        .attr('dx', '-6px')
        .attr('dy', '6px')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // Y-axis title
    g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', -innerHeight / 2)
      .attr('y', 15)
      .attr('transform', 'rotate(-90)')
      .text(yTitle)
      .style('font-size', '12px')
      .style('fill', 'black');

    // X-axis title
    g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', marginLeft + innerWidth / 2)
      .attr('y', height - 15)
      .text(xTitle)
      .style('font-size', '12px')
      .style('fill', 'black');
  }, [width, height, data, marginLeft, marginBottom,
    marginTop, marginRight, barSelection,
  ]);

  return (
    <svg
      ref={svgRef}
      style={{
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
      }}
    />
  );
}

export function MultiLevelD3BarPlotView(props: any) {
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
    <MultiLevelD3BarPlot
      data={data}
      barSelection={barSelection}
      setBarSelection={setBarSelection}
      barColors={barColors}
    />
  )
}