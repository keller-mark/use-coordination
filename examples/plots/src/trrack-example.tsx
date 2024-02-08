import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CoordinationProvider,
  defineConfig,
} from '@use-coordination/all';
import { 
  initializeTrrack,
  Registry,
} from '@trrack/core';
import { cloneDeep } from 'lodash-es';
import { letterFrequency } from '@visx/mock-data';
import { VegaLitePlotView } from './vega-lite.js';
import { D3BarPlotView } from './d3.js';
import { VisxPlotView } from './visx.js';
import { PlotlyBarPlotView } from './plotly.js';


const initialConfig = defineConfig({
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
});

function useTrrack() {
  const { registry, actions } = useMemo(() => {
    const reg = Registry.create();
    const updateConfig = reg.register('update-config', (state, newConfig: any) => {
      state.config = cloneDeep(newConfig);
    });
    return {
      registry: reg,
      actions: {
        updateConfig,
      },
    };
  }, []);
  const trrack = useMemo(() => initializeTrrack({ initialState: { config: initialConfig }, registry }), []);
  return { trrack, actions };
}

export function TrrackExample(props: any) {
  const [config, setConfig] = useState<any>(initialConfig);
  const [configFromTrrack, setConfigFromTrrack] = useState<any>(0);
  const [showTrrackConfig, setShowTrrackConfig] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const { trrack, actions } = useTrrack();

  useEffect(() => {
    trrack.apply('Update config', actions.updateConfig(config));
    setShowTrrackConfig(false);
  }, [config]);

  useEffect(() => {
    const unsubscribe = trrack.currentChange(() => {
      const canNotUndo = (
          trrack.current.id === trrack.root.id
          || (trrack.current as any).parent === trrack.root.id
      );
      const canNotRedo = trrack.graph.current.children.length === 0;
      setCanUndo(!canNotUndo);
      setCanRedo(!canNotRedo);
    });
    return () => {
      unsubscribe();
    };
  }, [trrack]);

  const onUndo = useCallback(() => {
    trrack.undo();
    setShowTrrackConfig(true);
    setConfigFromTrrack((prev: number) => prev + 1);
  }, [trrack]);
  const onRedo = useCallback(() => {
    trrack.redo();
    setShowTrrackConfig(true);
    setConfigFromTrrack((prev: number) => prev + 1);
  }, [trrack]);

  const configToUse = (showTrrackConfig ? trrack.getState().config : config);

  return (
    <>
      <style>{`
        .multiplot-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
      `}</style>
      <button onClick={onUndo} disabled={!canUndo}>Undo</button>
      <button onClick={onRedo} disabled={!canRedo}>Redo</button>
      <CoordinationProvider
        config={configToUse}
        onConfigChange={(newConfig: any) => {
          setConfig(newConfig);
        }}
        diffByKey={false}
        emitInitialConfigChange={false}
      >
        <div className="multiplot-container">
          <div className="plot-container">
            <VegaLitePlotView viewUid="vegaLite" data={letterFrequency} />
          </div>
          <div className="plot-container">
            <D3BarPlotView viewUid="d3" data={letterFrequency} />
          </div>
          <div className="plot-container">
            <VisxPlotView viewUid="visx" data={letterFrequency} />
          </div>
          <div className="plot-container">
            <PlotlyBarPlotView viewUid="plotly" data={letterFrequency} />
          </div>
        </div>
      </CoordinationProvider>
      <pre>
        {JSON.stringify(configToUse, null, 2)}
      </pre>
    </>
  );
}
