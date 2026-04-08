export type {
  CoordinationSpace,
  CoordinationScopesMapping,
  CoordinationScopesByMapping,
  MetaCoordinationScopes,
  MetaCoordinationScopesBy,
  ViewCoordination,
  Config,
} from '@use-coordination/types';

import type {
  CoordinationSpace,
  CoordinationScopesMapping,
  CoordinationScopesByMapping,
  MetaCoordinationScopes,
  MetaCoordinationScopesBy,
  ViewCoordination,
  Config,
} from '@use-coordination/types';

export function defineSpec<
  CoordinationSpaceT extends CoordinationSpace,
  MetaCoordinationScopesT extends MetaCoordinationScopes<CoordinationSpaceT>,
  MetaCoordinationScopesByT extends MetaCoordinationScopesBy<CoordinationSpaceT>,
  ViewCoordinationT extends ViewCoordination<
    CoordinationSpaceT,
    MetaCoordinationScopesT,
    MetaCoordinationScopesByT
  >,
>(
  spec: Config<CoordinationSpaceT, MetaCoordinationScopesT, MetaCoordinationScopesByT, ViewCoordinationT>,
): Config<CoordinationSpaceT, MetaCoordinationScopesT, MetaCoordinationScopesByT, ViewCoordinationT> {
  return spec;
}
