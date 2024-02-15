import { ReactNode } from 'react';
import { z } from 'zod';

export type CmvConfigObject = {
    key?: string | number;
    coordinationSpace?: {
        [coordinationTypeName: string]: {
            [coordinationScopeName: string]: any;
        };
    };
    viewCoordination?: {
        [viewUid: string]: {
            coordinationScopes?: {
                [coordinationScopeName: string]: string | string[];
            };
            coordinationScopesBy?: {
                [coordinationTypeNameA: string]: {
                    [coordinationTypeNameB: string]: {
                        [coordinationScopeName: string]: string | string[];
                    };
                };
            };
        };
    };
};

type OnSpecChangeFunction = (config: CmvConfigObject) => void;
type ValidaterFunction = (config: CmvConfigObject) => void;
type InitializerFunction = (config: CmvConfigObject) => CmvConfigObject;

type OnCreateStoreFunction = (set: Function) => object;

export type CoordinationProviderProps = {
    config: CmvConfigObject;
    onSpecChange?: OnSpecChangeFunction;
    validater?: ValidaterFunction;
    initializer?: InitializerFunction;
    validateOnSpecChange?: boolean;
    children: ReactNode;
    onCreateStore?: OnCreateStoreFunction;
    remountOnKeyChange?: boolean;
    emitInitialSpecChange?: boolean;
};

export type ZodCoordinationProviderProps = {
    config: CmvConfigObject;
    onSpecChange?: OnSpecChangeFunction;
    initializer?: InitializerFunction;
    validateOnSpecChange?: boolean;
    validateConfig?: boolean;
    coordinationTypes: Record<string, z.ZodTypeAny>;
    children: ReactNode;
    onCreateStore?: OnCreateStoreFunction;
    remountOnKeyChange?: boolean;
    emitInitialSpecChange?: boolean;
};

export type CallbackPublisherProps = {
    onSpecChange?: OnSpecChangeFunction;
    validater?: ValidaterFunction;
    validateOnSpecChange?: boolean;
};

export type ViewWrapperProps = {
    config: CmvConfigObject;
    specKey: string | number;
    children: ReactNode;
};
