import { z } from 'zod';
import { fromEntries } from '@mm-cmv/utils';
import { META_COORDINATION_SCOPES, META_COORDINATION_SCOPES_BY } from '@mm-cmv/constants-internal';
import {
  componentCoordinationScopes,
  componentCoordinationScopesBy,
} from './shared.js';

const baseCoordinationTypes = {
  [META_COORDINATION_SCOPES]: z.record(z.any()).nullable(),
  [META_COORDINATION_SCOPES_BY]: z.record(z.any()).nullable(),
};

/**
 * Build a Zod schema for the latest Vitessce config,
 * which is specific to any registered plugins.
 * The builder pattern allows the returned
 * Zod schema to be typed despite not knowing
 * the plugin names or sub-schemas in advance.
 * @param coordinationTypes
 * @returns The Zod schema.
 */
export function buildConfigSchema<
  T extends Record<string, z.ZodTypeAny>,
>(
  coordinationTypes: T,
) {
  return z.object({
    key: z.union([z.string(), z.number()]).optional(),
    // Merge with coordination type schemas.
    coordinationSpace: z.object(
      // Wrap each value schema in z.record()
      fromEntries(
        [
          ...Object.entries(baseCoordinationTypes),
          ...Object.entries(coordinationTypes),
        ].map(([ctName, ctValueSchema]) => ([
            ctName,
            z.record(
              // For now, assume the key type is string (though it would be
              // slightly nicer if we could use the coordinationScopeName schema here).
              // Once https://github.com/colinhacks/zod/issues/2746 gets resolved
              // then we can try that approach again, but it should not be a big deal.
              ctValueSchema.optional(),
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
