import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineConfig,
  META_COORDINATION_SCOPES,
  META_COORDINATION_SCOPES_BY,
  getMetaScope,
  getNextScope,
} from '@use-coordination/all';
import { z } from 'zod';
import { letterFrequency } from '@visx/mock-data';
import { MultiLevelVegaLitePlotView } from './multilevel-vega-lite.js';
import { MultiLevelD3BarPlotView } from './multilevel-d3.js';


const pluginCoordinationTypes = {
  barSelection: z.string().nullable(),
  barColor: z.string().nullable(),
  barValue: z.string().nullable(),
};

const initialConfig = defineConfig({
  key: 1,
  coordinationSpace: {
    barSelection: {
      S1: "__dummy__",
    },
    barColor: {
      C1: "red",
    },
    barValue: {
      V1: "A",
    },
    metaCoordinationScopes: {
      A: {
        barSelection: ["S1"],
      }
    },
    metaCoordinationScopesBy: {
      A: {
        barSelection: {
          barColor: {
            S1: "C1",
          },
          barValue: {
            S1: "V1",
          }
        },
      },
    },
  },
  viewCoordination: {
    vegaLite: {
      coordinationScopes: {
        metaCoordinationScopes: "A",
        metaCoordinationScopesBy: "A"
      },
    },
    d3: {
      coordinationScopes: {
        metaCoordinationScopes: "A",
        metaCoordinationScopesBy: "A"
      },
    }
  },
});

function selectBarInMetaCoordinationScopesHelper(coordinationScopesRaw: any, letter: string, coordinationSpace: any) {
  // Set up next values
  const nextSelectionScope = getNextScope(Object.keys(coordinationSpace.barSelection));
  const nextValueScope = getNextScope(Object.keys(coordinationSpace.barValue));
  const nextColorScope = getNextScope(Object.keys(coordinationSpace.barColor));

  const nextSelectionValue = "__dummy__";
  const nextValue = letter;
  const nextColor = "green";

  // Get the current meta-coordination scopes for the bar selection type.
  const metaCoordinationScopes = coordinationSpace[META_COORDINATION_SCOPES];
  const metaCoordinationScopesBy = coordinationSpace[META_COORDINATION_SCOPES_BY];

  let newMetaCoordinationScopes = metaCoordinationScopes;
  let newMetaCoordinationScopesBy = metaCoordinationScopesBy;

  const selectionMetaScope = getMetaScope(coordinationScopesRaw, coordinationSpace, "barSelection");
  // TODO: get the meta-info for values and colors independently?

  if(selectionMetaScope) {
    const prevSelectionScopes = metaCoordinationScopes
      ?.[selectionMetaScope]
      ?.barSelection;

    newMetaCoordinationScopes = {
      ...metaCoordinationScopes,
      [selectionMetaScope]: {
        ...metaCoordinationScopes?.[selectionMetaScope],
        barSelection: [...prevSelectionScopes, nextSelectionScope],
      },
    };
  }
  
  return {
    ...coordinationSpace,
    [META_COORDINATION_SCOPES]: newMetaCoordinationScopes,
    [META_COORDINATION_SCOPES_BY]: newMetaCoordinationScopesBy,
    barSelection: {
      ...coordinationSpace.barSelection,
      [nextSelectionScope]: nextSelectionValue,
    },
    barValue: {
      ...coordinationSpace.barValue,
      [nextValueScope]: nextValue,
    },
    barColor: {
      ...coordinationSpace.barColor,
      [nextColorScope]: nextColor,
    },
  };
}

function onCreateStore(set: Function) {
  return {
    selectBar: (viewUid: string, letter: string) => set((state: any) => {
      const { coordinationSpace, viewCoordination } = state.viewConfig;
      const coordinationScopesRaw = viewCoordination?.[viewUid]?.coordinationScopes;
      return {
        viewConfig: {
          ...state.viewConfig,
          coordinationSpace: selectBarInMetaCoordinationScopesHelper(
            coordinationScopesRaw,
            letter,
            coordinationSpace,
          ),
        },
      };
    }),
  };
}

export function MultiLevelPlotsExample(props: any) {
  const [config, setConfig] = React.useState<any>(initialConfig);
  return (
    <>
      <style>{`
        .multiplot-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
      `}</style>
      <ZodErrorBoundary key={config.key}>
        <ZodCoordinationProvider
          config={config}
          coordinationTypes={pluginCoordinationTypes}
          onConfigChange={setConfig}
        >
          <div className="multiplot-container">
            <div className="plot-container">
              <MultiLevelVegaLitePlotView viewUid="vegaLite" data={letterFrequency} />
            </div>
            <div className="plot-container">
              <MultiLevelD3BarPlotView viewUid="d3" data={letterFrequency} />
            </div>
          </div>
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
