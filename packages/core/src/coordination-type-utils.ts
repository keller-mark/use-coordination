import { z } from 'zod';

// Infer TS types from a record of Zod schemas
export type ZodInferMap<T extends Record<string, z.ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};

// Pick values for requested parameters
export type PickValues<
  CTypes extends Record<string, z.ZodType>,
  P extends readonly (keyof CTypes)[],
> = { [K in P[number]]: z.infer<CTypes[K]> };

// Map parameter name to setter name: "foo" → "setFoo"
export type SetterName<S extends string> = `set${Capitalize<S>}`;

// Build setters record with correct value types
export type PickSetters<
  CTypes extends Record<string, z.ZodType>,
  P extends readonly (keyof CTypes & string)[],
> = { [K in P[number] as SetterName<K>]: (value: z.infer<CTypes[K]>) => void };

// L1 wrappers (scope name → typed inner record)
export type PickValuesL1<
  CTypes extends Record<string, z.ZodType>,
  P extends readonly (keyof CTypes & string)[],
> = Record<string, PickValues<CTypes, P>>;

export type PickSettersL1<
  CTypes extends Record<string, z.ZodType>,
  P extends readonly (keyof CTypes & string)[],
> = Record<string, PickSetters<CTypes, P>>;

// L2 wrappers (two levels of scope nesting)
export type PickValuesL2<
  CTypes extends Record<string, z.ZodType>,
  P extends readonly (keyof CTypes & string)[],
> = Record<string, Record<string, PickValues<CTypes, P>>>;

export type PickSettersL2<
  CTypes extends Record<string, z.ZodType>,
  P extends readonly (keyof CTypes & string)[],
> = Record<string, Record<string, PickSetters<CTypes, P>>>;
