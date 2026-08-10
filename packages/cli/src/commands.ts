import type {
  OptionSpecs,
  ParsedArgs,
  PositionalSpecs,
} from './args.js';
import { requireOption } from './args.js';
import { reviveCoordinationInputObject } from './cmv.js';
import type { CommandContext } from './context.js';
import { CliError } from './errors.js';
import { parseJson, parseKey, parseValue } from './json.js';
import * as queries from './queries.js';
import { emptySpec } from './spec.js';
import * as transforms from './transforms.js';
import type { JsonValue, NormalizedSpec } from './types.js';
import { validateSpec } from './validate.js';

export type CommandSection =
  | 'Creation'
  | 'Transforms — views'
  | 'Transforms — coordination space'
  | 'Transforms — wiring views to scopes'
  | 'Transforms — view-level values'
  | 'Transforms — multi-view linking'
  | 'Transforms — passthrough'
  | 'Queries';

interface CommandBase {
  readonly name: string;
  readonly section: CommandSection;
  readonly summary: string;
  readonly usage: string;
  /** Whether the spec is read from stdin. True unless specified otherwise. */
  readonly readsStdin?: boolean;
}

/** A command which emits the resulting spec on stdout. */
export interface TransformCommand<
  P extends PositionalSpecs,
  O extends OptionSpecs,
> extends CommandBase {
  readonly kind: 'transform';
  readonly positionals: P;
  readonly options: O;
  run(args: ParsedArgs<P, O>, spec: NormalizedSpec, ctx: CommandContext): NormalizedSpec;
}

/** A command which emits information on stdout, ending a pipeline. */
export interface QueryCommand<
  P extends PositionalSpecs,
  O extends OptionSpecs,
> extends CommandBase {
  readonly kind: 'query';
  readonly positionals: P;
  readonly options: O;
  run(args: ParsedArgs<P, O>, spec: NormalizedSpec, ctx: CommandContext): void;
}

export type AnyCommand =
  | TransformCommand<PositionalSpecs, OptionSpecs>
  | QueryCommand<PositionalSpecs, OptionSpecs>;

// The `const` type parameters preserve the literal positional and option specs,
// so that each `run` implementation receives precisely-typed arguments.
function defineTransform<
  const P extends PositionalSpecs,
  const O extends OptionSpecs,
>(command: TransformCommand<P, O>): TransformCommand<P, O> {
  return command;
}

function defineQuery<
  const P extends PositionalSpecs,
  const O extends OptionSpecs,
>(command: QueryCommand<P, O>): QueryCommand<P, O> {
  return command;
}

function optionalValue(raw: string | undefined): JsonValue | undefined {
  return raw === undefined ? undefined : parseValue(raw);
}

const VIEWS_OPTION = {
  kind: 'string-array',
  placeholder: '<uid> [<uid> ...]',
  description: 'The UIDs of the views to link.',
} as const;

const VALUE_OPTION = {
  kind: 'string',
  placeholder: '<json>',
  description: 'The coordination value (parsed as JSON when possible).',
} as const;

const SCOPE_OPTION = {
  kind: 'string',
  placeholder: '<name>',
  description: 'The coordination scope name. Auto-named when omitted.',
} as const;

const initCommand = defineTransform({
  kind: 'transform',
  name: 'init',
  section: 'Creation',
  summary: 'Emit a fresh empty spec, ignoring stdin.',
  usage: 'usecoord init [--key <key>]',
  readsStdin: false,
  positionals: [],
  options: {
    key: {
      kind: 'string',
      placeholder: '<key>',
      description: 'The top-level spec key.',
    },
  },
  run({ options }) {
    return emptySpec(options.key === undefined ? undefined : parseKey(options.key));
  },
});

const addViewCommand = defineTransform({
  kind: 'transform',
  name: 'add-view',
  section: 'Transforms — views',
  summary: 'Add a view with no scopes attached. No-op if it already exists.',
  usage: 'usecoord add-view <view_uid>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
  ],
  options: {},
  run({ positionals: [viewUid] }, spec) {
    return transforms.addView(spec, viewUid);
  },
});

