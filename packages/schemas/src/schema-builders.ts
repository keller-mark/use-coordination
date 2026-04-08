import { z } from 'zod';
import {
  oneOrMoreCoordinationScopeNames,
  componentCoordinationScopes,
  componentCoordinationScopesBy,
} from './shared.js';

function buildSpecSchemaAux<T extends z.ZodType>(coordinationSpace: T) {
  return z.object({
    key: z.union([z.string(), z.number()]).optional(),
    coordinationSpace: coordinationSpace
      .describe(
        'The coordination space stores the values for each scope of each coordination object.',
      )
      .optional(),
    metaCoordination: z.object({
      coordinationScopes: z.record(z.string(), componentCoordinationScopes).optional(),
      coordinationScopesBy: z.record(z.string(), componentCoordinationScopesBy).optional(),
    }).optional(),
    viewCoordination: z.record(
      z.string(),
      z.object({
        coordinationScopes: componentCoordinationScopes
          .optional(),
        coordinationScopesBy: componentCoordinationScopesBy
          .optional(),
        metaCoordinationScopes: oneOrMoreCoordinationScopeNames.optional(),
        metaCoordinationScopesBy: oneOrMoreCoordinationScopeNames.optional()
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
  T extends Record<string, z.ZodType>,
>(
  coordinationTypes: T,
) {
  return buildSpecSchemaAux(
    z.strictObject(
      // Wrap each value schema in z.record()
      Object.fromEntries(
        Object.entries(coordinationTypes).map(([ctName, ctValueSchema]) => ([
            ctName,
            z.record(
              // For now, assume the key type is string (though it would be
              // slightly nicer if we could use the coordinationScopeName schema here).
              // Once https://github.com/colinhacks/zod/issues/2746 gets resolved
              // then we can try that approach again, but it should not be a big deal.
              z.string(),
              ctValueSchema.optional(),
            ).optional(),
          ])),
      ),
    ),
  );
}
