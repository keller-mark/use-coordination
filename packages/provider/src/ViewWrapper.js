import React, {
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  useViewConfigStoreApi,
  useSetViewConfig,
} from './state/hooks.js';

/**
 * The wrapper for the views.
 * @param {object} props
 * @param {number} props.rowHeight The height of each grid row. Optional.
 * @param {object} props.config The view config.
 * @param {string} props.theme The theme name.
 * @param {number} props.height Total height for grid. Optional.
 * @param {function} props.onWarn A callback for warning messages. Optional.
 * @param {PluginViewType[]} props.viewTypes
 * @param {PluginFileType[]} props.fileTypes
 * @param {PluginCoordinationType[]} props.coordinationTypes
 */
export default function ViewWrapper(props) {
  const {
    configKey,
    config,
    children,
  } = props;

  const viewConfigStoreApi = useViewConfigStoreApi();
  const setViewConfig = useSetViewConfig(viewConfigStoreApi);

  // Update the view config and loaders in the global state.
  // This effect is needed for the controlled component case in which
  // the store has already been initialized with a view config,
  // and we want to replace it with a new view config.
  useEffect(() => {
    setViewConfig(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  return children;
}
