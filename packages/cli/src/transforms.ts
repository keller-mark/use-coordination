import {
  getCoordinationScopes,
  getViewMapping,
  hasCoordinationScope,
  hasView,
} from './access.js';
import {
  getOrAddView,
  getScopeNames,
  withConfig,
} from './cmv.js';
import type { RevivedCoordinationInput } from './cmv.js';
import type { CommandContext } from './context.js';
import { CliError } from './errors.js';
import { isEmptyObject, omitKey } from './json.js';
import { buildView } from './spec.js';
import type {
  CliCoordinationSpace,
  CliView,
  CliViewCoordination,
  CoordinationScopeName,
  CoordinationTypeName,
  JsonValue,
  NormalizedSpec,
  ViewUid,
} from './types.js';

function withViewCoordination(
  spec: NormalizedSpec,
  viewCoordination: CliViewCoordination,
): NormalizedSpec {
  return { ...spec, viewCoordination };
}

function withCoordinationSpace(
  spec: NormalizedSpec,
  coordinationSpace: CliCoordinationSpace,
): NormalizedSpec {
  return { ...spec, coordinationSpace };
}

function setView(spec: NormalizedSpec, viewUid: ViewUid, view: CliView): NormalizedSpec {
  return withViewCoordination(spec, { ...spec.viewCoordination, [viewUid]: view });
}

/**
 * Add a view with no scopes attached. No-op if the view already exists.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @returns The next spec.
 */
export function addView(spec: NormalizedSpec, viewUid: ViewUid): NormalizedSpec {
  if (hasView(spec, viewUid)) {
    return spec;
  }
  return setView(spec, viewUid, {});
}

/**
 * Remove a view. No-op if the view is absent.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @returns The next spec.
 */
export function removeView(spec: NormalizedSpec, viewUid: ViewUid): NormalizedSpec {
  if (!hasView(spec, viewUid)) {
    return spec;
  }
  return withViewCoordination(spec, omitKey(spec.viewCoordination, viewUid));
}

/**
 * Add a scope of a coordination type, using a caller-provided scope name.
 * This is a deterministic upsert: the value is only replaced when one is passed.
 * @param spec The spec.
 * @param cType The coordination type.
 * @param cScope The coordination scope name.
 * @param cValue The coordination value, or undefined to leave it alone.
 * @returns The next spec.
 */
export function addCoordinationScope(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  cScope: CoordinationScopeName,
  cValue: JsonValue | undefined,
): NormalizedSpec {
  const existingScopes = getCoordinationScopes(spec, cType);
  const nextScopes = { ...(existingScopes ?? {}) };
  if (cValue !== undefined) {
    nextScopes[cScope] = cValue;
  } else if (!Object.hasOwn(nextScopes, cScope)) {
    // Match the initial value used by `CmvConfig.addCoordination`.
    nextScopes[cScope] = null;
  }
  return withCoordinationSpace(spec, { ...spec.coordinationSpace, [cType]: nextScopes });
}

/**
 * Add a scope of a coordination type, using an auto-generated scope name
 * (which is reported via the context).
 * @param spec The spec.
 * @param cType The coordination type.
 * @param cValue The coordination value, or undefined for no initial value.
 * @param ctx The command context.
 * @returns The next spec.
 */
export function addAutoNamedCoordinationScope(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  cValue: JsonValue | undefined,
  ctx: CommandContext,
): NormalizedSpec {
  return withConfig(spec, (config) => {
    const [cScope] = config.addCoordination([cType]);
    if (cValue !== undefined) {
      cScope.setValue(cValue);
    }
    ctx.info(`added scope "${cScope.cScope}" of coordination type "${cType}"`);
  });
}

/**
 * Upsert the value of a scope, creating the scope if needed.
 * Maps to `CmvConfig.setCoordinationValue`.
 * @param spec The spec.
 * @param cType The coordination type.
 * @param cScope The coordination scope name.
 * @param cValue The coordination value.
 * @returns The next spec.
 */
export function setCoordinationValue(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  cScope: CoordinationScopeName,
  cValue: JsonValue,
): NormalizedSpec {
  return withConfig(spec, (config) => {
    config.setCoordinationValue(cType, cScope, cValue);
  });
}

/**
 * Remove a scope, dropping its coordination type if it becomes empty.
 * No-op if the scope is absent.
 * @param spec The spec.
 * @param cType The coordination type.
 * @param cScope The coordination scope name.
 * @returns The next spec.
 */
export function removeCoordination(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  cScope: CoordinationScopeName,
): NormalizedSpec {
  const existingScopes = getCoordinationScopes(spec, cType);
  if (existingScopes === undefined || !Object.hasOwn(existingScopes, cScope)) {
    return spec;
  }
  const nextScopes = omitKey(existingScopes, cScope);
  if (isEmptyObject(nextScopes)) {
    return withCoordinationSpace(spec, omitKey(spec.coordinationSpace, cType));
  }
  return withCoordinationSpace(spec, { ...spec.coordinationSpace, [cType]: nextScopes });
}

/**
 * Map a view to a scope of a coordination type.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @param cType The coordination type.
 * @param cScope The coordination scope name.
 * @param ctx The command context.
 * @returns The next spec.
 */
export function useCoordination(
  spec: NormalizedSpec,
  viewUid: ViewUid,
  cType: CoordinationTypeName,
  cScope: CoordinationScopeName,
  ctx: CommandContext,
): NormalizedSpec {
  const view = getViewMapping(spec, viewUid);
  if (view === undefined) {
    throw new CliError(
      `the spec does not contain a view "${viewUid}" (add it with "usecoord add-view ${viewUid}")`,
    );
  }
  if (!hasCoordinationScope(spec, cType, cScope)) {
    ctx.warn(
      `the coordination space does not contain a scope "${cScope}" of coordination type "${cType}"`,
    );
  }
  const nextView = buildView({
    ...view,
    coordinationScopes: { ...(view.coordinationScopes ?? {}), [cType]: cScope },
  });
  return setView(spec, viewUid, nextView);
}

