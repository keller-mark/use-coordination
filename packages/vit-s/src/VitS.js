import React, { useEffect, useMemo, useCallback } from 'react';
import { isEqual } from 'lodash-es';
import { buildConfigSchema } from '@mm-cmv/schemas';
import {
  ViewConfigProvider,
  createViewConfigStore,
} from './state/hooks.js';
import VitessceGrid from './VitessceGrid.js';
import CallbackPublisher from './CallbackPublisher.js';
import {
  logConfig,
} from './view-config-utils.js';

export function VitS(props) {
  const {
    config,
    onWarn,
    onConfigChange,
    onLoaderChange,
    validateConfig = true,
    validateOnConfigChange = false,
    uid = null,
    viewTypes: viewTypesProp,
    fileTypes: fileTypesProp,
    jointFileTypes: jointFileTypesProp,
    coordinationTypes: coordinationTypesProp,
    warning,
    children,
  } = props;

  const viewTypes = useMemo(() => (viewTypesProp || []), [viewTypesProp]);
  const fileTypes = useMemo(() => (fileTypesProp || []), [fileTypesProp]);
  const jointFileTypes = useMemo(
    () => (jointFileTypesProp || []),
    [jointFileTypesProp],
  );
  const coordinationTypes = useMemo(
    () => (coordinationTypesProp || []),
    [coordinationTypesProp],
  );

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

  const pluginSpecificConfigSchema = useMemo(() => buildConfigSchema(
    fileTypes,
    jointFileTypes,
    coordinationTypes,
    viewTypes,
  ), [viewTypes, fileTypes, jointFileTypes, coordinationTypes]);

  // Process the view config and memoize the result:
  // - Validate.
  // - Upgrade, if legacy schema.
  // - Validate after upgrade, if legacy schema.
  // - Initialize (based on initStrategy).
  const [configOrWarning, success] = useMemo(() => {
    if (warning) {
      return [warning, false];
    }
    logConfig(config, 'input view config');
    if (!validateConfig) {
      return [config, true];
    }
    const result = { success: true, data: config };
    if (result.success) {
      const upgradedConfig = result.data;
      logConfig(upgradedConfig, 'parsed view config');
      // Perform second round of parsing against plugin-specific config schema.
      const pluginSpecificResult = pluginSpecificConfigSchema.safeParse(upgradedConfig);
      // Initialize the view config according to the initStrategy.
      if (pluginSpecificResult.success) {
        try {
          const upgradedConfigWithValidPlugins = pluginSpecificResult.data;
          /*const initializedConfig = initialize(
            upgradedConfigWithValidPlugins,
            jointFileTypes,
            coordinationTypes,
            viewTypes,
          );*/
          // TODO(cmv): initialize?
          const initializedConfig = upgradedConfigWithValidPlugins;
          logConfig(initializedConfig, 'initialized view config');
          return [initializedConfig, true];
        } catch (e) {
          return [
            {
              title: 'Config initialization failed.',
              unformatted: e.message,
            },
            false,
          ];
        }
      }
      return [
        {
          title: 'Config validation failed on second pass.',
          unformatted: pluginSpecificResult.error.message,
        },
        false,
      ];
    }
    return [{
      title: 'Config validation failed on first pass.',
      unformatted: result.error.message,
    }, result.success];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, configVersion, pluginSpecificConfigSchema, warning]);


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
          onLoaderChange={onLoaderChange}
          validateOnConfigChange={validateOnConfigChange}
          pluginSpecificConfigSchema={pluginSpecificConfigSchema}
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
