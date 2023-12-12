import { z } from 'zod';
import { fromEntries } from '@mm-cmv/utils';
import { META_COORDINATION_SCOPES, META_COORDINATION_SCOPES_BY } from '@mm-cmv/constants-internal';
import { CoordinationType } from './coordination-type.js';
import {
  componentCoordinationScopes,
  componentCoordinationScopesBy,
} from './shared.js';

const baseCoordinationTypes = [
  new CoordinationType(
    META_COORDINATION_SCOPES,
    null,
    z.record(z.any()).nullable(),
  ),
  new CoordinationType(
    META_COORDINATION_SCOPES_BY,
    null,
    z.record(z.any()).nullable(),
  ),
];

/**
 * Build a Zod schema for the latest Vitessce config,
 * which is specific to any registered plugins.
 * The builder pattern allows the returned
 * Zod schema to be typed despite not knowing
 * the plugin names or sub-schemas in advance.
 * @param pluginCoordinationTypes
 * @returns The Zod schema.
 */
export function buildConfigSchema<
  T3 extends CoordinationType<z.ZodTypeAny>,
>(
  pluginCoordinationTypes: Array<T3>,
) {
  return z.object({
    uid: z.union([z.string(), z.number()]).optional(),
    // Merge with coordination type schemas.
    coordinationSpace: z.object(
      // Wrap each value schema in z.record()
      fromEntries(
        [
          ...baseCoordinationTypes,
          ...pluginCoordinationTypes,
        ].map(ct => ([
            ct.name,
            z.record(
              // For now, assume the key type is string (though it would be
              // slightly nicer if we could use the coordinationScopeName schema here).
              // Once https://github.com/colinhacks/zod/issues/2746 gets resolved
              // then we can try that approach again, but it should not be a big deal.
              ct.valueSchema.optional(),
            ).optional(),
          ])),
      ),
    )
      .strict()
      .describe(
        'The coordination space stores the values for each scope of each coordination object.',
      )
      .optional(),
    viewCoordination: z.record(
      z.object({
        coordinationScopes: componentCoordinationScopes
          .optional(),
        coordinationScopesBy: componentCoordinationScopesBy
          .optional(),
      }),
    )
      .describe(
        'The layout array defines the views, or components, rendered in the grid.',
      ),
  });
}
