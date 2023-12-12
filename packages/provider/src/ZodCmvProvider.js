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
    onConfigChange,
    validateConfig = true,
    validateOnConfigChange = false,
    coordinationTypes: coordinationTypesProp,
    initializer = null,
    children,
  } = props;

  const coordinationTypes = useMemo(
    () => (coordinationTypesProp || []),
    [coordinationTypesProp],
  );

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
    coordinationTypes,
  ), [coordinationTypes]);

  // Process the view config and memoize the result:
  // - Validate.
  // - Upgrade, if legacy schema.
  // - Validate after upgrade, if legacy schema.
  // - Initialize (based on initStrategy).
  const validConfig = useMemo(() => {
    logConfig(config, 'ZodCmvProvider input config');
    if (!validateConfig) {
      return config;
    }
    // Perform second round of parsing against plugin-specific config schema.
    const parsedConfig = pluginSpecificConfigSchema.parse(config);
    logConfig(parsedConfig, 'ZodCmvProvider parsed config');
    return parsedConfig;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, pluginSpecificConfigSchema, validateConfig]);


  // Emit the upgraded/initialized view config
  // to onConfigChange if necessary.
  useEffect(() => {
    if (!isEqual(validConfig, config) && onConfigChange) {
      onConfigChange(validConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, validConfig, onConfigChange]);

  const validater = useCallback((viewConfig) => {
    // Need the try-catch here since Zustand will actually
    // just catch and ignore errors in its subscription callbacks.
    try {
      pluginSpecificConfigSchema.parse(viewConfig);
    } catch (e) {
      console.error(e);
    }
    // Do nothing if successful.
  }, [pluginSpecificConfigSchema]);

  return (
    <CmvProvider
      config={validConfig}
      onConfigChange={onConfigChange}
      validateOnConfigChange={validateOnConfigChange}
      validater={validater}
      initializer={initializer}
    >
      {children}
    </CmvProvider>
  );
}
