import React, { useMemo, useRef, useEffect } from 'react';
import { scaleLinear, scaleOrdinal, scaleTime } from 'd3-scale';
import { scale as vega_scale } from 'vega-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import {
  extent,
} from 'd3-array';
import { select } from 'd3-selection';
import { useCoordination } from '@use-coordination/all';

function TimelinePlot(props: any) {
  const {
    data,
    maxTempSelection,
    setMaxTempSelection,
    precipitationSelection,
    setPrecipitationSelection,
    width = 360,
    height = 400,
    marginBottom = 60,
    marginLeft = 60,
    marginRight = 2,
    marginTop = 2,
  } = props;

  const svgRef = useRef(null);

  const innerWidth = width - marginLeft;
  const innerHeight = height - marginBottom;

  const [xScale, yScale] = useMemo(() => {
    if(!data) {
      return [null, null];
    }
    const yExtent = extent(data, (d: any) => d.temp_max);

    const yScaleInner = scaleLinear()
      .range([innerHeight, marginTop])
      .domain(yExtent);
    
    const xExtent = extent(data, (d: any) => d.date);

    // For the y domain, use the yMin prop
    // to support a use case such as 'Aspect Ratio',
    // where the domain minimum should be 1 rather than 0.
    const xScaleInner = scaleTime()
      .domain(xExtent)
      .range([marginLeft, width - marginRight]);
    
    return [xScaleInner, yScaleInner]
  }, [data]);

  useEffect(() => {
    const domElement = svgRef.current;

    const svg = select(domElement);
    svg.selectAll('g:not(.brush)').remove();
    svg
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .insert('g', 'g.brush')
      .attr('width', width)
      .attr('height', height);

    const yTitle = 'Max. Daily Temp. (c)';
    const xTitle = 'Date';

    if(!data) {
      return;
    }

    const colorScale = scaleOrdinal()
      .domain(['drizzle', 'fog', 'rain', 'snow', 'sun'])
      .range(['red', 'orange', 'green', 'blue', 'purple']);

    // Bar areas
    g
      .selectAll('point')
      .data(data)
      .enter()
        .append('circle')
          .attr('cx', (d: any) => xScale(d.date))
          .attr('cy', (d: any) => yScale(d.temp_max))
          .attr('r', 3)
          .style('opacity', (d: any) => {
            let inMaxTemp = true;
            let inPrecip = true;
            if(Array.isArray(maxTempSelection)) {
              inMaxTemp = d.temp_max >= maxTempSelection[0] && d.temp_max <= maxTempSelection[1];
            }
            if(Array.isArray(precipitationSelection)) {
              inPrecip = d.precipitation >= precipitationSelection[0] && d.precipitation <= precipitationSelection[1];
            }
            const isSelected = inMaxTemp && inPrecip;
            return isSelected ? 0.7 : 0.08;
          })
          .style('fill', (d: any) => {
            return colorScale(d.weather);
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

  }, [width, height, data, marginLeft, marginBottom, xScale, yScale,
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

export function TimelineView(props: any) {
  const {
    viewUid,
    data,
  } = props;
  const [
    { maxTempSelection, precipitationSelection },
    { setMaxTempSelection, setPrecipitationSelection },
  ] = useCoordination(viewUid, ["maxTempSelection", "precipitationSelection"]);

  return (
    <TimelinePlot
      data={data}
      maxTempSelection={maxTempSelection}
      setMaxTempSelection={setMaxTempSelection}
      precipitationSelection={precipitationSelection}
      setPrecipitationSelection={setPrecipitationSelection}
    />
  )
}