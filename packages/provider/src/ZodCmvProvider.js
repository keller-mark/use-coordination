import React, { useEffect, useMemo, useCallback } from 'react';
import { isEqual } from 'lodash-es';
import { buildConfigSchema } from '@mm-cmv/schemas';
import { CmvProvider } from './CmvProvider.js';
import {
  logConfig,
} from './view-config-utils.js';

export function ZodCmvProvider(props) {
  const {
    config,
    onWarn,
    onConfigChange,
    validateConfig = true,
    validateOnConfigChange = false,
    fileTypes: fileTypesProp,
    jointFileTypes: jointFileTypesProp,
    coordinationTypes: coordinationTypesProp,
    warning,
    children,
  } = props;

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
    null, // TODO(cmv): remove param
  ), [fileTypes, jointFileTypes, coordinationTypes]);

  // Process the view config and memoize the result:
  // - Validate.
  // - Upgrade, if legacy schema.
  // - Validate after upgrade, if legacy schema.
  // - Initialize (based on initStrategy).
  const [configOrWarning, success] = useMemo(() => {
    if (warning) {
      return [warning, false];
    }
    logConfig(config, 'ZodCmvProvider input config');
    if (!validateConfig) {
      return [config, true];
    }
    const result = { success: true, data: config };
    if (result.success) {
      const upgradedConfig = result.data;
      logConfig(upgradedConfig, 'ZodCmvProvider parsed config');
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
          logConfig(initializedConfig, 'ZodCmvProvider initialized config');
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

  const validateViewConfig = useCallback((viewConfig) => {
    // Need the try-catch here since Zustand will actually
    // just catch and ignore errors in its subscription callbacks.
    try {
      pluginSpecificConfigSchema.parse(viewConfig);
    } catch (e) {
      console.error(e);
    }
    // Do nothing if successful.
  }, [pluginSpecificConfigSchema]);

  // TODO(cmv): just throw normal error. parent can use ErrorBoundary.
  return success ? (
    <CmvProvider
      config={configOrWarning}
      onWarn={onWarn}
      onConfigChange={onConfigChange}
      warning={configOrWarning}
      validateOnConfigChange={validateOnConfigChange}
      validateViewConfig={validateViewConfig}
    >
      {children}
    </CmvProvider>
  ) : (
    <>
      <h1>{configOrWarning.title}</h1>
      {configOrWarning.preformatted ? (<pre>{configOrWarning.preformatted}</pre>) : null}
      <p>{configOrWarning.unformatted}</p>
    </>
  );
}
