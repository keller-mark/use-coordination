import { useEffect } from 'react';
import { useCoordinationStoreApi } from './hooks.js';
import { CallbackPublisherProps } from './prop-types.js';

/**
 * This is a dummy component which handles
 * publishing new specs and loaders to
 * the provided callbacks on changes.
 */
export default function CallbackPublisher(props: CallbackPublisherProps) {
  const {
    onSpecChange,
    validater,
    validateOnSpecChange,
  } = props;

  const storeApi: any = useCoordinationStoreApi();

  // Spec updates are often-occurring, so
  // we want to use the "transient update" approach
  // to subscribe to spec changes.
  // Reference: https://github.com/react-spring/zustand#transient-updates-for-often-occuring-state-changes
  useEffect(() => storeApi.subscribe(
    // The function to specify which part of the store
    // we want to subscribe to (the "selector").
    // Reference: https://github.com/pmndrs/zustand?tab=readme-ov-file#using-subscribe-with-selector
    (state: any) => state.spec,
    // The function to run on each publish.
    (spec: any) => {
      if (validateOnSpecChange && spec && validater) {
        validater(spec);
      }
      if (onSpecChange && spec) {
        onSpecChange(spec);
      }
    },
    // TODO: here, should we specify the "shallow" equality function?
  ), [onSpecChange, validater, validateOnSpecChange, storeApi]);

  // Render nothing.
  return null;
}
