import { useEffect, useMemo } from 'react';
import { useCmvStoreApi } from './CmvProvider.js';
import { CallbackPublisherProps } from './prop-types.js';
import { useSetViewConfig } from './hooks.js';
import { cloneDeep } from 'lodash-es';

/**
 * This is a dummy component which handles
 * publishing new view configs and loaders to
 * the provided callbacks on changes.
 */
export default function CallbackPublisher(props: CallbackPublisherProps) {
  const {
    config,
    onConfigChange,
    validater,
    validateOnConfigChange,
  } = props;

  const storeApi = useCmvStoreApi();
  const setViewConfig = useSetViewConfig(storeApi);

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

  useEffect(() => {
    const validConfig = validater ? validater(config) : config;
    // If the configKey changed, then set a new initial config value.
    storeApi.setState({
      initialConfig: cloneDeep(validConfig),
    });
  }, [configKey]);

  useEffect(() => {
    // If the configKey changed, then set a new initial config value.
    const validConfig = validateOnConfigChange && validater ? validater(config) : config;
    setViewConfig(validConfig);
  }, [config, setViewConfig]);

  useEffect(() => storeApi.subscribe(
    (state: any) => state.viewConfig,
    (viewConfig: any) => {
      if (onConfigChange) {
        onConfigChange(viewConfig);
      }
    },
  ), [onConfigChange]);
 
  // Render nothing.
  return null;
}
