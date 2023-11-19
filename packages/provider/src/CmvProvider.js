import React, { useEffect, useMemo, useCallback } from 'react';
import { isEqual } from 'lodash-es';
import {
  ViewConfigProvider,
  createViewConfigStore,
} from './state/hooks.js';
import VitessceGrid from './VitessceGrid.js';
import CallbackPublisher from './CallbackPublisher.js';
import {
  logConfig,
} from './view-config-utils.js';

export function CmvProvider(props) {
  const {
    config,
    onWarn,
    onConfigChange,
    validateOnConfigChange = false,
    validateViewConfig = null,
    children,
  } = props;

  const configVersion = config?.version;

  // If config.uid exists, then use it for hook dependencies to detect changes
  // (controlled component case). If not, then use the config object itself
  // and assume the un-controlled component case.
  const configKey = useMemo(() => {
    if (config?.uid) {
      return config.uid;
    }
    // Stringify the config object so it can be used as a key
    // Otherwise, the key will be [object Object]
    return JSON.stringify(config);
  }, [config]);

  // Process the view config and memoize the result:
  // - Validate.
  // - Upgrade, if legacy schema.
  // - Validate after upgrade, if legacy schema.
  // - Initialize (based on initStrategy).
  const [configOrWarning, success] = useMemo(() => {
    logConfig(config, 'CmvProvider input config');
    return [config, true];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, configVersion]);


  // Emit the upgraded/initialized view config
  // to onConfigChange if necessary.
  useEffect(() => {
    if (success && !isEqual(configOrWarning, config) && onConfigChange) {
      onConfigChange(configOrWarning);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, configKey, configOrWarning, onConfigChange]);

  // Initialize the view config and loaders in the global state.
  const createViewConfigStoreClosure = useCallback(() => {
    if (success) {
      const loaders = null;
      return createViewConfigStore(loaders, configOrWarning);
    }
    // No config found, so clear the loaders.
    return createViewConfigStore(null, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, configKey]);

  // TODO(cmv): just throw normal error. parent can use ErrorBoundary.
  return success ? (
    <ViewConfigProvider key={configKey} createStore={createViewConfigStoreClosure}>
        <VitessceGrid
          success={success}
          configKey={configKey}
          config={configOrWarning}
        >
          {children}
        </VitessceGrid>
        <CallbackPublisher
          onWarn={onWarn}
          onConfigChange={onConfigChange}
          validateOnConfigChange={validateOnConfigChange}
          validateViewConfig={validateViewConfig}
        />
    </ViewConfigProvider>
  ) : (
    <>
      <h1>{configOrWarning.title}</h1>
      {configOrWarning.preformatted ? (<pre>{configOrWarning.preformatted}</pre>) : null}
      <p>{configOrWarning.unformatted}</p>
    </>
  );
}
