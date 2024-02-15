type CoordinationSpace = {
  [coordinationScopeName: string]: {
    [coordinationScope: string]: unknown;
  };
};

type CoordinationScopesMapping<T extends CoordinationSpace> = {
  [K in keyof T]?: keyof T[K] | (keyof T[K])[];
};

type CoordinationScopesByMapping<T extends CoordinationSpace> = {
  [K1 in keyof T]?: {
    [K2 in keyof T]?: {
      [K3 in keyof T[K1]]?: keyof T[K2] | (keyof T[K2])[];
    };
  };
};

type ViewCoordination<T extends CoordinationSpace> = {
  [viewId: string]: {
    coordinationScopes?: CoordinationScopesMapping<T>;
    coordinationScopesBy?: CoordinationScopesByMapping<T>;
  };
};

type Config<
  CoordinationSpaceT extends CoordinationSpace,
  ViewCoordinationT extends ViewCoordination<CoordinationSpaceT>,
> = {
  key?: string | number;
  coordinationSpace?: CoordinationSpaceT;
  viewCoordination?: ViewCoordinationT;
};

export function defineSpec<
  CoordinationSpaceT extends CoordinationSpace,
  ViewCoordinationT extends ViewCoordination<CoordinationSpaceT>,
>(
  spec: Config<CoordinationSpaceT, ViewCoordinationT>,
): Config<CoordinationSpaceT, ViewCoordinationT> {
  return spec;
}
