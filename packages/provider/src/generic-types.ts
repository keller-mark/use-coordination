type NonMetaCoordinationSpace = {
    [coordinationTypeName: string]: {
        [coordinationScopeName: string]: unknown;
    };
};

type CoordinationScopesMapping<T extends NonMetaCoordinationSpace> = {
    [K in keyof T]?: keyof T[K] | (keyof T[K])[];
};

type CoordinationScopesByMapping<T extends NonMetaCoordinationSpace> = {
    [K1 in keyof T]?: {
        [K2 in keyof T]?: {
            [K3 in keyof T[K1]]?: keyof T[K2] | (keyof T[K2])[];
        };
    };
};

type MetaCoordinationSpace<T extends NonMetaCoordinationSpace> = {
    metaCoordinationScopes?: {
        [coordinationScopeName: string]: CoordinationScopesMapping<T>;
    };
    metaCoordinationScopesBy?: {
        [coordinationScopeName: string]: CoordinationScopesByMapping<T>;
    };
} & T;

type CoordinationSpace<T extends NonMetaCoordinationSpace> = MetaCoordinationSpace<T>;

type ViewCoordination<T1 extends NonMetaCoordinationSpace, T extends CoordinationSpace<T1>> = {
	[viewId: string]: {
		coordinationScopes?: CoordinationScopesMapping<T>;
        coordinationScopesBy?: CoordinationScopesByMapping<T>;
	};
};

export type Config<
    NonMetaCoordinationSpaceT extends NonMetaCoordinationSpace,
    CoordinationSpaceT extends CoordinationSpace<NonMetaCoordinationSpaceT>,
    ViewCoordinationT extends ViewCoordination<NonMetaCoordinationSpaceT, CoordinationSpaceT>,
> = {
    key?: string | number;
    coordinationSpace?: CoordinationSpaceT;
    viewCoordination?: ViewCoordinationT;
};

export function defineConfig<
    NonMetaCoordinationSpaceT extends NonMetaCoordinationSpace,
    CoordinationSpaceT extends CoordinationSpace<NonMetaCoordinationSpaceT>,
    ViewCoordinationT extends ViewCoordination<NonMetaCoordinationSpaceT, CoordinationSpaceT>,
>(config: Config<NonMetaCoordinationSpaceT, CoordinationSpaceT, ViewCoordinationT>): Config<NonMetaCoordinationSpaceT, CoordinationSpaceT, ViewCoordinationT>{
    return config;
}
