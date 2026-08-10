import {
  getCoordinationScopes,
  getCoordinationValue,
  getViewCoordinationValues,
  getViewMapping,
} from './access.js';
import type { CommandContext } from './context.js';
import { CliError } from './errors.js';
import { serializeValue } from './json.js';
import type {
  CoordinationScopeName,
  CoordinationTypeName,
  NormalizedSpec,
  ViewUid,
} from './types.js';

/**
 * Emit one view UID per line.
 * @param spec The spec.
 * @param ctx The command context.
 */
export function listViews(spec: NormalizedSpec, ctx: CommandContext): void {
  Object.keys(spec.viewCoordination).forEach(viewUid => ctx.writeLine(viewUid));
}

/**
 * Emit the mapping object of one view as JSON.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @param ctx The command context.
 */
export function getView(
  spec: NormalizedSpec,
  viewUid: ViewUid,
  ctx: CommandContext,
): void {
  const view = getViewMapping(spec, viewUid);
  if (view === undefined) {
    throw new CliError(`the spec does not contain a view "${viewUid}"`);
  }
  ctx.writeLine(JSON.stringify(view, null, 2));
}

/**
 * Emit one coordination type per line.
 * @param spec The spec.
 * @param ctx The command context.
 */
export function listCoordinationTypes(spec: NormalizedSpec, ctx: CommandContext): void {
  Object.keys(spec.coordinationSpace).forEach(cType => ctx.writeLine(cType));
}

/**
 * Emit one scope name of a coordination type per line.
 * @param spec The spec.
 * @param cType The coordination type.
 * @param ctx The command context.
 */
export function listScopes(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  ctx: CommandContext,
): void {
  const cScopes = getCoordinationScopes(spec, cType);
  if (cScopes === undefined) {
    ctx.warn(`the coordination space does not contain a coordination type "${cType}"`);
    return;
  }
  Object.keys(cScopes).forEach(cScope => ctx.writeLine(cScope));
}

/**
 * Emit the value of one scope of one coordination type as JSON.
 * @param spec The spec.
 * @param cType The coordination type.
 * @param cScope The coordination scope name.
 * @param ctx The command context.
 */
export function getValue(
  spec: NormalizedSpec,
  cType: CoordinationTypeName,
  cScope: CoordinationScopeName,
  ctx: CommandContext,
): void {
  const cScopes = getCoordinationScopes(spec, cType);
  if (cScopes === undefined) {
    throw new CliError(`the coordination space does not contain a coordination type "${cType}"`);
  }
  if (!Object.hasOwn(cScopes, cScope)) {
    throw new CliError(
      `the coordination space does not contain a scope "${cScope}" of coordination type "${cType}"`,
    );
  }
  ctx.writeLine(serializeValue(getCoordinationValue(spec, cType, cScope)));
}

/**
 * Emit the value which one view defines directly for one coordination type.
 * @param spec The spec.
 * @param viewUid The view UID.
 * @param cType The coordination type.
 * @param ctx The command context.
 */
export function getViewValue(
  spec: NormalizedSpec,
  viewUid: ViewUid,
  cType: CoordinationTypeName,
  ctx: CommandContext,
): void {
  if (getViewMapping(spec, viewUid) === undefined) {
    throw new CliError(`the spec does not contain a view "${viewUid}"`);
  }
  const cValues = getViewCoordinationValues(spec, viewUid);
  if (cValues === undefined || !Object.hasOwn(cValues, cType)) {
    throw new CliError(
      `the view "${viewUid}" does not define a value of coordination type "${cType}"`,
    );
  }
  ctx.writeLine(serializeValue(cValues[cType]));
}
