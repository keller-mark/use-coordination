import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineSpec,
} from '@use-coordination/all';
import { z } from 'zod';
import { csv } from 'd3-fetch';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { extent } from 'd3-array';
import { FlowEditor } from '@use-coordination/flow-editor';


const baseUrl = 'https://storage.googleapis.com/vitessce-demo-data/use-coordination/penguins.csv';

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



function Scatterplot(props: any) {
  const { data, viewUid } = props;

  const width = 250;
  const height = 250;
  const marginLeft = 25;
  const marginBottom = 25;

  const svgRef = React.useRef(null);

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

    if(!data) {
      return;
    }

    const plotData = data.map((d: any) => ({
      x: d[dimX],
      y: d[dimY],
      species: d.species,
    }));
    const xExtent = extent(plotData, (d: any) => d.x);
    const yExtent = extent(plotData, (d: any) => d.y);

    const xScale = scaleLinear()
      .domain(xExtent)
      .range([marginLeft, width]);
    const yScale = scaleLinear()
      .domain(yExtent)
      .range([height-marginBottom, 0]);

    const xAxisTicks = g.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .style('font-size', '10px')
      .call(axisBottom(xScale));
    const yAxisTicks = g.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .style('font-size', '10px')
      .call(axisLeft(yScale));
    
    const circles = g.selectAll('circle')
      .data(plotData)
      .enter()
      .append('circle')
      .attr('cx', (d: any) => xScale(d.x))
      .attr('cy', (d: any) => yScale(d.y))
      .attr('r', 3)
      .attr('fill', (d: any) => `rgb(255,0,0)`)


  }, [svgRef, width, height, data]);

  return (
    <svg
      className="splom-scatterplot"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      ref={svgRef}
    />
  )
}

export function SplomExample(props: any) {
  const [spec, setSpec] = React.useState<any>(initialSpec);
  const [penguinsData, setPenguinsData] = React.useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const penguins = (await csv(baseUrl)).map((row: any) => ({
        ...row,
        bill_depth_mm: +row.bill_depth_mm,
        bill_length_mm: +row.bill_length_mm,
        body_mass_g: +row.body_mass_g,
        flipper_length_mm: +row.flipper_length_mm,
      }));

      return penguins
    }
    fetchData().then(data => setPenguinsData(data))
  }, []);

  return (
    <>
      <style>{`
        .splom-scatterplot {
          border: 1px solid red;
        }
        .splom-matrix {
          display: flex;
          flex-direction: row;
        }
        .splom-row {
          display: flex;
          flex-direction: column;
        }
      `}</style>
      <ZodErrorBoundary key={spec.key}>
        <ZodCoordinationProvider
          spec={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
        >
          <div className="splom-matrix">
            <div className="splom-row">
              <Scatterplot data={penguinsData} viewUid="x0y0" />
              <Scatterplot data={penguinsData} viewUid="x1y0" />
              <Scatterplot data={penguinsData} viewUid="x2y0" />
              <Scatterplot data={penguinsData} viewUid="x3y0" />
            </div>
            <div className="splom-row">
              <Scatterplot data={penguinsData} viewUid="x0y1" />
              <Scatterplot data={penguinsData} viewUid="x1y1" />
              <Scatterplot data={penguinsData} viewUid="x2y1" />
              <Scatterplot data={penguinsData} viewUid="x3y1" />
            </div>
            <div className="splom-row">
              <Scatterplot data={penguinsData} viewUid="x0y2" />
              <Scatterplot data={penguinsData} viewUid="x1y2" />
              <Scatterplot data={penguinsData} viewUid="x2y2" />
              <Scatterplot data={penguinsData} viewUid="x3y2" />
            </div>
            <div className="splom-row">
              <Scatterplot data={penguinsData} viewUid="x0y3" />
              <Scatterplot data={penguinsData} viewUid="x1y3" />
              <Scatterplot data={penguinsData} viewUid="x2y3" />
              <Scatterplot data={penguinsData} viewUid="x3y3" />
            </div>
          </div>
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
      <FlowEditor spec={spec} onSpecChange={setSpec} />
    </>
  );
}
