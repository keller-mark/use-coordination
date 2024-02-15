import {
  useEffect,
} from 'react';
import {
  useCoordinationStoreApi,
  useSetSpec,
} from './hooks.js';
import { ViewWrapperProps } from './prop-types.js';

/**
 * The wrapper for the views.
 */
export default function ViewWrapper(props: ViewWrapperProps) {
  const {
    specKey,
    spec,
    children,
  } = props;

  const storeApi = useCoordinationStoreApi();
  const setSpec = useSetSpec(storeApi);

  // Update the spec and loaders in the global state.
  // This effect is needed for the controlled component case in which
  // the store has already been initialized with a spec,
  // and we want to replace it with a new spec.
  useEffect(() => {
    setSpec(spec);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey]);

  return children as JSX.Element;
}
