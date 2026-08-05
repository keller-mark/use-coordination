import { CliError } from './errors.js';

export type OptionKind = 'string' | 'boolean' | 'string-array';

export interface OptionSpec {
  readonly kind: OptionKind;
  /** How the value is displayed in the usage string, e.g. `<json>`. */
  readonly placeholder?: string;
  readonly description: string;
}

export interface PositionalSpec {
  readonly name: string;
  readonly description: string;
  readonly required?: boolean;
}

export type OptionSpecs = Readonly<Record<string, OptionSpec>>;
export type PositionalSpecs = readonly PositionalSpec[];

/** The parsed value of one option, given its kind. */
export type OptionValue<K extends OptionKind> =
  K extends 'boolean' ? boolean
    : K extends 'string-array' ? string[]
      : string | undefined;

export type ParsedOptions<O extends OptionSpecs> = {
  readonly [K in keyof O]: OptionValue<O[K]['kind']>;
};

/**
 * Positionals are typed per-command: required positionals are always
 * present, optional ones may be undefined.
 */
export type ParsedPositionals<P extends PositionalSpecs> = {
  readonly [I in keyof P]: P[I]['required'] extends true ? string : string | undefined;
};

export interface ParsedArgs<P extends PositionalSpecs, O extends OptionSpecs> {
  readonly positionals: ParsedPositionals<P>;
  readonly options: ParsedOptions<O>;
}

/** The type of the parsed arguments of an arbitrary command. */
export type AnyParsedArgs = ParsedArgs<PositionalSpecs, OptionSpecs>;

interface ArgsSpec {
  readonly positionals: PositionalSpecs;
  readonly options: OptionSpecs;
  readonly usage: string;
}

type RawOptions = Record<string, string | boolean | string[]>;

function initialOptions(options: OptionSpecs): RawOptions {
  const result: RawOptions = {};
  Object.entries(options).forEach(([name, option]) => {
    if (option.kind === 'boolean') {
      result[name] = false;
    } else if (option.kind === 'string-array') {
      result[name] = [];
    }
    // String options are left absent, so that they parse to undefined.
  });
  return result;
}

/**
 * Parse the command-line arguments of one command.
 * Supports `--opt value`, `--opt=value`, boolean flags,
 * variadic options (`--views a b c`), and `--` to end option parsing.
 * @param spec The positional and option specs of the command.
 * @param argv The arguments, excluding the command name.
 * @returns The parsed positionals and options.
 */
export function parseArgs(spec: ArgsSpec, argv: readonly string[]): AnyParsedArgs {
  const { positionals: positionalSpecs, options: optionSpecs, usage } = spec;
  const positionals: string[] = [];
  const options = initialOptions(optionSpecs);
  let onlyPositionals = false;
  let i = 0;
  while (i < argv.length) {
    const token = argv[i];
    if (!onlyPositionals && token === '--') {
      onlyPositionals = true;
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }
    if (!onlyPositionals && token.startsWith('--')) {
      const equalsIndex = token.indexOf('=');
      const name = equalsIndex === -1 ? token.slice(2) : token.slice(2, equalsIndex);
      const inlineValue = equalsIndex === -1 ? undefined : token.slice(equalsIndex + 1);
      if (!Object.hasOwn(optionSpecs, name)) {
        throw new CliError(`unknown option "--${name}"\nusage: ${usage}`);
      }
      const option = optionSpecs[name];
      i += 1;
      if (option.kind === 'boolean') {
        if (inlineValue === undefined || inlineValue === 'true') {
          options[name] = true;
        } else if (inlineValue === 'false') {
          options[name] = false;
        } else {
          throw new CliError(`expected "--${name}" to be a flag without a value`);
        }
      } else if (option.kind === 'string') {
        if (inlineValue !== undefined) {
          options[name] = inlineValue;
        } else if (i < argv.length) {
          options[name] = argv[i];
          i += 1;
        } else {
          throw new CliError(`expected a value after "--${name}"`);
        }
      } else {
        const values: string[] = inlineValue === undefined ? [] : [inlineValue];
        while (i < argv.length && !argv[i].startsWith('--')) {
          values.push(argv[i]);
          i += 1;
        }
        if (values.length === 0) {
          throw new CliError(`expected one or more values after "--${name}"`);
        }
        options[name] = [...(options[name] as string[]), ...values];
      }
      // eslint-disable-next-line no-continue
      continue;
    }
    positionals.push(token);
    i += 1;
  }
  const requiredCount = positionalSpecs.filter(p => p.required).length;
  if (positionals.length < requiredCount) {
    const missing = positionalSpecs
      .slice(positionals.length)
      .filter(p => p.required)
      .map(p => `<${p.name}>`)
      .join(' ');
    throw new CliError(`missing required argument(s) ${missing}\nusage: ${usage}`);
  }
  if (positionals.length > positionalSpecs.length) {
    throw new CliError(
      `unexpected argument "${positionals[positionalSpecs.length]}"\nusage: ${usage}`,
    );
  }
  // The only cast in the argument parsing: the runtime representation above
  // matches the types derived from the positional and option specs.
  return { positionals, options } as unknown as AnyParsedArgs;
}

/**
 * Assert that an option was passed on the command line.
 * @param value The parsed option value.
 * @param name The option name, for the error message.
 * @returns The option value.
 */
export function requireOption(value: string | undefined, name: string): string {
  if (value === undefined) {
    throw new CliError(`expected the option "--${name}" to be passed`);
  }
  return value;
}
