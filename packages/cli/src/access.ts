import type {
  CliCoordinationValues,
  CliView,
  CoordinationScopeName,
  CoordinationTypeName,
  NormalizedSpec,
  ViewUid,
} from './types.js';

/**
 * Get the scopes (and their values) for one coordination type.
 * @param spec The spec.
 * @param cType The coordination type.
 * @returns The mapping from scope name to coordination value,
 * or undefined if the coordination type is absent.
 */
export function getCoordinationScopes(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
): Record<CoordinationScopeName, unknown> | undefined {
  if (Object.hasOwn(spec.coordinationSpace, cType)) {
    return spec.coordinationSpace[cType];
  }
  return undefined;
}

export function hasCoordinationType(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
): boolean {
  return Object.hasOwn(spec.coordinationSpace, cType);
}

export function hasCoordinationScope(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  cScope: CoordinationScopeName,
): boolean {
  const cScopes = getCoordinationScopes(spec, cType);
  return cScopes !== undefined && Object.hasOwn(cScopes, cScope);
}

/**
 * Get the coordination value for one scope of one coordination type.
 * @param spec The spec.
 * @param cType The coordination type.
 * @param cScope The coordination scope.
 * @returns The coordination value, or undefined if the scope is absent.
 */
export function getCoordinationValue(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  cScope: CoordinationScopeName,
): unknown {
  const cScopes = getCoordinationScopes(spec, cType);
  if (cScopes === undefined || !Object.hasOwn(cScopes, cScope)) {
    return undefined;
  }
  return cScopes[cScope];
}

/**
 * Get the view mapping object for one view.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @returns The view mapping object, or undefined if the view is absent.
 */
export function getViewMapping(
  spec: NormalizedSpec,
  viewUid: ViewUid,
): CliView | undefined {
  if (Object.hasOwn(spec.viewCoordination, viewUid)) {
    return spec.viewCoordination[viewUid];
  }
  return undefined;
}

export function hasView(spec: NormalizedSpec, viewUid: ViewUid): boolean {
  return Object.hasOwn(spec.viewCoordination, viewUid);
}

/**
 * Get the values which one view defines directly (its `coordinationValues`).
 * @param spec The spec.
 * @param viewUid The view UID.
 * @returns The mapping from coordination type to value,
 * or undefined if the view is absent or defines no values directly.
 */
export function getViewCoordinationValues(
  spec: NormalizedSpec,
  viewUid: ViewUid,
): CliCoordinationValues | undefined {
  return getViewMapping(spec, viewUid)?.coordinationValues;
}

export function hasViewCoordinationValue(
  spec: NormalizedSpec,
  viewUid: ViewUid,
  cType: CoordinationTypeName,
): boolean {
  const cValues = getViewCoordinationValues(spec, viewUid);
  return cValues !== undefined && Object.hasOwn(cValues, cType);
}
