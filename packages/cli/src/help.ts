import type { OptionSpec } from './args.js';
import type { AnyCommand } from './commands.js';
import { COMMANDS, COMMAND_SECTIONS } from './commands.js';

function formatOption([name, option]: [string, OptionSpec]): string {
  const placeholder = option.placeholder === undefined ? '' : ` ${option.placeholder}`;
  return `--${name}${placeholder}`;
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text : `${text}${' '.repeat(width - text.length)}`;
}

/**
 * Format the top-level help text.
 * @returns The help text.
 */
export function formatGlobalHelp(): string {
  const width = Math.max(...COMMANDS.map(c => c.name.length)) + 2;
  const lines: string[] = [
    'usecoord — build and edit use-coordination specs.',
    '',
    'usecoord is a stateless filter: unless noted, each command reads a spec',
    'from stdin (an empty spec if stdin is empty) and writes to stdout.',
    'Transforms emit the resulting spec; queries emit information and end a pipeline.',
    '',
    'usage: usecoord <command> [args...]',
    '',
  ];
  COMMAND_SECTIONS.forEach((section) => {
    const commands = COMMANDS.filter(c => c.section === section);
    if (commands.length === 0) {
      return;
    }
    lines.push(`${section}:`);
    commands.forEach((command) => {
      lines.push(`  ${padRight(command.name, width)}${command.summary}`);
    });
    lines.push('');
  });
  lines.push('Run "usecoord <command> --help" for the arguments of one command.');
  lines.push('Run "usecoord --skill" for the full reference document (markdown).');
  return `${lines.join('\n')}\n`;
}

/**
 * Format the help text of one command.
 * @param command The command.
 * @returns The help text.
 */
export function formatCommandHelp(command: AnyCommand): string {
  const lines: string[] = [
    command.summary,
    '',
    `usage: ${command.usage}`,
  ];
  const names = [
    ...command.positionals.map(p => `<${p.name}>`),
    ...Object.entries(command.options).map(formatOption),
  ];
  if (names.length > 0) {
    const width = Math.max(...names.map(n => n.length)) + 2;
    lines.push('');
    lines.push('arguments:');
    command.positionals.forEach((positional) => {
      const optionality = positional.required ? '' : ' (optional)';
      lines.push(`  ${padRight(`<${positional.name}>`, width)}${positional.description}${optionality}`);
    });
    Object.entries(command.options).forEach((entry) => {
      lines.push(`  ${padRight(formatOption(entry), width)}${entry[1].description}`);
    });
  }
  if (command.readsStdin === false) {
    lines.push('');
    lines.push('This command ignores stdin.');
  }
  if (command.kind === 'query') {
    lines.push('');
    lines.push('This command emits information rather than a spec, so it ends a pipeline.');
  }
  return `${lines.join('\n')}\n`;
}
