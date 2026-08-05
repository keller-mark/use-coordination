/**
 * The side channels available to a command: everything which is not
 * the spec on stdin or the spec on stdout.
 */
export interface CommandContext {
  /** Report a warning on stderr. */
  warn(message: string): void;
  /** Report an informational message (such as an auto-named scope) on stderr. */
  info(message: string): void;
  /** Write text to stdout (used by the query commands). */
  write(text: string): void;
  /** Write a line to stdout (used by the query commands). */
  writeLine(line: string): void;
  /** Mark the process as failed, without aborting the current command. */
  fail(): void;
}
