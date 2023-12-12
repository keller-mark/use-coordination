import { CoordinationType } from '@mm-cmv/schemas';
import { ReactNode } from 'react';

export type CmvConfigObject = {
    uid?: string | number;
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
    coordinationTypes: CoordinationType<any>[];
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
