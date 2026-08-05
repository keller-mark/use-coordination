import { parseArgs } from './args.js';
import { getCommand } from './commands.js';
import type { CommandContext } from './context.js';
import { CliError, getErrorMessage } from './errors.js';
import { formatCommandHelp, formatGlobalHelp } from './help.js';
import { readSkillReference } from './skill.js';
import { parseSpec, serializeSpec } from './spec.js';
import { VERSION } from './version.js';

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** A function which lazily provides the contents of stdin. */
export type ReadStdin = () => Promise<string>;

const HELP_FLAGS = ['--help', '-h'];
const VERSION_FLAGS = ['--version', '-v'];
const SKILL_FLAGS = ['--skill'];

/**
 * Run one `usecoord` invocation.
 * All input and output is passed through the arguments and the return value,
 * so that the CLI can be exercised without spawning a process.
 * @param argv The command-line arguments, excluding the executable and script.
 * @param readStdin A function which reads the spec from stdin. Only called
 * by commands which read stdin.
 * @returns The text for stdout and stderr, and the process exit code.
 */
export async function runCli(
  argv: readonly string[],
  readStdin: ReadStdin,
): Promise<CliResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCode = 0;
  let commandName: string | undefined;

  const ctx: CommandContext = {
    warn(message: string) {
      stderr.push(`usecoord: warning: ${message}\n`);
    },
    info(message: string) {
      stderr.push(`${message}\n`);
    },
    write(text: string) {
      stdout.push(text);
    },
    writeLine(line: string) {
      stdout.push(`${line}\n`);
    },
    fail() {
      exitCode = 1;
    },
  };

  try {
    const [firstArg, ...rest] = argv;
    if (firstArg === undefined || HELP_FLAGS.includes(firstArg) || firstArg === 'help') {
      const topic = firstArg === 'help' ? rest[0] : undefined;
      stdout.push(topic === undefined ? formatGlobalHelp() : formatCommandHelp(getCommand(topic)));
      return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode };
    }
    if (VERSION_FLAGS.includes(firstArg)) {
      stdout.push(`${VERSION}\n`);
      return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode };
    }
    if (SKILL_FLAGS.includes(firstArg)) {
      stdout.push(readSkillReference());
      return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode };
    }
    commandName = firstArg;
    const command = getCommand(firstArg);
    if (rest.some(arg => HELP_FLAGS.includes(arg))) {
      stdout.push(formatCommandHelp(command));
      return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode };
    }
    const args = parseArgs(command, rest);
    const specText = command.readsStdin === false ? '' : await readStdin();
    const spec = parseSpec(specText);
    if (command.kind === 'transform') {
      stdout.push(serializeSpec(command.run(args, spec, ctx)));
    } else {
      command.run(args, spec, ctx);
    }
  } catch (e) {
    const prefix = commandName === undefined ? 'usecoord' : `usecoord ${commandName}`;
    if (e instanceof CliError) {
      stderr.push(`${prefix}: ${e.message}\n`);
    } else {
      stderr.push(`${prefix}: unexpected error: ${getErrorMessage(e)}\n`);
    }
    // Do not emit a partial spec on stdout.
    return { stdout: '', stderr: stderr.join(''), exitCode: 1 };
  }
  return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode };
}
