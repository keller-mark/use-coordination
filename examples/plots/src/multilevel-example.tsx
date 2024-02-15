import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  defineSpec,
  META_COORDINATION_SCOPES,
  META_COORDINATION_SCOPES_BY,
  getMetaScope,
  getMetaScopeBy,
  createPrefixedGetNextScopeNumeric,
  useCoordinationStore,
} from '@use-coordination/all';
import { z } from 'zod';
import { letterFrequency } from '@visx/mock-data';
import { MultiLevelVegaLitePlotView } from './multilevel-vega-lite.js';
import { MultiLevelD3BarPlotView } from './multilevel-d3.js';
import { MultilevelColors } from './multilevel-colors.js';

// Define prefixed next-scope functions for improved readability of the config.
const getNextSelectionScope = createPrefixedGetNextScopeNumeric("S");
const getNextColorScope = createPrefixedGetNextScopeNumeric("C");

const pluginCoordinationTypes = {
  barSelection: z.string().nullable(),
  barColor: z.string().nullable(),
};

const initialSpec = defineSpec({
  key: 1,
  coordinationSpace: {
    barSelection: {
      S0: "A",
    },
    barColor: {
      C0: "#ff0000",
    },
    metaCoordinationScopes: {
      A: {
        barSelection: ["S0"],
      }
    },
    metaCoordinationScopesBy: {
      A: {
        barSelection: {
          barColor: {
            S0: "C0",
          },
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
    },
    barColorPicker: {
      coordinationScopes: {
        metaCoordinationScopes: "A",
        metaCoordinationScopesBy: "A"
      },
    }
  },
});

// Define custom logic for updating the coordination space in user-land.
function selectBarInMetaCoordinationScopesHelper(coordinationScopesRaw: any, letter: string, coordinationSpace: any) {
  const nextSelectionScope = getNextSelectionScope(Object.keys(coordinationSpace.barSelection));
  const nextColorScope = getNextColorScope(Object.keys(coordinationSpace.barColor));

  const nextSelectionValue = letter;
  const nextColor = "#ff00ff";

  // Get the current meta-coordination scopes for the bar selection type.
  const metaCoordinationScopes = coordinationSpace[META_COORDINATION_SCOPES];
  const metaCoordinationScopesBy = coordinationSpace[META_COORDINATION_SCOPES_BY];

  let newMetaCoordinationScopes = metaCoordinationScopes;
  let newMetaCoordinationScopesBy = metaCoordinationScopesBy;
  let newCoordinationSpace = coordinationSpace;

  const selectionMetaScope = getMetaScope(coordinationSpace, coordinationScopesRaw, "barSelection");
  const colorByMetaScope = getMetaScopeBy(coordinationSpace, coordinationScopesRaw, "barSelection", "barColor", null);

  if(selectionMetaScope && colorByMetaScope) {
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

    newMetaCoordinationScopesBy = {
      ...metaCoordinationScopesBy,
      [colorByMetaScope]: {
        ...metaCoordinationScopesBy?.[colorByMetaScope],
        barSelection: {
          ...metaCoordinationScopesBy?.[selectionMetaScope]?.barSelection,
          barColor: {
            ...metaCoordinationScopesBy?.[selectionMetaScope]?.barSelection?.barColor,
            [nextSelectionScope]: nextColorScope,
          },
        },
      },
    };

    newCoordinationSpace = {
      ...coordinationSpace,
      [META_COORDINATION_SCOPES]: newMetaCoordinationScopes,
      [META_COORDINATION_SCOPES_BY]: newMetaCoordinationScopesBy,
      barSelection: {
        ...coordinationSpace.barSelection,
        [nextSelectionScope]: nextSelectionValue,
      },
      barColor: {
        ...coordinationSpace.barColor,
        [nextColorScope]: nextColor,
      },
    };
  }
  
  return newCoordinationSpace;
}

function unselectBarInMetaCoordinationScopesHelper(coordinationScopesRaw: any, letter: string, coordinationSpace: any) {
  const selectionScopeToRemove = Object.entries(coordinationSpace.barSelection)
    .find(([scope, value]) => value === letter)?.[0];

  // Get the current meta-coordination scopes for the bar selection type.
  const metaCoordinationScopes = coordinationSpace[META_COORDINATION_SCOPES];
  const metaCoordinationScopesBy = coordinationSpace[META_COORDINATION_SCOPES_BY];

  let newMetaCoordinationScopes = metaCoordinationScopes;
  let newMetaCoordinationScopesBy = metaCoordinationScopesBy;
  let newCoordinationSpace = coordinationSpace;

  const selectionMetaScope = getMetaScope(coordinationSpace, coordinationScopesRaw, "barSelection");
  const colorByMetaScope = getMetaScopeBy(coordinationSpace, coordinationScopesRaw, "barSelection", "barColor", null);

  if(selectionScopeToRemove && selectionMetaScope && colorByMetaScope) {
    const colorScopeToRemove = metaCoordinationScopesBy?.[colorByMetaScope]?.barSelection?.barColor?.[selectionScopeToRemove];

    newMetaCoordinationScopes = {
      ...metaCoordinationScopes,
      [selectionMetaScope]: {
        ...metaCoordinationScopes?.[selectionMetaScope],
        barSelection: metaCoordinationScopes
          ?.[selectionMetaScope]
          ?.barSelection
          ?.filter((scope: string) => scope !== selectionScopeToRemove),
      },
    };

    newMetaCoordinationScopesBy = {
      ...metaCoordinationScopesBy,
      [colorByMetaScope]: {
        ...metaCoordinationScopesBy?.[colorByMetaScope],
        barSelection: {
          ...metaCoordinationScopesBy?.[selectionMetaScope]?.barSelection,
          barColor: Object.fromEntries(
            Object.entries(metaCoordinationScopesBy?.[selectionMetaScope]?.barSelection?.barColor)
              .filter(([scope, colorScope]) => scope !== selectionScopeToRemove),
          ),
        },
      },
    };

    newCoordinationSpace = {
      ...coordinationSpace,
      [META_COORDINATION_SCOPES]: newMetaCoordinationScopes,
      [META_COORDINATION_SCOPES_BY]: newMetaCoordinationScopesBy,
      barSelection: Object.fromEntries(
        Object.entries(coordinationSpace.barSelection)
          .filter(([scope, value]) => scope !== selectionScopeToRemove),
      ),
      barColor: Object.fromEntries(
        Object.entries(coordinationSpace.barColor)
          .filter(([scope, value]) => scope !== colorScopeToRemove),
      ),
    };
  }
  
  return newCoordinationSpace;
}

function onCreateStore(set: Function) {
  return {
    selectBar: (viewUid: string, letter: string) => set((state: any) => {
      const { coordinationSpace, viewCoordination } = state.spec;
      const coordinationScopesRaw = viewCoordination?.[viewUid]?.coordinationScopes;
      const newSpec = {
        ...state.spec,
        coordinationSpace: selectBarInMetaCoordinationScopesHelper(
          coordinationScopesRaw,
          letter,
          coordinationSpace,
        ),
      };
      return {
        spec: newSpec,
      };
    }),
    unselectBar: (viewUid: string, letter: string) => set((state: any) => {
      const { coordinationSpace, viewCoordination } = state.spec;
      const coordinationScopesRaw = viewCoordination?.[viewUid]?.coordinationScopes;
      const newSpec = {
        ...state.spec,
        coordinationSpace: unselectBarInMetaCoordinationScopesHelper(
          coordinationScopesRaw,
          letter,
          coordinationSpace,
        ),
      };
      return {
        spec: newSpec,
      };
    }),
  };
}

// Export custom hook functions that expose the custom store actions
// that were defined in the `onCreateStore` function.
export function useSelectBar() {
  return useCoordinationStore((state: any) => state.selectBar);
}

export function useUnselectBar() {
  return useCoordinationStore((state: any) => state.unselectBar);
}

export function MultiLevelPlotsExample() {
  const [spec, setSpec] = React.useState<any>(initialSpec);
  return (
    <>
      <style>{`
        .multiplot-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
      `}</style>
      <ZodErrorBoundary key={spec.key}>
        <ZodCoordinationProvider
          config={spec}
          coordinationTypes={pluginCoordinationTypes}
          onSpecChange={setSpec}
          onCreateStore={onCreateStore}
        >
          <div className="multiplot-container">
            <div className="plot-container">
              <MultiLevelVegaLitePlotView viewUid="vegaLite" data={letterFrequency} />
            </div>
            <div className="plot-container">
              <MultiLevelD3BarPlotView viewUid="d3" data={letterFrequency} />
            </div>
          </div>
          <MultilevelColors viewUid="barColorPicker" />
        </ZodCoordinationProvider>
        <pre>
          {JSON.stringify(spec, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