/**
 * Set a value on a view directly, without a coordination scope as an
 * intermediary (`viewCoordination[view].coordinationValues[type]`).
 * @param spec The spec.
 * @param viewUid The view UID.
 * @param cType The coordination type.
 * @param cValue The coordination value.
 * @param ctx The command context.
 * @returns The next spec.
 */
export function setViewCoordinationValue(
  spec: NormalizedSpec,
  viewUid: ViewUid,
  cType: CoordinationTypeName,
  cValue: JsonValue,
  ctx: CommandContext,
): NormalizedSpec {
  const view = getViewMapping(spec, viewUid);
  if (view === undefined) {
    throw new CliError(
      `the spec does not contain a view "${viewUid}" (add it with "usecoord add-view ${viewUid}")`,
    );
  }
  if (view.coordinationScopes !== undefined && Object.hasOwn(view.coordinationScopes, cType)) {
    ctx.warn(
      `the view "${viewUid}" is also mapped to a scope of coordination type "${cType}"; the value set here takes precedence`,
    );
  }
  const nextView = buildView({
    ...view,
    coordinationValues: { ...(view.coordinationValues ?? {}), [cType]: cValue },
  });
  return setView(spec, viewUid, nextView);
}

/**
 * Remove a coordination type from a view's `coordinationValues`.
 * No-op if the view or the coordination type is absent.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @param cType The coordination type.
 * @returns The next spec.
 */
export function unsetViewCoordinationValue(
  spec: NormalizedSpec,
  viewUid: ViewUid,
  cType: CoordinationTypeName,
): NormalizedSpec {
  const view = getViewMapping(spec, viewUid);
  if (view === undefined || view.coordinationValues === undefined
    || !Object.hasOwn(view.coordinationValues, cType)) {
    return spec;
  }
  const nextView = buildView({
    ...view,
    coordinationValues: omitKey(view.coordinationValues, cType),
  });
  return setView(spec, viewUid, nextView);
}

/**
 * Remove a coordination type from a view's `coordinationScopes`.
 * No-op if the view or the coordination type is absent.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @param cType The coordination type.
 * @returns The next spec.
 */
export function unuseCoordination(
  spec: NormalizedSpec,
  viewUid: ViewUid,
  cType: CoordinationTypeName,
): NormalizedSpec {
  const view = getViewMapping(spec, viewUid);
  if (view === undefined || view.coordinationScopes === undefined
    || !Object.hasOwn(view.coordinationScopes, cType)) {
    return spec;
  }
  const nextView = buildView({
    ...view,
    coordinationScopes: omitKey(view.coordinationScopes, cType),
  });
  return setView(spec, viewUid, nextView);
}

export interface LinkViewsOptions {
  scope?: CoordinationScopeName;
  value?: JsonValue;
}

/**
 * Create a shared scope of a coordination type and attach it to every named
 * view, creating any missing views. Maps to `CmvConfig.linkViews`.
 * @param spec The spec.
 * @param cType The coordination type.
 * @param viewUids The view UIDs to link.
 * @param options The scope name (for a deterministic upsert) and initial value.
 * @param ctx The command context.
 * @returns The next spec.
 */
export function linkViews(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  viewUids: readonly ViewUid[],
  options: LinkViewsOptions,
  ctx: CommandContext,
): NormalizedSpec {
  const { scope, value } = options;
  if (viewUids.length === 0) {
    throw new CliError('expected at least one view UID after --views');
  }
  if (scope !== undefined) {
    // Deterministic (idempotent) case.
    return viewUids.reduce(
      (prevSpec, viewUid) => useCoordination(
        addView(prevSpec, viewUid),
        viewUid,
        cType,
        scope,
        ctx,
      ),
      addCoordinationScope(spec, cType, scope, value),
    );
  }
  // Auto-named case.
  return withConfig(spec, (config) => {
    const views = viewUids.map(viewUid => getOrAddView(config, viewUid));
    const prevScopeNames = new Set(getScopeNames(config, cType));
    config.linkViews(views, [cType], value === undefined ? null : [value]);
    getScopeNames(config, cType)
      .filter(cScope => !prevScopeNames.has(cScope))
      .forEach((cScope) => {
        ctx.info(`linked views on scope "${cScope}" of coordination type "${cType}"`);
      });
  });
}

export interface LinkViewsByObjectOptions {
  meta: boolean;
  scopePrefix?: string;
}

/**
 * Set up multi-level and/or meta-coordination across the named views,
 * creating any missing views. Maps to `CmvConfig.linkViewsByObject`.
 * @param spec The spec.
 * @param viewUids The view UIDs to link.
 * @param input The (revived) coordination input object.
 * @param options Whether to use meta-coordination, and the scope name prefix.
 * @returns The next spec.
 */
export function linkViewsByObject(
  spec: NormalizedSpec,
  viewUids: readonly ViewUid[],
  input: RevivedCoordinationInput,
  options: LinkViewsByObjectOptions,
): NormalizedSpec {
  const { meta, scopePrefix } = options;
  if (viewUids.length === 0) {
    throw new CliError('expected at least one view UID after --views');
  }
  return withConfig(spec, (config) => {
    const views = viewUids.map(viewUid => getOrAddView(config, viewUid));
    config.linkViewsByObject(views, input, {
      meta,
      scopePrefix: scopePrefix === undefined ? null : scopePrefix,
    });
  });
}
