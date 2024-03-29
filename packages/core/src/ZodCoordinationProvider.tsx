import { useEffect, useMemo, useCallback } from 'react';
import { isEqual } from 'lodash-es';
import { buildSpecSchema } from '@use-coordination/schemas';
import { CoordinationProvider } from './CoordinationProvider.js';
import {
  logSpec,
} from './view-config-utils.js';
import { ZodCoordinationProviderProps, CmvConfigObject } from './prop-types.js';

export function ZodCoordinationProvider(props: ZodCoordinationProviderProps) {
  const {
    spec,
    onSpecChange,
    validateSpec = true,
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

  const pluginSpecificSpecSchema = useMemo(() => buildSpecSchema(
    coordinationTypes,
  ), [coordinationTypes]);

  // Process the spec and memoize the result:
  // - Validate.
  // - Upgrade, if legacy schema.
  // - Validate after upgrade, if legacy schema.
  // - Initialize (based on initStrategy).
  const validConfig = useMemo(() => {
    logSpec(spec, 'ZodCoordinationProvider input spec');
    if (!validateSpec) {
      return spec;
    }
    // Perform second round of parsing against plugin-specific spec schema.
    // TODO: use type from Zod infer and generics.
    const parsedConfig = pluginSpecificSpecSchema.parse(spec) as CmvConfigObject;
    logSpec(parsedConfig, 'ZodCoordinationProvider parsed spec');
    return parsedConfig;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, pluginSpecificSpecSchema, validateSpec]);


  // Emit the upgraded/initialized spec
  // to onSpecChange if necessary.
  useEffect(() => {
    if (!isEqual(validConfig, spec) && onSpecChange && emitInitialSpecChange) {
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
      spec={validConfig}
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
