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
    config,
    onSpecChange,
    validateOnSpecChange = false,
    validater,
    initializer,
    children,
    onCreateStore,
    remountOnKeyChange = true,
    emitInitialSpecChange = true,
  } = props;

  // If config.key exists, then use it for hook dependencies to detect changes
  // (controlled component case). If not, then use the config object itself
  // and assume the un-controlled component case.
  const specKey = useMemo(() => {
    if (config?.key) {
      return config.key;
    }
    // Stringify the config object so it can be used as a key
    // Otherwise, the key will be [object Object]
    return JSON.stringify(config);
  }, [config]);


  // Emit the upgraded/initialized view config
  // to onSpecChange if necessary.
  useEffect(() => {
    if (onSpecChange && emitInitialSpecChange) {
      onSpecChange(config);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, onSpecChange, emitInitialSpecChange]);

  // Initialize the view config and loaders in the global state.
  const createCoordinationStoreClosure = useCallback(() => {
    const initializedConfig = initializer
      ? initializer(config)
      : config;
    return createCoordinationStore(initializedConfig, onCreateStore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, initializer, onCreateStore]);

  return (
    /* @ts-ignore */
    <CoordinationStoreProvider createStore={createCoordinationStoreClosure} {...(remountOnKeyChange ? ({ key: specKey }) : {})}>
        <ViewWrapper
          specKey={specKey}
          config={config}
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
