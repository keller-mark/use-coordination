import React, { useEffect, useMemo, useCallback } from 'react';
import {
  ThemeProvider,
  StylesProvider,
} from '@material-ui/core';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { isEqual } from 'lodash-es';
import { buildConfigSchema, latestConfigSchema } from '@mm-cmv/schemas';
import { muiTheme } from './shared-mui/styles.js';
import {
  ViewConfigProvider,
  createViewConfigStore,
  AuxiliaryProvider,
  createAuxiliaryStore,
} from './state/hooks.js';

import VitessceGrid from './VitessceGrid.js';
import { Warning } from './Warning.js';
import CallbackPublisher from './CallbackPublisher.js';
import {
  initialize,
  logConfig,
} from './view-config-utils.js';
import { createLoaders } from './vitessce-grid-utils.js';
import { createGenerateClassName } from './mui-utils.js';


/**
 * The Vitessce component.
 * @param {object} props
 * @param {object} props.config A Vitessce view config.
 * If the config is valid, the VitessceGrid will be rendered as a child.
 * If the config is invalid, a Warning will be rendered instead.
 * @param {undefined|number} props.rowHeight Row height for grid layout. Optional.
 * @param {number} props.height Total height for grid layout. Optional.
 * @param {string} props.theme The theme, used for styling as
 * light or dark. Optional. By default, "dark"
 * @param {function} props.onWarn A callback for warning messages. Optional.
 * @param {function} props.onConfigChange A callback for view config
 * updates. Optional.
 * @param {function} props.onLoaderChange A callback for loader
 * updates. Optional.
 * @param {boolean} props.validateConfig Whether to validate or not. Only to be
 * set to false in controlled component situations, where bypassing validation
 * is required for performance, and the parent knows the config
 * is already valid (e.g., it originated from onConfigChange). By default, true.
 * @param {boolean} props.validateOnConfigChange Whether to validate
 * against the view config schema when publishing changes. Use for debugging
 * purposes, as this may have a performance impact. By default, false.
 * @param {null|string} props.uid A unique identifier for this Vitessce instance,
 * for the purpose of avoiding CSS autogenerated class name conflicts. Must be valid as part
 * of a CSS class name string.
 * @param {array} props.viewTypes Plugin view types.
 * @param {array} props.fileTypes Plugin file types.
 * @param {array} props.jointFileTypes Plugin joint file types.
 * @param {array} props.coordinationTypes Plugin coordination types.
 * @param {null|object} props.warning A warning to render within the Vitessce grid,
 * provided by the parent.
 */
export function VitS(props) {
  const {
    config,
    stores,
    rowHeight,
    height,
    theme,
    onWarn,
    onConfigChange,
    onLoaderChange,
    validateConfig = true,
    validateOnConfigChange = false,
    isBounded = false,
    uid = null,
    viewTypes: viewTypesProp,
    fileTypes: fileTypesProp,
    jointFileTypes: jointFileTypesProp,
    coordinationTypes: coordinationTypesProp,
    warning,
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

  const generateClassName = useMemo(() => createGenerateClassName(uid), [uid]);

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
    const result = latestConfigSchema.safeParse(config);
    if (result.success) {
      const upgradedConfig = result.data;
      logConfig(upgradedConfig, 'parsed view config');
      // Perform second round of parsing against plugin-specific config schema.
      const pluginSpecificResult = pluginSpecificConfigSchema.safeParse(upgradedConfig);
      // Initialize the view config according to the initStrategy.
      if (pluginSpecificResult.success) {
        try {
          const upgradedConfigWithValidPlugins = pluginSpecificResult.data;
          const initializedConfig = initialize(
            upgradedConfigWithValidPlugins,
            jointFileTypes,
            coordinationTypes,
            viewTypes,
          );
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

  const queryClient = useMemo(() => new QueryClient({
    // Reference: https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  }), [configKey]);

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
      const loaders = createLoaders(
        configOrWarning.datasets,
        configOrWarning.description,
        fileTypes,
        coordinationTypes,
        stores,
      );
      return createViewConfigStore(loaders, configOrWarning);
    }
    // No config found, so clear the loaders.
    return createViewConfigStore(null, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, configKey]);

  return success ? (
    <StylesProvider generateClassName={generateClassName}>
      <ThemeProvider theme={muiTheme[theme]}>
        <QueryClientProvider client={queryClient}>
          <ViewConfigProvider key={configKey} createStore={createViewConfigStoreClosure}>
            <AuxiliaryProvider createStore={createAuxiliaryStore}>
              <VitessceGrid
                success={success}
                configKey={configKey}
                viewTypes={viewTypes}
                fileTypes={fileTypes}
                coordinationTypes={coordinationTypes}
                config={configOrWarning}
                rowHeight={rowHeight}
                height={height}
                theme={theme}
                isBounded={isBounded}
              />
              <CallbackPublisher
                onWarn={onWarn}
                onConfigChange={onConfigChange}
                onLoaderChange={onLoaderChange}
                validateOnConfigChange={validateOnConfigChange}
                pluginSpecificConfigSchema={pluginSpecificConfigSchema}
              />
            </AuxiliaryProvider>
          </ViewConfigProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StylesProvider>
  ) : (
    <StylesProvider generateClassName={generateClassName}>
      <ThemeProvider theme={muiTheme[theme]}>
        <Warning {...configOrWarning} />
      </ThemeProvider>
    </StylesProvider>
  );
}