import { z } from 'zod';

export const coordinationTypeName = z.string();
export const coordinationScopeName = z.string();

const stringOrStringArray = z.union([
  z.string(),
  z.array(z.string()),
]);

const oneOrMoreCoordinationScopeNames = stringOrStringArray;

export const componentCoordinationScopes = z.record(
  coordinationTypeName,
  oneOrMoreCoordinationScopeNames,
);

export const componentCoordinationScopesBy = z.record(
  coordinationTypeName,
  z.record(
    coordinationTypeName,
    z.record(coordinationScopeName, oneOrMoreCoordinationScopeNames),
  ),
);
