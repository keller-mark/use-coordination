import { useEffect } from 'react';
import { useCoordinationStoreApi } from './hooks.js';
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

  const storeApi = useCoordinationStoreApi();

  // View config updates are often-occurring, so
  // we want to use the "transient update" approach
  // to subscribe to view config changes.
  // Reference: https://github.com/react-spring/zustand#transient-updates-for-often-occuring-state-changes
  useEffect(() => storeApi.subscribe(
    // The function to run on each publish.
    (spec: any) => {
      if (validateOnConfigChange && spec && validater) {
        validater(spec);
      }
      if (onConfigChange && spec) {
        onConfigChange(spec);
      }
    },
    // The function to specify which part of the store
    // we want to subscribe to.
    (state: any) => state.spec,
  ), [onConfigChange, validater, validateOnConfigChange, storeApi]);

  // Render nothing.
  return null;
}