const removeViewCommand = defineTransform({
  kind: 'transform',
  name: 'remove-view',
  section: 'Transforms — views',
  summary: 'Remove a view. No-op if absent.',
  usage: 'usecoord remove-view <view_uid>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
  ],
  options: {},
  run({ positionals: [viewUid] }, spec) {
    return transforms.removeView(spec, viewUid);
  },
});

const addCoordinationCommand = defineTransform({
  kind: 'transform',
  name: 'add-coordination',
  section: 'Transforms — coordination space',
  summary: 'Add a scope of a coordination type.',
  usage: 'usecoord add-coordination <type> [--scope <name>] [--value <json>]',
  positionals: [
    { name: 'type', required: true, description: 'The coordination type.' },
  ],
  options: {
    scope: SCOPE_OPTION,
    value: VALUE_OPTION,
  },
  run({ positionals: [cType], options }, spec, ctx) {
    const cValue = optionalValue(options.value);
    if (options.scope === undefined) {
      return transforms.addAutoNamedCoordinationScope(spec, cType, cValue, ctx);
    }
    return transforms.addCoordinationScope(spec, cType, options.scope, cValue);
  },
});

const setCoordinationValueCommand = defineTransform({
  kind: 'transform',
  name: 'set-coordination-value',
  section: 'Transforms — coordination space',
  summary: "Upsert a scope's value, creating the scope if needed.",
  usage: 'usecoord set-coordination-value <type> <scope> <value>',
  positionals: [
    { name: 'type', required: true, description: 'The coordination type.' },
    { name: 'scope', required: true, description: 'The coordination scope name.' },
    { name: 'value', required: true, description: 'The coordination value (parsed as JSON when possible).' },
  ],
  options: {},
  run({ positionals: [cType, cScope, rawValue] }, spec) {
    return transforms.setCoordinationValue(spec, cType, cScope, parseValue(rawValue));
  },
});

const removeCoordinationCommand = defineTransform({
  kind: 'transform',
  name: 'remove-coordination',
  section: 'Transforms — coordination space',
  summary: 'Remove a scope, dropping its type if it becomes empty. No-op if absent.',
  usage: 'usecoord remove-coordination <type> <scope>',
  positionals: [
    { name: 'type', required: true, description: 'The coordination type.' },
    { name: 'scope', required: true, description: 'The coordination scope name.' },
  ],
  options: {},
  run({ positionals: [cType, cScope] }, spec) {
    return transforms.removeCoordination(spec, cType, cScope);
  },
});

const useCoordinationCommand = defineTransform({
  kind: 'transform',
  name: 'use-coordination',
  section: 'Transforms — wiring views to scopes',
  summary: 'Map a view to a scope of a coordination type.',
  usage: 'usecoord use-coordination <view_uid> <type> <scope>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
    { name: 'type', required: true, description: 'The coordination type.' },
    { name: 'scope', required: true, description: 'The coordination scope name.' },
  ],
  options: {},
  run({ positionals: [viewUid, cType, cScope] }, spec, ctx) {
    return transforms.useCoordination(spec, viewUid, cType, cScope, ctx);
  },
});

const unuseCoordinationCommand = defineTransform({
  kind: 'transform',
  name: 'unuse-coordination',
  section: 'Transforms — wiring views to scopes',
  summary: "Remove a coordination type from a view's coordinationScopes. No-op if absent.",
  usage: 'usecoord unuse-coordination <view_uid> <type>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
    { name: 'type', required: true, description: 'The coordination type.' },
  ],
  options: {},
  run({ positionals: [viewUid, cType] }, spec) {
    return transforms.unuseCoordination(spec, viewUid, cType);
  },
});

