import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { cloneDeep } from 'lodash-es';
import { initializeTrrack, Registry } from '@trrack/core';

export function useTrrack(initialConfig) {
  // Setup Trrack
  const { registry, actions } = useMemo(() => {
    const reg = Registry.create();
    const updateConfig = reg.register('update-config', (state, newConfig) => {
      state.config = cloneDeep(newConfig);
    });
    return {
      registry: reg,
      actions: {
        updateConfig,
      },
    };
  }, []);
  const trrack = useMemo(() => initializeTrrack({
    initialState: { config: initialConfig },
    registry,
  }), []);
  // End setup Trrack

  const [config, setConfig] = useState(initialConfig);
  const [configFromTrrack, setConfigFromTrrack] = useState(0);
  const [showTrrackConfig, setShowTrrackConfig] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    trrack.apply('Update config', actions.updateConfig(config));
    setShowTrrackConfig(false);
    setConfigFromTrrack((prev) => prev + 1);
  }, [config]);

  useEffect(() => {
    const unsubscribe = trrack.currentChange(() => {
      const canNotUndo = (
        trrack.current.id === trrack.root.id
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
    setConfigFromTrrack((prev) => prev + 1);
  }, [trrack]);

  const onRedo = useCallback(() => {
    trrack.redo();
    setShowTrrackConfig(true);
    setConfigFromTrrack((prev) => prev + 1);
  }, [trrack]);

  const configToUse = (showTrrackConfig ? trrack.getState().config : config);

  // Things for ProvVis
  const onChangeCurrent = useCallback((node) => {
    trrack.to(node)
    setShowTrrackConfig(true);
    setConfigFromTrrack((prev) => prev + 1);
  }, [trrack]);
  // End things for ProvVis

  return {
    trrack,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    config: configToUse,
    onConfigChange: setConfig,
    onChangeCurrent,
  };
}
