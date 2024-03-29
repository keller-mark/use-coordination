import React, { useMemo, useRef, useEffect } from 'react';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { scale as vega_scale } from 'vega-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import {
  max,
  extent,
} from 'd3-array';
import { brush as d3_brush } from 'd3-brush';
import { select } from 'd3-selection';
import { useCoordination } from '@use-coordination/all';

const compareNumbers = (a: number, b: number) => a - b;

function TempPrecipPlot(props: any) {
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
  const brushRef = useRef(null);

  const innerWidth = width - marginLeft;
  const innerHeight = height - marginBottom;

  const [xScale, yScale] = useMemo(() => {
    if(!data) {
      return [null, null];
    }
    const yMax = max(data, (d: any) => d.precipitation);

    const yScaleInner = scaleLinear()
      .range([innerHeight, marginTop])
      .domain([0, yMax]);

    const xExtent = extent(data, (d: any) => d.temp_max);

    // For the y domain, use the yMin prop
    // to support a use case such as 'Aspect Ratio',
    // where the domain minimum should be 1 rather than 0.
    const xScaleInner = scaleLinear()
      .domain(xExtent)
      .range([marginLeft, width - marginRight]);
    
    return [xScaleInner, yScaleInner]
  }, [data]);

  const brush = useMemo(() => {
    if(!xScale || !yScale) {
      return null;
    }
    const brushElement = brushRef.current;
    const brushG = select(brushElement);

    function onBrush(e: any) {
      // Check if there was a sourceEvent
      // (if not then this was triggered by brush.move)
      if(e.sourceEvent) {
        const [x1, y1] = e.selection[0];
        const [x2, y2] = e.selection[1];
        const rangeX = ([xScale.invert(x1), xScale.invert(x2)] as any).toSorted(compareNumbers);
        const rangeY = ([yScale.invert(y1), yScale.invert(y2)] as any).toSorted(compareNumbers);

        setMaxTempSelection(rangeX);
        setPrecipitationSelection(rangeY);
      }
    }
    // Brush handlers
    function onBrushEnd(e: any) {
      if(!e.selection) {
        setMaxTempSelection(null);
        setPrecipitationSelection(null);
      }
    }
    const brushInner = d3_brush()
      .extent([
        [marginLeft, marginTop],
        [width - marginRight, height - marginBottom],
      ])
      .on('brush', onBrush)
      .on('end', onBrushEnd);
    // Set up brushing
    brushG.call(brushInner);
    // TODO: prevent from initializing twice.
    return brushInner;
  }, [xScale, yScale]);

  useEffect(() => {
    if(!brush) {
      return;
    }
    const brushElement = brushRef.current;
    const brushG = select(brushElement);

    // Set the initial brush
    const [x1, x2] = (maxTempSelection ? [xScale(maxTempSelection[0]), xScale(maxTempSelection[1])] : xScale.range()).toSorted(compareNumbers);
    const [y1, y2] = (precipitationSelection ? [yScale(precipitationSelection[0]), yScale(precipitationSelection[1])] : yScale.range()).toSorted(compareNumbers);
    const initialSelection = [
      [x1, y1],
      [x2, y2],
    ];
    if(!maxTempSelection && !precipitationSelection) {
      brushG.call(brush.clear);
    } else {
      brushG.call(brush.move, initialSelection);
    }
  }, [brush, xScale, yScale, maxTempSelection, precipitationSelection])

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

    const yTitle = 'Precip. (in.)';
    const xTitle = 'Max. temp.';

    if(!data) {
      return;
    }

    const colorScale = scaleOrdinal()
      .domain(['drizzle', 'fog', 'rain', 'snow', 'sun'])
      .range(['#DD8442', '#F3BF44', '#56B184', '#4DACF1', '#DD8BEF']);

    
    const legendWidth = width / 4;
    const legendHeight = height / 3;
    const legendG = g.append('g')
      .attr('transform', `translate(${width - legendWidth},${marginTop + 20})`)
      .attr('width', legendWidth)
      .attr('height', legendHeight);

    legendG.append('text')
      .text('Weather')
      .style('font-size', '14px');
    
    const colorRectSize = 10;

    const legend = legendG
      .selectAll('legend')
      .data(colorScale.domain())
      .enter()
        .append('g')
        .attr('transform', (d: any, i: number) => `translate(4,${6 + i * (colorRectSize+4)})`);
    legend.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', colorRectSize)
          .attr('height', colorRectSize)
          .style('fill', (d: any) => colorScale(d));
    legend.append('text')
          .text((d: any) => d)
          .attr('x', colorRectSize + 5)
          .attr('y', colorRectSize / 2 + 4)
          .style('font-size', '12px');
      

    // Bar areas
    g
      .selectAll('point')
      .data(data)
      .enter()
        .append('circle')
          .attr('cx', (d: any) => xScale(d.temp_max))
          .attr('cy', (d: any) => yScale(d.precipitation))
          .attr('r', 3)
          .style('opacity', 0.5)
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
      .call(axisBottom(xScale));

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
    >
      <g className="brush" ref={brushRef}></g>
    </svg>
  );
}

export function TempPrecipView(props: any) {
  const {
    viewUid,
    data,
  } = props;
  const [
    { maxTempSelection, precipitationSelection },
    { setMaxTempSelection, setPrecipitationSelection },
  ] = useCoordination(viewUid, ["maxTempSelection", "precipitationSelection"]);

  return (
    <TempPrecipPlot
      data={data}
      maxTempSelection={maxTempSelection}
      setMaxTempSelection={setMaxTempSelection}
      precipitationSelection={precipitationSelection}
      setPrecipitationSelection={setPrecipitationSelection}
    />
  )
}