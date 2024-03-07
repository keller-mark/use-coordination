import React, { useMemo, useState, useRef, useEffect } from 'react';
import { scaleLinear } from 'd3-scale';
import { scale as vega_scale } from 'vega-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import {
  max,
} from 'd3-array';
import { select } from 'd3-selection';
import { useCoordination } from '@use-coordination/all';

const scaleBand = vega_scale('band');

function D3BarPlot(props: any) {
  const {
    data,
    barSelection,
    setBarSelection,
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

    // For the y domain, use the yMin prop
    // to support a use case such as 'Aspect Ratio',
    // where the domain minimum should be 1 rather than 0.
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
          .style('fill', (d: any) => {
            const isSelected = barSelection?.includes(d.letter);
            return isSelected ? 'rgba(0, 128, 0, 1.0)' : 'rgba(0, 128, 0, .3)';
          })
          .on('click', (event: any, d: any) => {
            setBarSelection([d.letter]);
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

export function D3BarPlotView(props: any) {
  const {
    viewUid,
    data,
  } = props;
  const [
    { barSelection },
    { setBarSelection },
  ] = useCoordination(viewUid, ["barSelection"]);

  return (
    <>
      <p className="plot-lib-title">D3</p>
      <D3BarPlot
        data={data}
        barSelection={barSelection}
        setBarSelection={setBarSelection}
      />
    </>
  )
}