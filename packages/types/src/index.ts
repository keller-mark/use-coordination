export type CoordinationSpace = {
  [coordinationScopeName: string]: {
    [coordinationScope: string]: unknown;
  };
};

export type CoordinationScopesMapping<T extends CoordinationSpace> = {
  [K in keyof T]?: keyof T[K] | (keyof T[K])[];
};

export type CoordinationScopesByMapping<T extends CoordinationSpace> = {
  [K1 in keyof T]?: {
    [K2 in keyof T]?: {
      [K3 in keyof T[K1]]?: keyof T[K2] | (keyof T[K2])[];
    };
  };
};

// Each meta-scope value maps coordination types to scope names within those types.
export type MetaCoordinationScopes<T extends CoordinationSpace> = {
  [metaScopeName: string]: CoordinationScopesMapping<T>;
};

// Each meta-by-scope value maps coordination types to scopes-by mappings.
export type MetaCoordinationScopesBy<T extends CoordinationSpace> = {
  [metaScopeName: string]: CoordinationScopesByMapping<T>;
};

export type ViewCoordination<
  T extends CoordinationSpace,
  MetaScopes extends MetaCoordinationScopes<T>,
  MetaScopesBy extends MetaCoordinationScopesBy<T>,
> = {
  [viewId: string]: {
    coordinationScopes?: CoordinationScopesMapping<T>;
    coordinationScopesBy?: CoordinationScopesByMapping<T>;
    metaCoordinationScopes?: keyof MetaScopes & string | (keyof MetaScopes & string)[];
    metaCoordinationScopesBy?: keyof MetaScopesBy & string | (keyof MetaScopesBy & string)[];
  };
};

export type Config<
  CoordinationSpaceT extends CoordinationSpace,
  MetaCoordinationScopesT extends MetaCoordinationScopes<CoordinationSpaceT>,
  MetaCoordinationScopesByT extends MetaCoordinationScopesBy<CoordinationSpaceT>,
  ViewCoordinationT extends ViewCoordination<
    CoordinationSpaceT,
    MetaCoordinationScopesT,
    MetaCoordinationScopesByT
  >,
> = {
  key?: string | number;
  coordinationSpace?: CoordinationSpaceT;
  metaCoordination?: {
    coordinationScopes?: MetaCoordinationScopesT;
    coordinationScopesBy?: MetaCoordinationScopesByT;
  };
  viewCoordination?: ViewCoordinationT;
};
