import { describe, it, expect } from 'vitest';
import {
    toGraphviz
} from './index.js';

describe('Graphviz Rendering', () => {
  describe('toGraphviz', () => {
    it('works', () => {
      const spec = {
        key: 1,
        coordinationSpace: {
          "barSelection": {
            "A": [],
          }
        },
        viewCoordination: {
          vegaLite: {
            coordinationScopes: {
              barSelection: "A",
            },
          },
          d3: {
            coordinationScopes: {
              barSelection: "A",
            },
          },
          visx: {
            coordinationScopes: {
              barSelection: "A",
            },
          },
          plotly: {
            coordinationScopes: {
              barSelection: "A",
            },
          },
        },
      };

      const dot = toGraphviz(spec);
      expect(dot).toEqual(`digraph {
  rankdir = "LR";
  "view_vegaLite" [
    color = "yellow";
    label = "vegaLite";
  ];
  "view_d3" [
    color = "yellow";
    label = "d3";
  ];
  "view_visx" [
    color = "yellow";
    label = "visx";
  ];
  "view_plotly" [
    color = "yellow";
    label = "plotly";
  ];
  subgraph "cluster_cType_barSelection" {
    label = "barSelection";
    "cType_barSelection_cScope_A" [
      color = "green";
      label = "A";
    ];
    "cType_barSelection_cScope_A_value" [
      color = "red";
      label = "[]";
    ];
    "cType_barSelection_cScope_A" -> "cType_barSelection_cScope_A_value";
  }
  "view_vegaLite" -> "cType_barSelection_cScope_A";
  "view_d3" -> "cType_barSelection_cScope_A";
  "view_visx" -> "cType_barSelection_cScope_A";
  "view_plotly" -> "cType_barSelection_cScope_A";
}`);
    });
  });
});