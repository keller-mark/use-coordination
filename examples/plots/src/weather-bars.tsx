import React, { useRef, useEffect } from 'react';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { scale as vega_scale } from 'vega-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import {
  max,
  sum,
  rollup as d3_rollup,
} from 'd3-array';
import { select } from 'd3-selection';
import { useCoordination } from '@use-coordination/all';

const scaleBand = vega_scale('band');

function WeatherBars(props: any) {
  const {
    data,
    maxTempSelection,
    precipitationSelection,
    width = 200,
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

    const yTitle = 'Weather';
    const xTitle = 'Sum, precipitation';

    const innerWidth = width - marginLeft;
    const innerHeight = height - marginBottom;

    if(!data) {
      return;
    }

    const barData = d3_rollup(
      data,
      // Reducer
      (D: object[]) => sum(D, (d: any) => d.precipitation),
      // Groupby
      (d: any) => d.weather
    );

    const selectedBarData = d3_rollup(
      data.filter((d: any) => {
        let inMaxTemp = true;
        let inPrecip = true;
        if(Array.isArray(maxTempSelection)) {
          inMaxTemp = d.temp_max >= maxTempSelection[0] && d.temp_max <= maxTempSelection[1];
        }
        if(Array.isArray(precipitationSelection)) {
          inPrecip = d.precipitation >= precipitationSelection[0] && d.precipitation <= precipitationSelection[1];
        }
        return inMaxTemp && inPrecip;
      }),
      // Reducer
      (D: object[]) => sum(D, (d: any) => d.precipitation),
      // Groupby
      (d: any) => d.weather
    );

    const barKeys = (Array.from(barData.keys()) as any).toSorted();
    const yScale = scaleBand()
      .range([innerHeight, marginTop])
      .domain(barKeys)
      .padding(0.1);

    const xMax = max(Array.from(barData.values()));

    // For the y domain, use the yMin prop
    // to support a use case such as 'Aspect Ratio',
    // where the domain minimum should be 1 rather than 0.
    const xScale = scaleLinear()
      .domain([0, xMax])
      .range([marginLeft, width - marginRight]);
    
    const colorScale = scaleOrdinal()
      .domain(['drizzle', 'fog', 'rain', 'snow', 'sun'])
      .range(['#DD8442', '#F3BF44', '#56B184', '#4DACF1', '#DD8BEF']);

    // Bar areas
    g
      .selectAll('selected-bar')
      .data(Array.from(selectedBarData.entries()))
      .enter()
        .append('rect')
          .attr('x', (d: any) => xScale(0))
          .attr('y', (d: any) => yScale(d[0]))
          .attr('height', yScale.bandwidth())
          .attr('width', (d: any) => xScale(d[1]) - xScale(0))
          .style('fill', (d: any) => colorScale(d[0]))
          .style('opacity', 1.0);
    
    g
      .selectAll('bar')
      .data(Array.from(barData.entries()))
      .enter()
        .append('rect')
          .attr('x', (d: any) => xScale(0))
          .attr('y', (d: any) => yScale(d[0]))
          .attr('height', yScale.bandwidth())
          .attr('width', (d: any) => xScale(d[1]) - xScale(0))
          .style('fill', (d: any) => colorScale(d[0]))
          .style('opacity', 0.3);
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
    marginTop, marginRight, maxTempSelection, precipitationSelection,
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

export function WeatherBarsView(props: any) {
  const {
    viewUid,
    data,
  } = props;
  const [
    { maxTempSelection, precipitationSelection },
    { setMaxTempSelection, setPrecipitationSelection },
  ] = useCoordination(viewUid, ["maxTempSelection", "precipitationSelection"]);

  return (
    <WeatherBars
      data={data}
      maxTempSelection={maxTempSelection}
      setMaxTempSelection={setMaxTempSelection}
      precipitationSelection={precipitationSelection}
      setPrecipitationSelection={setPrecipitationSelection}
    />
  )
}