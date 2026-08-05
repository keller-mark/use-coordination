/**
 * An error which is expected to be reported to the user on stderr
 * (as opposed to an internal error, for which a stack trace is relevant).
 */
export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
