import { useEffect } from 'react';
import { useViewConfigStoreApi } from './hooks.js';


/**
 * This is a dummy component which handles
 * publishing new view configs and loaders to
 * the provided callbacks on changes.
 * @param {object} props
 * @param {function} props.onConfigChange A callback function
 * to execute on each change of the Vitessce view config.
 * @param {function} props.onLoaderChange A callback function
 * to execute on each change of the loaders object.
 * @param {boolean} props.validateOnConfigChange Whether to validate
 * against the view config schema when publishing changes.
 */
export default function CallbackPublisher(props) {
  const {
    onConfigChange,
    validateViewConfig,
    validateOnConfigChange,
  } = props;


  const viewConfigStoreApi = useViewConfigStoreApi();

  // View config updates are often-occurring, so
  // we want to use the "transient update" approach
  // to subscribe to view config changes.
  // Reference: https://github.com/react-spring/zustand#transient-updates-for-often-occuring-state-changes
  useEffect(() => viewConfigStoreApi.subscribe(
    // The function to run on each publish.
    (viewConfig) => {
      if (validateOnConfigChange && viewConfig) {
        validateViewConfig(viewConfig);
      }
      if (onConfigChange && viewConfig) {
        onConfigChange(viewConfig);
      }
    },
    // The function to specify which part of the store
    // we want to subscribe to.
    state => state.viewConfig,
  ), [onConfigChange, validateViewConfig, validateOnConfigChange, viewConfigStoreApi]);

  // Render nothing.
  return null;
}
