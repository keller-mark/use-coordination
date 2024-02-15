import { z } from 'zod';
import { fromEntries } from '@use-coordination/utils';
import { META_COORDINATION_SCOPES, META_COORDINATION_SCOPES_BY } from '@use-coordination/constants-internal';
import {
  componentCoordinationScopes,
  componentCoordinationScopesBy,
} from './shared.js';

const baseCoordinationTypes = {
  [META_COORDINATION_SCOPES]: z.record(z.any()).nullable(),
  [META_COORDINATION_SCOPES_BY]: z.record(z.any()).nullable(),
};

function buildSpecSchemaAux<T extends z.ZodTypeAny>(coordinationSpace: T) {
  return z.object({
    key: z.union([z.string(), z.number()]).optional(),
    coordinationSpace: coordinationSpace
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
      )
      .optional(),
  });
}

// For usage in documentation and JSON schema generation.
export const genericSpecSchema = buildSpecSchemaAux(
  // TODO: Special meta-coordination types should be included.
  z.record(
    // Coordination Type
    z.string(),
    z.record(
      // Coordination Scope
      z.string(),
      // Coordination Value
      z.any()
    ).nullable()
  )
);

/**
 * Build a Zod schema for the latest spec,
 * which is specific to any registered plugins.
 * The builder pattern allows the returned
 * Zod schema to be typed despite not knowing
 * the plugin names or sub-schemas in advance.
 * @param coordinationTypes
 * @returns The Zod schema.
 */
export function buildSpecSchema<
  T extends Record<string, z.ZodTypeAny>,
>(
  coordinationTypes: T,
) {
  return buildSpecSchemaAux(
    z.object(
      // Wrap each value schema in z.record()
      fromEntries(
        [
          ...Object.entries(baseCoordinationTypes),
          // Merge with coordination type schemas.
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
    ).strict(),
  );
}
