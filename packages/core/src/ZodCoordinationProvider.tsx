import { useEffect, useMemo, useCallback } from 'react';
import { isEqual } from 'lodash-es';
import { buildSpecSchema } from '@use-coordination/schemas';
import { CoordinationProvider } from './CoordinationProvider.js';
import {
  logConfig,
} from './view-config-utils.js';
import { ZodCoordinationProviderProps, CmvConfigObject } from './prop-types.js';

export function ZodCoordinationProvider(props: ZodCoordinationProviderProps) {
  const {
    config,
    onSpecChange,
    validateConfig = true,
    validateOnSpecChange = false,
    coordinationTypes: coordinationTypesProp,
    initializer,
    children,
    onCreateStore,
    remountOnKeyChange,
    emitInitialSpecChange,
  } = props;

  const coordinationTypes = useMemo(
    () => (coordinationTypesProp || {}),
    [coordinationTypesProp],
  );

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

  const pluginSpecificSpecSchema = useMemo(() => buildSpecSchema(
    coordinationTypes,
  ), [coordinationTypes]);

  // Process the view config and memoize the result:
  // - Validate.
  // - Upgrade, if legacy schema.
  // - Validate after upgrade, if legacy schema.
  // - Initialize (based on initStrategy).
  const validConfig = useMemo(() => {
    logConfig(config, 'ZodCoordinationProvider input config');
    if (!validateConfig) {
      return config;
    }
    // Perform second round of parsing against plugin-specific config schema.
    // TODO: use type from Zod infer and generics.
    const parsedConfig = pluginSpecificSpecSchema.parse(config) as CmvConfigObject;
    logConfig(parsedConfig, 'ZodCoordinationProvider parsed config');
    return parsedConfig;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, pluginSpecificSpecSchema, validateConfig]);


  // Emit the upgraded/initialized view config
  // to onSpecChange if necessary.
  useEffect(() => {
    if (!isEqual(validConfig, config) && onSpecChange && emitInitialSpecChange) {
      onSpecChange(validConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, validConfig, onSpecChange]);

  const validater = useCallback((viewConfig: any) => {
    // Need the try-catch here since Zustand will actually
    // just catch and ignore errors in its subscription callbacks.
    try {
      pluginSpecificSpecSchema.parse(viewConfig);
    } catch (e) {
      console.error(e);
    }
    // Do nothing if successful.
  }, [pluginSpecificSpecSchema]);

  return (
    <CoordinationProvider
      config={validConfig}
      onSpecChange={onSpecChange}
      validateOnSpecChange={validateOnSpecChange}
      validater={validater}
      initializer={initializer}
      onCreateStore={onCreateStore}
      remountOnKeyChange={remountOnKeyChange}
      emitInitialSpecChange={emitInitialSpecChange}
    >
      {children}
    </CoordinationProvider>
  );
}
