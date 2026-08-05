#!/usr/bin/env node
import process from 'node:process';
import { runCli } from './run.js';

/**
 * Read the whole of stdin. An interactive terminal (no piped input)
 * is treated as empty input.
 * @returns The contents of stdin.
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }
  const chunks: Buffer[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

const result = await runCli(process.argv.slice(2), readStdin);
if (result.stdout.length > 0) {
  process.stdout.write(result.stdout);
}
if (result.stderr.length > 0) {
  process.stderr.write(result.stderr);
}
process.exitCode = result.exitCode;
