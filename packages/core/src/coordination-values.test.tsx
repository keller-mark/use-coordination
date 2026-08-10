import * as React from 'react';
import { createElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CoordinationProvider } from './CoordinationProvider.js';
import {
  useCoordination,
  useCoordinationL1,
  useInitialCoordination,
} from './hooks.js';
import { CmvConfigObject } from './prop-types.js';


function makeWrapper(spec: CmvConfigObject, onSpecChange?: (spec: CmvConfigObject) => void) {
  return function Wrapper({ children }: { children: any }) {
    return createElement(CoordinationProvider, {
      spec,
      onSpecChange,
      emitInitialSpecChange: false,
      children,
    });
  };
}

describe('view-level coordinationValues', () => {
  it('takes precedence over coordinationScopes and metaCoordinationScopes', () => {
    const spec: CmvConfigObject = {
      key: 1,
      coordinationSpace: {
        zoom: { A: 1 },
        pan: { A: 10 },
        rotation: { A: 100 },
      },
      metaCoordination: {
        coordinationScopes: {
          metaA: { rotation: 'A' },
        },
      },
      viewCoordination: {
        v1: {
          coordinationScopes: { zoom: 'A', pan: 'A' },
          metaCoordinationScopes: 'metaA',
          coordinationValues: { zoom: 5, rotation: 500 },
        },
      },
    };
    const { result } = renderHook(
      () => useCoordination('v1', ['zoom', 'pan', 'rotation']),
      { wrapper: makeWrapper(spec) },
    );
    const [values] = result.current;
    // zoom and rotation come from coordinationValues,
    // pan comes from the coordinationSpace.
    expect(values).toEqual({ zoom: 5, pan: 10, rotation: 500 });
  });

  it('supports coordination types which are absent from the coordinationSpace', () => {
    const spec: CmvConfigObject = {
      key: 1,
      viewCoordination: {
        v1: {
          coordinationValues: { zoom: 5 },
        },
      },
    };
    const { result } = renderHook(
      () => useCoordination('v1', ['zoom']),
      { wrapper: makeWrapper(spec) },
    );
    expect(result.current[0]).toEqual({ zoom: 5 });
  });

  it('setter functions write back to the view coordinationValues', () => {
    const onSpecChange = vi.fn();
    const spec: CmvConfigObject = {
      key: 1,
      coordinationSpace: {
        zoom: { A: 1 },
      },
      viewCoordination: {
        v1: {
          coordinationScopes: { zoom: 'A' },
          coordinationValues: { zoom: 5 },
        },
        v2: {
          coordinationScopes: { zoom: 'A' },
        },
      },
    };
    const { result } = renderHook(
      () => ([useCoordination('v1', ['zoom']), useCoordination('v2', ['zoom'])] as const),
      { wrapper: makeWrapper(spec, onSpecChange) },
    );
    expect(result.current[0][0]).toEqual({ zoom: 5 });
    expect(result.current[1][0]).toEqual({ zoom: 1 });

    act(() => {
      result.current[0][1].setZoom(6);
    });

    // The view which defines the value directly is updated,
    // and the shared coordination scope is left alone.
    expect(result.current[0][0]).toEqual({ zoom: 6 });
    expect(result.current[1][0]).toEqual({ zoom: 1 });

    const newSpec = onSpecChange.mock.lastCall?.[0];
    expect(newSpec.viewCoordination.v1.coordinationValues).toEqual({ zoom: 6 });
    expect(newSpec.coordinationSpace.zoom).toEqual({ A: 1 });

    // Setting from a view which does not define the value directly
    // still updates the coordination space.
    act(() => {
      result.current[1][1].setZoom(2);
    });
    expect(result.current[0][0]).toEqual({ zoom: 6 });
    expect(result.current[1][0]).toEqual({ zoom: 2 });
  });

  it('does not affect the values from useInitialCoordination', () => {
    const spec: CmvConfigObject = {
      key: 1,
      viewCoordination: {
        v1: {
          coordinationValues: { zoom: 5 },
        },
      },
    };
    const { result } = renderHook(
      () => ([useCoordination('v1', ['zoom']), useInitialCoordination('v1', ['zoom'])] as const),
      { wrapper: makeWrapper(spec) },
    );
    act(() => {
      result.current[0][1].setZoom(6);
    });
    expect(result.current[0][0]).toEqual({ zoom: 6 });
    expect(result.current[1]).toEqual({ zoom: 5 });
  });

  it('is overridden by more fine-grained coordinationScopesBy in useCoordinationL1', () => {
    const onSpecChange = vi.fn();
    const spec: CmvConfigObject = {
      key: 1,
      coordinationSpace: {
        layer: { L1: 'a', L2: 'b' },
        opacity: { O1: 0.5 },
      },
      viewCoordination: {
        v1: {
          coordinationScopes: { layer: ['L1', 'L2'] },
          coordinationScopesBy: {
            layer: {
              opacity: { L1: 'O1' },
            },
          },
          coordinationValues: { opacity: 0.9 },
        },
      },
    };
    const { result } = renderHook(
      () => useCoordinationL1('v1', 'layer', ['opacity']),
      { wrapper: makeWrapper(spec, onSpecChange) },
    );
    const [values] = result.current;
    // L1 has a layer-specific scope, so that takes precedence,
    // while L2 falls back to the view-level direct value.
    expect(values).toEqual({
      L1: { opacity: 0.5 },
      L2: { opacity: 0.9 },
    });

    act(() => {
      result.current[1].L2.setOpacity(0.1);
    });
    expect(result.current[0]).toEqual({
      L1: { opacity: 0.5 },
      L2: { opacity: 0.1 },
    });
    const newSpec = onSpecChange.mock.lastCall?.[0];
    expect(newSpec.viewCoordination.v1.coordinationValues).toEqual({ opacity: 0.1 });

    act(() => {
      result.current[1].L1.setOpacity(0.2);
    });
    expect(result.current[0]).toEqual({
      L1: { opacity: 0.2 },
      L2: { opacity: 0.1 },
    });
  });
});
