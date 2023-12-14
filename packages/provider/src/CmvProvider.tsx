import { useEffect, useMemo, useCallback, useRef, useContext, createContext } from 'react';
import { useStore } from 'zustand';
import {
  createViewConfigStore,
} from './hooks.js';
import CallbackPublisher from './CallbackPublisher.js';
import { CmvProviderProps } from './prop-types.js';

const CmvContext = createContext<any>(null);

export function useCmvStore(selector: any) {
  const store = useContext(CmvContext)
  if (!store) throw new Error('Missing BearContext.Provider in the tree')
  return useStore(store, selector);
}

export function useCmvStoreApi() {
  return useContext(CmvContext);
}


export function CmvProvider(props: CmvProviderProps) {
  const {
    config,
    onConfigChange,
    validateOnConfigChange = false,
    validater,
    initializer,
    children,
    onCreateStore,
  } = props;

  const storeRef = useRef<any>();
  if(!storeRef.current) {
    storeRef.current = createViewConfigStore(config, onCreateStore);
  }

  return (
    /* @ts-ignore */
    <CmvContext.Provider value={storeRef.current}>
      {children}
      <CallbackPublisher
          onConfigChange={onConfigChange}
          config={config}
          validateOnConfigChange={validateOnConfigChange}
          validater={validater}
        />
    </CmvContext.Provider>
  );
}
