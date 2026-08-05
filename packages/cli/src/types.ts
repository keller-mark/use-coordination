import type {
  Config,
  CoordinationSpace,
  CoordinationScopesMapping,
  CoordinationScopesByMapping,
  MetaCoordinationScopes,
  MetaCoordinationScopesBy,
  ViewCoordination,
} from '@use-coordination/types';

/**
 * Any value that can round-trip through JSON.parse/JSON.stringify.
 * Coordination values read from the command line or from stdin are of this type.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type CoordinationTypeName = string;
export type CoordinationScopeName = string;
export type ViewUid = string;

// The CLI is not aware of any plugin coordination types,
// so it uses the generic (string-keyed) coordination space.
export type CliCoordinationSpace = CoordinationSpace;
export type CliCoordinationScopes = CoordinationScopesMapping<CliCoordinationSpace>;
export type CliCoordinationScopesBy = CoordinationScopesByMapping<CliCoordinationSpace>;
export type CliMetaCoordinationScopes = MetaCoordinationScopes<CliCoordinationSpace>;
export type CliMetaCoordinationScopesBy = MetaCoordinationScopesBy<CliCoordinationSpace>;

/**
 * The view mapping object for a single view.
 * The one-or-more meta scope names allowed by the JSON schema are
 * normalized to arrays by `normalizeSpec`, which matches the
 * representation used internally by `CmvConfig`.
 */
export interface CliView {
  coordinationScopes?: CliCoordinationScopes;
  coordinationScopesBy?: CliCoordinationScopesBy;
  metaCoordinationScopes?: CoordinationScopeName[];
  metaCoordinationScopesBy?: CoordinationScopeName[];
}

export type CliViewCoordination = {
  [viewUid: ViewUid]: CliView;
};

export interface CliMetaCoordination {
  coordinationScopes?: CliMetaCoordinationScopes;
  coordinationScopesBy?: CliMetaCoordinationScopesBy;
}

/**
 * A spec in the shape that every CLI command consumes and produces:
 * `coordinationSpace` and `viewCoordination` are always present
 * (as in the output of `usecoord init`), and empty sub-objects have been pruned.
 */
export interface NormalizedSpec {
  key?: string | number;
  coordinationSpace: CliCoordinationSpace;
  metaCoordination?: CliMetaCoordination;
  viewCoordination: CliViewCoordination;
}

// Compile-time check that the normalized spec is a valid `Config`
// as defined by @use-coordination/types.
type AssertExtends<T extends U, U> = T;
export type NormalizedSpecIsConfig = AssertExtends<
  NormalizedSpec,
  Config<
    CliCoordinationSpace,
    CliMetaCoordinationScopes,
    CliMetaCoordinationScopesBy,
    CliViewCoordination
  >
>;
// Compile-time check that the view mapping objects are valid `ViewCoordination` entries.
export type CliViewCoordinationIsViewCoordination = AssertExtends<
  CliViewCoordination,
  ViewCoordination<
    CliCoordinationSpace,
    CliMetaCoordinationScopes,
    CliMetaCoordinationScopesBy
  >
>;
