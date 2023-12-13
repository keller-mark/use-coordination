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

type OnConfigChangeFunction = (config: CmvConfigObject) => void;
type ValidaterFunction = (config: CmvConfigObject) => void;
type InitializerFunction = (config: CmvConfigObject) => CmvConfigObject;

type OnCreateStoreFunction = (set: Function) => object;

export type CmvProviderProps = {
    config: CmvConfigObject;
    onConfigChange?: OnConfigChangeFunction;
    validater?: ValidaterFunction;
    initializer?: InitializerFunction;
    validateOnConfigChange?: boolean;
    children: ReactNode;
    onCreateStore?: OnCreateStoreFunction;
};

export type ZodCmvProviderProps = {
    config: CmvConfigObject;
    onConfigChange?: OnConfigChangeFunction;
    initializer?: InitializerFunction;
    validateOnConfigChange?: boolean;
    validateConfig?: boolean;
    coordinationTypes: Record<string, z.ZodTypeAny>;
    children: ReactNode;
    onCreateStore?: OnCreateStoreFunction;
};

export type CallbackPublisherProps = {
    onConfigChange?: OnConfigChangeFunction;
    validater?: ValidaterFunction;
    validateOnConfigChange?: boolean;
};

export type ViewWrapperProps = {
    config: CmvConfigObject;
    configKey: string | number;
    children: ReactNode;
};
