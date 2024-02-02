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

export function defineConfig<
  CoordinationSpaceT extends CoordinationSpace,
  ViewCoordinationT extends ViewCoordination<CoordinationSpaceT>,
>(
  config: Config<CoordinationSpaceT, ViewCoordinationT>,
): Config<CoordinationSpaceT, ViewCoordinationT> {
  return config;
}

type ResolveCoordinationScope<
  CoordinationScopeT,
  CoordinationSpaceT extends CoordinationSpace,
  ViewCoordinationT extends ViewCoordination<
    CoordinationSpaceT
  >[string]["coordinationScopes"],
> = CoordinationScopeT extends
  keyof ViewCoordinationT & keyof CoordinationSpaceT
  ? CoordinationSpaceT[CoordinationScopeT][
    & ViewCoordinationT[CoordinationScopeT]
    & keyof CoordinationSpaceT[CoordinationScopeT]
  ]
  : never;

type UseCoordination<
  CoordinationSpaceT extends CoordinationSpace,
  ViewCoordinationT extends ViewCoordination<CoordinationSpaceT>,
> = {
  <
    ViewId extends keyof ViewCoordinationT,
    const CoordinationScopes extends Array<
      keyof ViewCoordinationT[ViewId]["coordinationScopes"]
    >,
  >(viewId: ViewId, scope: CoordinationScopes): [
    {
      [Scope in CoordinationScopes[number]]: ResolveCoordinationScope<
        Scope,
        CoordinationSpaceT,
        ViewCoordinationT[ViewId]["coordinationScopes"]
      >;
    },
    {
      [
        Scope in CoordinationScopes[number] as `set${Capitalize<
          Scope & string
        >}`
      ]: (
        update: ResolveCoordinationScope<
          Scope,
          CoordinationSpaceT,
          ViewCoordinationT[ViewId]["coordinationScopes"]
        >,
      ) => void;
    },
  ];
};

declare function createUseCoordination<
  CoordinationSpaceT extends CoordinationSpace,
  ViewCoordinationT extends ViewCoordination<CoordinationSpaceT>,
>(
  config: Config<CoordinationSpaceT, ViewCoordinationT>,
): UseCoordination<CoordinationSpaceT, ViewCoordinationT>;
