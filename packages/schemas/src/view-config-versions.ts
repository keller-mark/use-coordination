/* eslint-disable camelcase */
import { z } from 'zod';
import { gte as semverGte } from 'semver';
import { OldCoordinationType } from '@mm-cmv/constants';
import { fromEntries } from '@mm-cmv/utils';
import { SCHEMA_HANDLERS, latestConfigSchema, AnyVersionConfig } from './previous-config-meta.js';

export function configSchemaToVersion<T extends z.ZodTypeAny>(zodSchema: T): string {
  // eslint-disable-next-line no-underscore-dangle
  return ((zodSchema as unknown) as z.AnyZodObject).shape.version._def.value;
}

/**
 * Check for deprecated coordination types.
 * @param {object} config The parsed config.
 * @param ctx The Zod refinement context.
 */
function refineCoordinationTypes(config: AnyVersionConfig, ctx: z.RefinementCtx) {
  if ('version' in config) {
    const version = config?.version;
    const deprecatedCoordinationTypes = Object.entries(OldCoordinationType)
      .filter(([prevConstant, v]) => semverGte(version, v[2]))
      .map(([prevConstant]) => prevConstant);
    deprecatedCoordinationTypes.forEach((prevConstant) => {
      const newTypeName = (OldCoordinationType as Record<string, string[]>)[prevConstant][3];
      const prevName = (OldCoordinationType as Record<string, string[]>)[prevConstant][0];
      if (
        'coordinationSpace' in config
        && typeof config.coordinationSpace === 'object'
        && config.coordinationSpace !== null
        && prevName in config.coordinationSpace
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `The coordination type ${prevName} was changed to ${newTypeName} in view config schema version ${version}`,
          path: ['coordinationSpace', prevName],
        });
      }
      // TODO: check config.layout[].coordinationScopes also?
    });
  }
}
