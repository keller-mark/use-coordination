import React from 'react';
import {
  ZodCoordinationProvider,
  ZodErrorBoundary,
  useCoordination,
  defineConfig,
  META_COORDINATION_SCOPES,
  META_COORDINATION_SCOPES_BY,
  getMetaScope,
  getMetaScopeBy,
  getNextScope,
  useViewConfigStore,
} from '@use-coordination/all';
import { z } from 'zod';
import { letterFrequency } from '@visx/mock-data';
import { MultiLevelVegaLitePlotView } from './multilevel-vega-lite.js';
import { MultiLevelD3BarPlotView } from './multilevel-d3.js';
import { MultilevelColors } from './multilevel-colors.js';


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
      C1: "#ff0000",
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
    },
    barColorPicker: {
      coordinationScopes: {
        metaCoordinationScopes: "A",
        metaCoordinationScopesBy: "A"
      },
    }
  },
});

function selectBarInMetaCoordinationScopesHelper(coordinationScopesRaw: any, letter: string, coordinationSpace: any) {
  console.log('coordinationScopesRaw', coordinationScopesRaw, letter, coordinationSpace);
  // Set up next values
  const nextSelectionScope = getNextScope(Object.keys(coordinationSpace.barSelection));
  const nextValueScope = getNextScope(Object.keys(coordinationSpace.barValue));
  const nextColorScope = getNextScope(Object.keys(coordinationSpace.barColor));

  const nextSelectionValue = "__dummy__";
  const nextValue = letter;
  const nextColor = "#ff00ff";

  // Get the current meta-coordination scopes for the bar selection type.
  const metaCoordinationScopes = coordinationSpace[META_COORDINATION_SCOPES];
  const metaCoordinationScopesBy = coordinationSpace[META_COORDINATION_SCOPES_BY];

  let newMetaCoordinationScopes = metaCoordinationScopes;
  let newMetaCoordinationScopesBy = metaCoordinationScopesBy;

  const selectionMetaScope = getMetaScope(coordinationSpace, coordinationScopesRaw, "barSelection");
  const byScope = coordinationScopesRaw.metaCoordinationScopesBy;
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

    newMetaCoordinationScopesBy = {
      ...metaCoordinationScopesBy,
      [byScope]: {
        ...metaCoordinationScopesBy?.[byScope],
        barSelection: {
          ...metaCoordinationScopesBy?.[selectionMetaScope]?.barSelection,
          barValue: {
            ...metaCoordinationScopesBy?.[selectionMetaScope]?.barSelection?.barValue,
            [nextSelectionScope]: nextValueScope,
          },
          barColor: {
            ...metaCoordinationScopesBy?.[selectionMetaScope]?.barSelection?.barColor,
            [nextSelectionScope]: nextColorScope,
          },
        },
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

function unselectBarInMetaCoordinationScopesHelper(coordinationScopesRaw: any, letter: string, coordinationSpace: any) {
  // TODO
  return coordinationSpace;
}

function onCreateStore(set: Function) {
  return {
    // Reference: https://github.com/vitessce/vitessce/blob/f4900f79f5fc2c1bdcc0ee42e1ba4b7026ab939a/packages/vit-s/src/state/hooks.js#L302
    selectBar: (viewUid: string, letter: string) => set((state: any) => {
      const { coordinationSpace, viewCoordination } = state.viewConfig;
      const coordinationScopesRaw = viewCoordination?.[viewUid]?.coordinationScopes;
      const newConfig = {
        ...state.viewConfig,
        coordinationSpace: selectBarInMetaCoordinationScopesHelper(
          coordinationScopesRaw,
          letter,
          coordinationSpace,
        ),
      };
      console.log('newConfig', newConfig);
      return {
        viewConfig: newConfig,
      };
    }),
    unselectBar: (viewUid: string, letter: string) => set((state: any) => {
      const { coordinationSpace, viewCoordination } = state.viewConfig;
      const coordinationScopesRaw = viewCoordination?.[viewUid]?.coordinationScopes;
      const newConfig = {
        ...state.viewConfig,
        coordinationSpace: unselectBarInMetaCoordinationScopesHelper(
          coordinationScopesRaw,
          letter,
          coordinationSpace,
        ),
      };
      console.log('newConfig', newConfig);
      return {
        viewConfig: newConfig,
      };
    }),
  };
}

// Reference: https://github.com/vitessce/vitessce/blob/f4900f79f5fc2c1bdcc0ee42e1ba4b7026ab939a/packages/vit-s/src/state/hooks.js#L1060
export function useSelectBar() {
  return useViewConfigStore((state: any) => state.selectBar);
}

export function useUnselectBar() {
  return useViewConfigStore((state: any) => state.unselectBar);
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
          {JSON.stringify(config, null, 2)}
        </pre>
      </ZodErrorBoundary>
    </>
  );
}
