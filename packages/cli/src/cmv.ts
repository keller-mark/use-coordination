import { CmvConfig, CoordinationLevel as CL } from '@use-coordination/config';
import { CliError } from './errors.js';
import { isPlainObject } from './json.js';
import { normalizeSpec } from './spec.js';
import type { CoordinationTypeName, JsonValue, NormalizedSpec, ViewUid } from './types.js';

/**
 * The CLI does not register plugin coordination types,
 * so the generic (unvalidated) flavor of `CmvConfig` is used.
 */
export type CmvConfigInstance = CmvConfig;
export type CmvConfigViewInstance = ReturnType<CmvConfigInstance['addView']>;

/** The sentinel used to represent `CL(...)` in JSON input. */
export const CL_SENTINEL = '$CL';

/**
 * The shape of the `input` argument of `CmvConfig.linkViewsByObject`,
 * after the `{"$CL": ...}` sentinels have been revived into
 * `CoordinationLevel` instances.
 */
export type RevivedCoordinationInput = Record<string, unknown>;

/**
 * Run a function against the object-oriented API, using an existing spec
 * as the starting point.
 * @param spec The spec to start from.
 * @param fn The function to run, which may mutate the config instance.
 * @returns The resulting (normalized) spec.
 */
export function withConfig(
  spec: NormalizedSpec,
  fn: (config: CmvConfigInstance) => void,
): NormalizedSpec {
  const config = CmvConfig.fromJSON(spec);
  fn(config);
  return normalizeSpec(config.toJSON());
}

/**
 * Get the view instance for a view UID, adding the view if it is absent.
 * @param config The config instance.
 * @param viewUid The view UID.
 * @returns The view instance.
 */
export function getOrAddView(
  config: CmvConfigInstance,
  viewUid: ViewUid,
): CmvConfigViewInstance {
  if (Object.hasOwn(config.config.viewCoordination, viewUid)) {
    return config.config.viewCoordination[viewUid];
  }
  return config.addView(viewUid);
}

/**
 * Get the scope names which currently exist for a coordination type.
 * @param config The config instance.
 * @param cType The coordination type.
 * @returns The scope names.
 */
export function getScopeNames(
  config: CmvConfigInstance,
  cType: CoordinationTypeName,
): string[] {
  if (Object.hasOwn(config.config.coordinationSpace, cType)) {
    return Object.keys(config.config.coordinationSpace[cType]);
  }
  return [];
}

/**
 * Revive the `{"$CL": ...}` sentinels within a JSON value into
 * `CoordinationLevel` instances, so that the result can be passed to
 * `CmvConfig.linkViewsByObject`.
 * @param input The JSON value to revive.
 * @returns The revived value.
 */
export function reviveCoordinationInput(input: JsonValue): unknown {
  if (Array.isArray(input)) {
    return input.map(reviveCoordinationInput);
  }
  if (isPlainObject(input)) {
    const keys = Object.keys(input);
    if (keys.includes(CL_SENTINEL)) {
      if (keys.length > 1) {
        throw new CliError(
          `"${CL_SENTINEL}" must be the only key of the object which contains it`,
        );
      }
      const levelValue = reviveCoordinationInput(input[CL_SENTINEL]);
      if (Array.isArray(levelValue)) {
        return CL(levelValue as RevivedCoordinationInput[]);
      }
      if (isPlainObject(levelValue)) {
        return CL(levelValue as RevivedCoordinationInput);
      }
      throw new CliError(
        `expected the value of "${CL_SENTINEL}" to be an object or an array of objects`,
      );
    }
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, reviveCoordinationInput(value)]),
    );
  }
  return input;
}

/**
 * Revive a JSON value which is expected to be a coordination input object
 * (the `--input` argument of `link-views-by-object`).
 * @param input The JSON value to revive.
 * @returns The revived object.
 */
export function reviveCoordinationInputObject(input: JsonValue): RevivedCoordinationInput {
  const revived = reviveCoordinationInput(input);
  if (!isPlainObject(revived)) {
    throw new CliError('expected --input to be a JSON object of coordination types');
  }
  return revived;
}
