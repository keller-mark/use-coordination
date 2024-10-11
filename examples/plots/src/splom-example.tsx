import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineSpec,
} from '@use-coordination/all';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { set, z } from 'zod';
import { csv } from 'd3-fetch';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { brush as d3_brush } from 'd3-brush';
import { extent } from 'd3-array';
import Plot from 'react-plotly.js';

const compareNumbers = (a: number, b: number) => a - b;

const baseUrl = 'https://storage.googleapis.com/vitessce-demo-data/use-coordination/penguins.csv';

type PenguinRow = {
  species: 'Adelie' | 'Chinstrap' | 'Gentoo',
  bill_length_mm: number,
  bill_depth_mm: number,
  flipper_length_mm: number,
  body_mass_g: number,
};

const colors = {
    "Adelie": [37, 118, 176],
    "Chinstrap": [252, 129, 46],
    "Gentoo": [54, 159, 60],
};

const dims: [string, string, string, string] = [
    "bill_length_mm",
    "bill_depth_mm",
    "flipper_length_mm",
    "body_mass_g",
];

const pluginCoordinationTypes = {
  dimX: z.enum(dims),
  dimY: z.enum(dims),
  selectionDimX: z.enum(dims).nullable(),
  selectionDimY: z.enum(dims).nullable(),
  selectionRangeX: z.array(z.number()).length(2).nullable(),
  selectionRangeY: z.array(z.number()).length(2).nullable(),
};