const setViewCoordinationValueCommand = defineTransform({
  kind: 'transform',
  name: 'set-view-coordination-value',
  section: 'Transforms — view-level values',
  summary: 'Set a value on a view directly, without a scope as an intermediary.',
  usage: 'usecoord set-view-coordination-value <view_uid> <type> <value>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
    { name: 'type', required: true, description: 'The coordination type.' },
    { name: 'value', required: true, description: 'The coordination value (parsed as JSON when possible).' },
  ],
  options: {},
  run({ positionals: [viewUid, cType, rawValue] }, spec, ctx) {
    return transforms.setViewCoordinationValue(spec, viewUid, cType, parseValue(rawValue), ctx);
  },
});

const unsetViewCoordinationValueCommand = defineTransform({
  kind: 'transform',
  name: 'unset-view-coordination-value',
  section: 'Transforms — view-level values',
  summary: "Remove a coordination type from a view's coordinationValues. No-op if absent.",
  usage: 'usecoord unset-view-coordination-value <view_uid> <type>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
    { name: 'type', required: true, description: 'The coordination type.' },
  ],
  options: {},
  run({ positionals: [viewUid, cType] }, spec) {
    return transforms.unsetViewCoordinationValue(spec, viewUid, cType);
  },
});

const linkViewsCommand = defineTransform({
  kind: 'transform',
  name: 'link-views',
  section: 'Transforms — multi-view linking',
  summary: 'Create a shared scope of a coordination type and attach it to every named view.',
  usage: 'usecoord link-views <type> --views <uid> [<uid> ...] [--scope <name>] [--value <json>]',
  positionals: [
    { name: 'type', required: true, description: 'The coordination type.' },
  ],
  options: {
    views: VIEWS_OPTION,
    scope: SCOPE_OPTION,
    value: VALUE_OPTION,
  },
  run({ positionals: [cType], options }, spec, ctx) {
    return transforms.linkViews(spec, cType, options.views, {
      scope: options.scope,
      value: optionalValue(options.value),
    }, ctx);
  },
});

const linkViewsByObjectCommand = defineTransform({
  kind: 'transform',
  name: 'link-views-by-object',
  section: 'Transforms — multi-view linking',
  summary: 'Set up multi-level and/or meta-coordination across the named views.',
  usage: 'usecoord link-views-by-object --views <uid> [<uid> ...] --input <json> [--no-meta] [--scope-prefix <p>]',
  positionals: [],
  options: {
    views: VIEWS_OPTION,
    input: {
      kind: 'string',
      placeholder: '<json>',
      description: 'The (potentially nested) coordination input object. Use {"$CL": ...} for a nested coordination level.',
    },
    'no-meta': {
      kind: 'boolean',
      description: 'Attach scopes directly to views instead of via meta-coordination.',
    },
    'scope-prefix': {
      kind: 'string',
      placeholder: '<p>',
      description: 'A prefix for all generated scope names.',
    },
  },
  run({ options }, spec) {
    const rawInput = requireOption(options.input, 'input');
    const input = reviveCoordinationInputObject(parseJson(rawInput, '--input'));
    return transforms.linkViewsByObject(spec, options.views, input, {
      meta: !options['no-meta'],
      scopePrefix: options['scope-prefix'],
    });
  },
});

const printCommand = defineTransform({
  kind: 'transform',
  name: 'print',
  section: 'Transforms — passthrough',
  summary: 'Re-emit the spec, normalized and pretty-printed.',
  usage: 'usecoord print',
  positionals: [],
  options: {},
  run(args, spec) {
    return spec;
  },
});

const validateCommand = defineTransform({
  kind: 'transform',
  name: 'validate',
  section: 'Transforms — passthrough',
  summary: 'Validate against the JSON schema, passing the spec through unchanged.',
  usage: 'usecoord validate',
  positionals: [],
  options: {},
  run(args, spec, ctx) {
    const { valid, issues } = validateSpec(spec);
    if (valid) {
      ctx.info('Valid');
    } else {
      ctx.info('Invalid:');
      issues.forEach(issue => ctx.info(`  ${issue}`));
      ctx.fail();
    }
    return spec;
  },
});

