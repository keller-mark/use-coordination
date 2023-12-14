import { useEffect, useMemo, useCallback } from 'react';
import { isEqual } from 'lodash-es';
import { buildConfigSchema } from '@use-coordination/schemas';
import { CmvProvider } from './CmvProvider.js';
import {
  logConfig,
} from './view-config-utils.js';
import { ZodCmvProviderProps, CmvConfigObject } from './prop-types.js';

export function ZodCmvProvider(props: ZodCmvProviderProps) {
  const {
    config,
    onConfigChange,
    validateConfig = true,
    validateOnConfigChange = false,
    coordinationTypes: coordinationTypesProp,
    initializer,
    children,
    onCreateStore,
  } = props;

  const coordinationTypes = useMemo(
    () => (coordinationTypesProp || {}),
    [coordinationTypesProp],
  );

  const pluginSpecificConfigSchema = useMemo(() => buildConfigSchema(
    coordinationTypes,
  ), [coordinationTypes]);

  const validater = useCallback((viewConfig: any) => {
    // Need the try-catch here since Zustand will actually
    // just catch and ignore errors in its subscription callbacks.
    pluginSpecificConfigSchema.parse(viewConfig) as CmvConfigObject;
    // Do nothing if successful.
  }, [pluginSpecificConfigSchema]);

  return (
    <CmvProvider
      config={config}
      onConfigChange={onConfigChange}
      validateOnConfigChange={validateOnConfigChange}
      validater={validater}
      initializer={initializer}
      onCreateStore={onCreateStore}
    >
      {children}
    </CmvProvider>
  );
}