const initialSpec = defineSpec({
  key: 1,
  coordinationSpace: {
    "dimX": {
      "x0": "bill_length_mm",
      "x1": "bill_depth_mm",
      "x2": "flipper_length_mm",
      "x3": "body_mass_g",
    },
    "dimY": {
      "y0": "bill_length_mm",
      "y1": "bill_depth_mm",
      "y2": "flipper_length_mm",
      "y3": "body_mass_g",
    },
    "selectionDimX": {
      "sx0": null,
    },
    "selectionDimY": {
      "sy0": null,
    },
    "selectionRangeX": {
      "sx0": null,
    },
    "selectionRangeY": {
      "sy0": null,
    },
  },
  viewCoordination: {
    x0y0: {
      coordinationScopes: {
        dimX: "x0",
        dimY: "y0",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x0y1: {
      coordinationScopes: {
        dimX: "x0",
        dimY: "y1",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x0y2: {
      coordinationScopes: {
        dimX: "x0",
        dimY: "y2",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x0y3: {
      coordinationScopes: {
        dimX: "x0",
        dimY: "y3",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x1y0: {
      coordinationScopes: {
        dimX: "x1",
        dimY: "y0",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x1y1: {
      coordinationScopes: {
        dimX: "x1",
        dimY: "y1",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x1y2: {
      coordinationScopes: {
        dimX: "x1",
        dimY: "y2",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x1y3: {
      coordinationScopes: {
        dimX: "x1",
        dimY: "y3",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x2y0: {
      coordinationScopes: {
        dimX: "x2",
        dimY: "y0",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x2y1: {
      coordinationScopes: {
        dimX: "x2",
        dimY: "y1",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x2y2: {
      coordinationScopes: {
        dimX: "x2",
        dimY: "y2",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x2y3: {
      coordinationScopes: {
        dimX: "x2",
        dimY: "y3",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x3y0: {
      coordinationScopes: {
        dimX: "x3",
        dimY: "y0",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x3y1: {
      coordinationScopes: {
        dimX: "x3",
        dimY: "y1",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x3y2: {
      coordinationScopes: {
        dimX: "x3",
        dimY: "y2",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
    x3y3: {
      coordinationScopes: {
        dimX: "x3",
        dimY: "y3",
        selectionDimX: "sx0",
        selectionDimY: "sy0",
        selectionRangeX: "sx0",
        selectionRangeY: "sy0",
      },
    },
  },
});

function usePenguinsData() {
  return useQuery({
    queryKey: ['penguins'],
    queryFn: async () => {
      return (await csv(baseUrl)).map((row: any) => ({
        ...row,
        bill_depth_mm: +row.bill_depth_mm,
        bill_length_mm: +row.bill_length_mm,
        body_mass_g: +row.body_mass_g,
        flipper_length_mm: +row.flipper_length_mm,
      }));
    }
  });
}

function usePlotData(dimX: string, dimY: string) {
  const { data, isLoading, isSuccess } = usePenguinsData();
  return useQuery({
    enabled: !isLoading && isSuccess,
    queryKey: ['penguins', 'plotData', dimX, dimY],
    queryFn: async () => {
      return data.map((d: any) => ({
        ...d,
        x: d[dimX],
        y: d[dimY],
      }));
    }
  });
}

function useScale(dimName: string, range: [number, number]) {
  const { data, isLoading, isSuccess } = usePenguinsData();
  return useQuery({
    enabled: !isLoading && isSuccess,
    queryKey: ['penguins', 'scale', dimName, range],
    queryFn: async () => {
      const valExtent = extent(data, (d: any) => d[dimName]);
      return scaleLinear()
        .domain(valExtent)
        .range(range);
    }
  });
}

function useSelectedPlotData(selectionDimX: string, selectionDimY: string, selectionRangeX: [number, number], selectionRangeY: [number, number]) {
  const { data, isLoading, isSuccess } = usePenguinsData();
  return useQuery({
    enabled: !isLoading && isSuccess,
    queryKey: ['penguins', 'selectedPlotData', selectionDimX, selectionDimY, selectionRangeX, selectionRangeY],
    queryFn: async () => {
      return data.map((d: any) => ({
        ...d,
        inSelection: (
          (selectionDimX && selectionRangeX && d[selectionDimX] >= selectionRangeX[0] && d[selectionDimX] <= selectionRangeX[1]) &&
          (selectionDimY && selectionRangeY && d[selectionDimY] >= selectionRangeY[0] && d[selectionDimY] <= selectionRangeY[1])
        ),
      }));
    }
  });
}



function D3Scatterplot(props: any) {
  const {
    viewUid,
    width = 250,
    height = 250,
    marginLeft = 25,
    marginBottom = 25,
    marginRight = 10,
    marginTop = 10,
  } = props;

  const svgRef = React.useRef(null);
  const brushRef = useRef(null);

  const [{
    dimX,
    dimY,
    selectionDimX,
    selectionDimY,
    selectionRangeX,
    selectionRangeY,
  }, {
    setSelectionDimX,
    setSelectionDimY,
    setSelectionRangeX,
    setSelectionRangeY,
  }] = useCoordination(viewUid, [
    "dimX",
    "dimY",
    "selectionDimX",
    "selectionDimY",
    "selectionRangeX",
    "selectionRangeY",
  ]);

  const setBrushSelection = useCallback((rangeX: null|[number, number], rangeY: null|[number, number]) => {
    setSelectionRangeX(rangeX);
    setSelectionRangeY(rangeY);
    setSelectionDimX(dimX);
    setSelectionDimY(dimY);
  }, []);

  const xBrushSelection = (selectionRangeX && selectionDimX === dimX) ? selectionRangeX : null;
  const yBrushSelection = (selectionRangeY && selectionDimY === dimY) ? selectionRangeY : null;

  const { data: plotData } = usePlotData(dimX, dimY);
  const { data: xScale } = useScale(dimX, [marginLeft, width - marginLeft]);
  const { data: yScale } = useScale(dimY, [height-marginBottom, 0]);
  const { data: selectedPlotData } = useSelectedPlotData(selectionDimX, selectionDimY, selectionRangeX, selectionRangeY);
  
  const brush = useMemo(() => {
    if(!xScale || !yScale) {
      return null;
    }
    console.log("create brush", dimX, dimY)
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
        
        setBrushSelection(rangeX, rangeY);
      }
    }
    // Brush handlers
    function onBrushEnd(e: any) {
      if(selectionRangeX !== null && selectionRangeY !== null && e.sourceEvent && !e.selection) {
        setBrushSelection(null, null);
      }
    }
    const brushInner = d3_brush()
      .extent([
        [marginLeft, 0],
        [width - 0, height - marginBottom],
      ])
      .on('brush', onBrush)
      .on('end', onBrushEnd);
    // Set up brushing
    brushG.call(brushInner);
    return brushInner;
  }, [xScale, yScale]);

  useEffect(() => {
    if(!brush) {
      return;
    }
    const brushElement = brushRef.current;
    const brushG = select(brushElement);

    // Set the initial brush
    const [x1, x2] = (xBrushSelection ? [xScale(xBrushSelection[0]), xScale(xBrushSelection[1])] : xScale.range()).toSorted(compareNumbers);
    const [y1, y2] = (yBrushSelection ? [yScale(yBrushSelection[0]), yScale(yBrushSelection[1])] : yScale.range()).toSorted(compareNumbers);
    const initialSelection = [
      [x1, y1],
      [x2, y2],
    ];
    if(!xBrushSelection && !yBrushSelection) {
      brushG.call(brush.clear);
    } else {
      brushG.call(brush.move, initialSelection);
    }
  }, [brush, xScale, yScale, xBrushSelection, yBrushSelection]);


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

    if(!plotData) {
      return;
    }

    const xAxisTicks = g.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .style('font-size', '10px')
      .call(axisBottom(xScale));
    const yAxisTicks = g.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .style('font-size', '10px')
      .call(axisLeft(yScale));

    const xAxisTitle = g.append('text')
      .attr('x', width/2)
      .attr('y', height - 30)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(dimX);
    
    const yAxisTitle = g.append('text')
      .attr('x', -height/2)
      .attr('y', 38)
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(dimY);
    
    const circles = g.selectAll('circle')
      .data(plotData)
      .enter()
      .append('circle')
      .attr('cx', (d: any) => xScale(d.x))
      .attr('cy', (d: any) => yScale(d.y))
      .attr('r', (d: any) => d.inSelection ? 5 : 2)
      .attr('fill', (d: PenguinRow) => `rgba(${colors[d.species][0]},${colors[d.species][1]},${colors[d.species][2]},0.5)`)
  }, [svgRef, width, height, plotData, xScale, yScale]);

  useEffect(() => {
    if(!selectedPlotData) {
      return;
    }
    const domElement = svgRef.current;
    const svg = select(domElement);
    const circles = svg.selectAll('circle')
      .data(selectedPlotData)
      .attr('r', (d: any) => d.inSelection ? 5 : 2)
  }, [selectedPlotData]);

  return (
    <svg
      className="splom-scatterplot"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      ref={svgRef}
    >
      <g className="brush" ref={brushRef}></g>
    </svg>
  )
}

function PlotlyScatterplot(props: any) {
  const {
    viewUid,
    width = 250,
    height = 250,
    marginBottom = 25,
    marginLeft = 25,
    marginRight = 25,
    marginTop = 1,
  } = props;

  const [isSelecting, setIsSelecting] = useState(false);

  const [{
    dimX,
    dimY,
    selectionDimX,
    selectionDimY,
    selectionRangeX,
    selectionRangeY,
  }, {
    setSelectionDimX,
    setSelectionDimY,
    setSelectionRangeX,
    setSelectionRangeY,
  }] = useCoordination(viewUid, [
    "dimX",
    "dimY",
    "selectionDimX",
    "selectionDimY",
    "selectionRangeX",
    "selectionRangeY",
  ]);

  const setBrushSelection = useCallback((rangeX: null|[number, number], rangeY: null|[number, number]) => {
    setSelectionRangeX(rangeX);
    setSelectionRangeY(rangeY);
    setSelectionDimX(dimX);
    setSelectionDimY(dimY);
  }, []);

  const { data: plotData } = usePlotData(dimX, dimY);
  const { data: xScale } = useScale(dimX, [0, 1]);
  const { data: yScale } = useScale(dimY, [1, 0]);
  const xDomain = xScale?.domain();
  const yDomain = yScale?.domain();
  const { data: selectedPlotData } = useSelectedPlotData(selectionDimX, selectionDimY, selectionRangeX, selectionRangeY);

  const onSelecting = useCallback((e: any) => {
    setIsSelecting(true);
    if(e?.range?.x && e?.range?.y) {
      setBrushSelection(e.range.x, e.range.y);
    }
  }, []);

  const onSelected = useCallback((e: any) => {
    if(isSelecting) {
      if(e?.range?.x && e?.range?.y) {
        setBrushSelection(e.range.x, e.range.y);
      } else if(!e) {
        setBrushSelection(null, null);
      }
    }
    setIsSelecting(false);
  }, [isSelecting]);

  const selections = useMemo(() => {
    const [xBrushSelection, yBrushSelection] = ([
      (selectionRangeX && selectionDimX === dimX) ? selectionRangeX : null,
      (selectionRangeY && selectionDimY === dimY) ? selectionRangeY : null,
    ]);
    return xBrushSelection || yBrushSelection ? ([
      {
        type: 'rect',
        x0: xBrushSelection ? xBrushSelection[0] : xDomain[0],
        x1: xBrushSelection ? xBrushSelection[1] : xDomain[1],
        y0: yBrushSelection ? yBrushSelection[0] : yDomain[0],
        y1: yBrushSelection ? yBrushSelection[1] : yDomain[1],
      }
    ]) : undefined;
  }, [selectionRangeX, selectionRangeY, selectionDimX, selectionDimY, dimX, dimY]);

  const [xData, yData, colorData] = useMemo(() => {
    if(!plotData) {
      return [null, null, null];
    }
    return [
      plotData.map((d: any) => d.x),
      plotData.map((d: any) => d.y),
      plotData.map((d: PenguinRow) => `rgba(${colors[d.species][0]},${colors[d.species][1]},${colors[d.species][2]},0.5)`),
    ];
  }, [plotData]);
  const [sizeData] = useMemo(() => {
    if(!plotData) {
      return [null];
    }
    return [
      selectedPlotData?.map((d: any) => d.inSelection ? 12 : 6),
    ];
  }, [selectedPlotData]);

  if(!plotData) {
    return null;
  }

  return (
    <div
      className="splom-scatterplot"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Plot.default
        data={[
          {
            type: 'scatter',
            mode: 'markers',
            x: xData,
            y: yData,
            marker: {
              size: sizeData,
              color: colorData,
            },
          },
        ]}
        layout={{
          dragmode: 'select',
          plot_bgcolor: 'white',
          width,
          height,
          margin: {
            t: marginTop,
            b: marginBottom,
            r: marginRight,
            l: marginLeft,
          },
          xaxis: {
            linewidth: 1,
            title: dimX,
            ticklen: 5,
          },
          yaxis: {
            linewidth: 1,
            title: dimY,
            ticklen: 5,
          },
          selections: selections,
        }}
        onSelecting={onSelecting}
        onSelected={onSelected}
      />
    </div>
  );
}

export function SplomExample(props: any) {
  const {
    d3only = true,
  } = props;
  const [spec, setSpec] = React.useState<any>(initialSpec);

  const SecondaryScatterplot = d3only ? D3Scatterplot : PlotlyScatterplot;

  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  }), []);

  return (
    <>
      <style>{`
        .splom-scatterplot {
          border: 0px solid red;
          overflow: hidden;
        }
        .splom-matrix {
          display: flex;
          flex-direction: column;
        }
        .splom-row {
          display: flex;
          flex-direction: row;
        }
      `}</style>
      <QueryClientProvider client={queryClient}>
        <ZodErrorBoundary key={spec.key}>
          <ZodCoordinationProvider
            spec={spec}
            coordinationTypes={pluginCoordinationTypes}
            onSpecChange={setSpec}
          >
            <div className="splom-matrix">
              <div className="splom-row">
                <D3Scatterplot viewUid="x0y0" />
                <SecondaryScatterplot viewUid="x1y0" />
                <D3Scatterplot viewUid="x2y0" />
                <SecondaryScatterplot viewUid="x3y0" />
              </div>
              <div className="splom-row">
                <SecondaryScatterplot viewUid="x0y1" />
                <D3Scatterplot viewUid="x1y1" />
                <SecondaryScatterplot viewUid="x2y1" />
                <D3Scatterplot viewUid="x3y1" />
              </div>
              <div className="splom-row">
                <D3Scatterplot viewUid="x0y2" />
                <SecondaryScatterplot viewUid="x1y2" />
                <D3Scatterplot viewUid="x2y2" />
                <SecondaryScatterplot viewUid="x3y2" />
              </div>
              <div className="splom-row">
                <SecondaryScatterplot viewUid="x0y3" />
                <D3Scatterplot viewUid="x1y3" />
                <SecondaryScatterplot viewUid="x2y3" />
                <D3Scatterplot viewUid="x3y3" />
              </div>
            </div>
          </ZodCoordinationProvider>
          <pre>
            {JSON.stringify(spec, null, 2)}
          </pre>
        </ZodErrorBoundary>
      </QueryClientProvider>
    </>
  );
}
