import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { cloneDeep } from 'lodash-es';
import { initializeTrrack, Registry } from '@trrack/core';

export function useTrrack(initialSpec) {
  // Setup Trrack
  const { registry, actions } = useMemo(() => {
    const reg = Registry.create();
    const updateSpec = reg.register('update-spec', (state, newSpec) => {
      state.spec = cloneDeep(newSpec);
    });
    return {
      registry: reg,
      actions: {
        updateSpec,
      },
    };
  }, []);
  const trrack = useMemo(() => initializeTrrack({
    initialState: { spec: initialSpec },
    registry,
  }), []);
  // End setup Trrack

  const [spec, setSpec] = useState(initialSpec);
  const [specFromTrrack, setSpecFromTrrack] = useState(0);
  const [showSpecFromTrrack, setShowSpecFromTrrack] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    trrack.apply('Update spec', actions.updateSpec(spec));
    setShowSpecFromTrrack(false);
    setSpecFromTrrack((prev) => prev + 1);
  }, [spec]);

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
    setShowSpecFromTrrack(true);
    setSpecFromTrrack((prev) => prev + 1);
  }, [trrack]);

  const onRedo = useCallback(() => {
    trrack.redo();
    setShowSpecFromTrrack(true);
    setSpecFromTrrack((prev) => prev + 1);
  }, [trrack]);

  const specToUse = (showSpecFromTrrack ? trrack.getState().spec : spec);

  // Things for ProvVis
  const onChangeCurrent = useCallback((node) => {
    trrack.to(node)
    setShowSpecFromTrrack(true);
    setSpecFromTrrack((prev) => prev + 1);
  }, [trrack]);
  // End things for ProvVis

  return {
    trrack,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    spec: specToUse,
    onSpecChange: setSpec,
    onChangeCurrent,
  };
}