const listViewsCommand = defineQuery({
  kind: 'query',
  name: 'list-views',
  section: 'Queries',
  summary: 'Emit one view UID per line.',
  usage: 'usecoord list-views',
  positionals: [],
  options: {},
  run(args, spec, ctx) {
    queries.listViews(spec, ctx);
  },
});

const getViewCommand = defineQuery({
  kind: 'query',
  name: 'get-view',
  section: 'Queries',
  summary: "Emit a view's mapping object as JSON.",
  usage: 'usecoord get-view <view_uid>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
  ],
  options: {},
  run({ positionals: [viewUid] }, spec, ctx) {
    queries.getView(spec, viewUid, ctx);
  },
});

const listCoordinationTypesCommand = defineQuery({
  kind: 'query',
  name: 'list-coordination-types',
  section: 'Queries',
  summary: 'Emit one coordination type per line.',
  usage: 'usecoord list-coordination-types',
  positionals: [],
  options: {},
  run(args, spec, ctx) {
    queries.listCoordinationTypes(spec, ctx);
  },
});

const listScopesCommand = defineQuery({
  kind: 'query',
  name: 'list-scopes',
  section: 'Queries',
  summary: 'Emit one scope name of a coordination type per line.',
  usage: 'usecoord list-scopes <type>',
  positionals: [
    { name: 'type', required: true, description: 'The coordination type.' },
  ],
  options: {},
  run({ positionals: [cType] }, spec, ctx) {
    queries.listScopes(spec, cType, ctx);
  },
});

const getCoordinationValueCommand = defineQuery({
  kind: 'query',
  name: 'get-coordination-value',
  section: 'Queries',
  summary: "Emit a scope's value as JSON.",
  usage: 'usecoord get-coordination-value <type> <scope>',
  positionals: [
    { name: 'type', required: true, description: 'The coordination type.' },
    { name: 'scope', required: true, description: 'The coordination scope name.' },
  ],
  options: {},
  run({ positionals: [cType, cScope] }, spec, ctx) {
    queries.getValue(spec, cType, cScope, ctx);
  },
});

const getViewCoordinationValueCommand = defineQuery({
  kind: 'query',
  name: 'get-view-coordination-value',
  section: 'Queries',
  summary: "Emit a value from a view's coordinationValues as JSON.",
  usage: 'usecoord get-view-coordination-value <view_uid> <type>',
  positionals: [
    { name: 'view_uid', required: true, description: 'The view UID.' },
    { name: 'type', required: true, description: 'The coordination type.' },
  ],
  options: {},
  run({ positionals: [viewUid, cType] }, spec, ctx) {
    queries.getViewValue(spec, viewUid, cType, ctx);
  },
});

export const COMMANDS: readonly AnyCommand[] = [
  initCommand,
  addViewCommand,
  removeViewCommand,
  addCoordinationCommand,
  setCoordinationValueCommand,
  removeCoordinationCommand,
  useCoordinationCommand,
  unuseCoordinationCommand,
  setViewCoordinationValueCommand,
  unsetViewCoordinationValueCommand,
  linkViewsCommand,
  linkViewsByObjectCommand,
  printCommand,
  validateCommand,
  listViewsCommand,
  getViewCommand,
  listCoordinationTypesCommand,
  listScopesCommand,
  getCoordinationValueCommand,
  getViewCoordinationValueCommand,
];

export const COMMAND_SECTIONS: readonly CommandSection[] = [
  'Creation',
  'Transforms — views',
  'Transforms — coordination space',
  'Transforms — wiring views to scopes',
  'Transforms — view-level values',
  'Transforms — multi-view linking',
  'Transforms — passthrough',
  'Queries',
];

/**
 * Look up a command by name.
 * @param name The command name.
 * @returns The command.
 */
export function getCommand(name: string): AnyCommand {
  const command = COMMANDS.find(c => c.name === name);
  if (command === undefined) {
    throw new CliError(
      `unknown command "${name}"\nrun "usecoord --help" for the list of commands`,
    );
  }
  return command;
}
