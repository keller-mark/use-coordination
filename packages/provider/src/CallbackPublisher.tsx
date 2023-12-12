import { useEffect } from 'react';
import { useViewConfigStoreApi } from './hooks.js';
import { CallbackPublisherProps } from './prop-types.js';

/**
 * This is a dummy component which handles
 * publishing new view configs and loaders to
 * the provided callbacks on changes.
 */
export default function CallbackPublisher(props: CallbackPublisherProps) {
  const {
    onConfigChange,
    validater,
    validateOnConfigChange,
  } = props;

  const viewConfigStoreApi = useViewConfigStoreApi();

  // View config updates are often-occurring, so
  // we want to use the "transient update" approach
  // to subscribe to view config changes.
  // Reference: https://github.com/react-spring/zustand#transient-updates-for-often-occuring-state-changes
  useEffect(() => viewConfigStoreApi.subscribe(
    // The function to run on each publish.
    (viewConfig: any) => {
      if (validateOnConfigChange && viewConfig && validater) {
        validater(viewConfig);
      }
      if (onConfigChange && viewConfig) {
        onConfigChange(viewConfig);
      }
    },
    // The function to specify which part of the store
    // we want to subscribe to.
    (state: any) => state.viewConfig,
  ), [onConfigChange, validater, validateOnConfigChange, viewConfigStoreApi]);

  // Render nothing.
  return null;
}
