import { useEffect, useMemo, useCallback } from 'react';
import {
  ViewConfigProvider,
  createViewConfigStore,
} from './hooks.js';
import ViewWrapper from './ViewWrapper.js';
import CallbackPublisher from './CallbackPublisher.js';
import { CoordinationProviderProps } from './prop-types.js';

export function CoordinationProvider(props: CoordinationProviderProps) {
  const {
    config,
    onConfigChange,
    validateOnConfigChange = false,
    validater,
    initializer,
    children,
    onCreateStore,
    diffByKey = true,
    emitInitialConfigChange = true,
  } = props;

  // If config.key exists, then use it for hook dependencies to detect changes
  // (controlled component case). If not, then use the config object itself
  // and assume the un-controlled component case.
  const configKey = useMemo(() => {
    if (config?.key) {
      return config.key;
    }
    // Stringify the config object so it can be used as a key
    // Otherwise, the key will be [object Object]
    return JSON.stringify(config);
  }, [config]);


  // Emit the upgraded/initialized view config
  // to onConfigChange if necessary.
  useEffect(() => {
    if (onConfigChange && emitInitialConfigChange) {
      onConfigChange(config);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, onConfigChange, emitInitialConfigChange]);

  // Initialize the view config and loaders in the global state.
  const createViewConfigStoreClosure = useCallback(() => {
    const initializedConfig = initializer
      ? initializer(config)
      : config;
    return createViewConfigStore(initializedConfig, onCreateStore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, initializer, onCreateStore]);

  return (
    /* @ts-ignore */
    <ViewConfigProvider createStore={createViewConfigStoreClosure} {...(diffByKey ? ({ key: configKey }) : {})}>
        <ViewWrapper
          configKey={configKey}
          config={config}
        >
          {children}
        </ViewWrapper>
        <CallbackPublisher
          onConfigChange={onConfigChange}
          validateOnConfigChange={validateOnConfigChange}
          validater={validater}
        />
    </ViewConfigProvider>
  );
}
