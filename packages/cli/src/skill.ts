import { readFileSync } from 'node:fs';
import { CliError, getErrorMessage } from './errors.js';

/** The path of the skill reference document, relative to this module. */
export const SKILL_REFERENCE_PATH = '../skill/REFERENCE.md';

/**
 * Read the agent skill reference document, which documents this CLI
 * and its subcommands.
 * @returns The markdown contents of the document.
 */
export function readSkillReference(): string {
  try {
    // Relative to this module, both in src/ and in dist-tsc/.
    const referenceUrl = new URL(SKILL_REFERENCE_PATH, import.meta.url);
    return readFileSync(referenceUrl, 'utf8');
  } catch (e) {
    throw new CliError(
      `could not read the skill reference document: ${getErrorMessage(e)}`,
    );
  }
}
