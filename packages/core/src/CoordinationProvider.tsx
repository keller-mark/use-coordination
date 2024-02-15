import { useEffect, useMemo, useCallback } from 'react';
import {
  CoordinationStoreProvider,
  createCoordinationStore,
} from './hooks.js';
import ViewWrapper from './ViewWrapper.js';
import CallbackPublisher from './CallbackPublisher.js';
import { CoordinationProviderProps } from './prop-types.js';

export function CoordinationProvider(props: CoordinationProviderProps) {
  const {
    spec,
    onSpecChange,
    validateOnSpecChange = false,
    validater,
    initializer,
    children,
    onCreateStore,
    remountOnKeyChange = true,
    emitInitialSpecChange = true,
  } = props;

  // If spec.key exists, then use it for hook dependencies to detect changes
  // (controlled component case). If not, then use the spec object itself
  // and assume the un-controlled component case.
  const specKey = useMemo(() => {
    if (spec?.key) {
      return spec.key;
    }
    // Stringify the spec object so it can be used as a key
    // Otherwise, the key will be [object Object]
    return JSON.stringify(spec);
  }, [spec]);


  // Emit the upgraded/initialized spec
  // to onSpecChange if necessary.
  useEffect(() => {
    if (onSpecChange && emitInitialSpecChange) {
      onSpecChange(spec);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, onSpecChange, emitInitialSpecChange]);

  // Initialize the spec and loaders in the global state.
  const createCoordinationStoreClosure = useCallback(() => {
    const initializedSpec = initializer
      ? initializer(spec)
      : spec;
    return createCoordinationStore(initializedSpec, onCreateStore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, initializer, onCreateStore]);

  return (
    /* @ts-ignore */
    <CoordinationStoreProvider createStore={createCoordinationStoreClosure} {...(remountOnKeyChange ? ({ key: specKey }) : {})}>
        <ViewWrapper
          specKey={specKey}
          spec={spec}
        >
          {children}
        </ViewWrapper>
        <CallbackPublisher
          onSpecChange={onSpecChange}
          validateOnSpecChange={validateOnSpecChange}
          validater={validater}
        />
    </CoordinationStoreProvider>
  );
}
