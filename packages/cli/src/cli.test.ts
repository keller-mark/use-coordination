import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { COMMANDS } from './commands.js';
import { runCli } from './run.js';
import { VERSION } from './version.js';

type Stage = readonly string[];

/** A named spec, referred to by label in the transcripts rather than inlined. */
interface Fixture {
  label: string;
  text: string;
}

type Stdin = string | Fixture;

function quoteArg(arg: string): string {
  return /[\s'"]/.test(arg) || arg.length === 0 ? `'${arg}'` : arg;
}

function indentBlock(text: string, prefix: string): string {
  return text
    .replace(/\n$/, '')
    .split('\n')
    .map(line => `${prefix}${line}`)
    .join('\n');
}

/**
 * Replace details which vary between Node versions,
 * such as the wording of JSON.parse errors.
 * @param text The text to redact.
 * @returns The redacted text.
 */
function redactVolatile(text: string): string {
  return text.replace(/(as JSON): .*/g, '$1: <parser message>');
}

function stdinText(stdin: Stdin): string {
  return typeof stdin === 'string' ? stdin : stdin.text;
}

function formatStdin(stdin: Stdin): string[] {
  const text = stdinText(stdin);
  if (text.length === 0) {
    return [];
  }
  if (typeof stdin !== 'string') {
    return [`stdin: <${stdin.label}>`];
  }
  if (text.trim().length === 0) {
    return ['stdin: (whitespace only)'];
  }
  return ['stdin:', indentBlock(text, '  ')];
}

/**
 * Run a sequence of commands, piping the stdout of each into the stdin
 * of the next, and format the result as a transcript for snapshotting.
 * @param stages The commands to run, as argument arrays.
 * @param initialStdin The contents of stdin for the first command.
 * @returns The transcript.
 */
async function transcript(stages: readonly Stage[], initialStdin: Stdin = ''): Promise<string> {
  const lines: string[] = formatStdin(initialStdin);
  let stdin = stdinText(initialStdin);
  let stdout = stdin;
  let exitCode = 0;
  for (const argv of stages) {
    lines.push(`$ usecoord ${argv.map(quoteArg).join(' ')}`);
    // Each stage depends on the stdout of the previous one.
    // eslint-disable-next-line no-await-in-loop
    const result = await runCli(argv, async () => stdin);
    if (result.stderr.length > 0) {
      lines.push(indentBlock(redactVolatile(result.stderr), '  stderr| '));
    }
    if (result.exitCode !== 0) {
      lines.push(`  exit code| ${result.exitCode}`);
    }
    exitCode = result.exitCode;
    stdout = result.stdout;
    stdin = result.stdout;
  }
  lines.push('stdout:');
  lines.push(stdout.length > 0 ? indentBlock(stdout, '  ') : '  (empty)');
  lines.push(`exit code: ${exitCode}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Run a single command.
 * @param argv The command arguments.
 * @param stdin The contents of stdin.
 * @returns The transcript.
 */
function one(argv: Stage, stdin: Stdin = ''): Promise<string> {
  return transcript([argv], stdin);
}

/** A spec with one coordination type, two scopes and three views. */
const EXAMPLE_SPEC: Fixture = {
  label: 'EXAMPLE_SPEC',
  text: JSON.stringify({
    coordinationSpace: {
      myValue: {
        myValueScope1: 99,
        myValueScope2: 20,
      },
    },
    viewCoordination: {
      v1: { coordinationScopes: { myValue: 'myValueScope1' } },
      v2: { coordinationScopes: { myValue: 'myValueScope1' } },
      v3: { coordinationScopes: { myValue: 'myValueScope2' } },
    },
  }, null, 2),
};

/** The nested `--input` example from the README. */
const IMAGE_LAYER_INPUT = JSON.stringify({
  spatialImageLayer: {
    $CL: [
      {
        fileUid: 'my-image',
        spatialLayerVisible: true,
        spatialImageChannel: {
          $CL: [
            { spatialTargetC: 0, spatialChannelColor: [255, 0, 0] },
            { spatialTargetC: 1, spatialChannelColor: [0, 255, 0] },
          ],
        },
      },
    ],
  },
});

describe('usecoord', () => {
  it('normalizes the example spec used as stdin by the tests below', async () => {
    expect(await one(['print'], EXAMPLE_SPEC.text)).toMatchSnapshot();
  });

  describe('help', () => {
    it('prints the global help', async () => {
      expect(await one(['--help'])).toMatchSnapshot();
    });
    it('prints the global help when no command is passed', async () => {
      const withFlag = await runCli(['--help'], async () => '');
      const withoutArgs = await runCli([], async () => '');
      expect(withoutArgs).toEqual(withFlag);
    });
    it('prints the help of one command', async () => {
      expect(await one(['link-views-by-object', '--help'])).toMatchSnapshot();
    });
    it('prints the help of one command via the help command', async () => {
      expect(await one(['help', 'add-coordination'])).toMatchSnapshot();
    });
    it('prints the version', async () => {
      const result = await runCli(['--version'], async () => '');
      expect(result.stdout).toBe(`${VERSION}\n`);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('--skill', () => {
    const reference = readFileSync(new URL('../skill/REFERENCE.md', import.meta.url), 'utf8');

    it('emits the skill reference document verbatim', async () => {
      const result = await runCli(['--skill'], async () => '');
      expect(result.stdout).toBe(reference);
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
    });
    it('does not read stdin', async () => {
      const readStdin = vi.fn(async () => '');
      await runCli(['--skill'], readStdin);
      expect(readStdin).not.toHaveBeenCalled();
    });
    it('has a stable outline', () => {
      const headings = reference
        .split('\n')
        .filter(line => /^#{1,4} /.test(line))
        .join('\n');
      expect(`${headings}\n`).toMatchSnapshot();
    });
    it('documents every command', () => {
      const undocumented = COMMANDS.filter(command => (
        !reference.includes(`\`${command.usage}\``)
      ));
      expect(undocumented.map(command => command.name)).toEqual([]);
    });
    it('documents every option of every command', () => {
      const undocumented = COMMANDS.flatMap(command => (
        Object.keys(command.options)
          .filter(option => !reference.includes(`--${option}`))
          .map(option => `${command.name} --${option}`)
      ));
      expect(undocumented).toEqual([]);
    });
    it('is mentioned in the global help', async () => {
      const result = await runCli(['--help'], async () => '');
      expect(result.stdout).toContain('--skill');
    });
  });

  describe('init', () => {
    it('emits an empty spec', async () => {
      expect(await one(['init'])).toMatchSnapshot();
    });
    it('emits an empty spec with a string key', async () => {
      expect(await one(['init', '--key', 'my-spec'])).toMatchSnapshot();
    });
    it('emits an empty spec with a numeric key', async () => {
      expect(await one(['init', '--key', '42'])).toMatchSnapshot();
    });
    it('ignores stdin', async () => {
      expect(await one(['init'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('does not read stdin', async () => {
      const readStdin = vi.fn(async () => '');
      await runCli(['init'], readStdin);
      expect(readStdin).not.toHaveBeenCalled();
    });
  });

  describe('views', () => {
    it('adds views', async () => {
      expect(await transcript([
        ['init'],
        ['add-view', 'v1'],
        ['add-view', 'v2'],
      ])).toMatchSnapshot();
    });
    it('is a no-op when adding an existing view', async () => {
      expect(await one(['add-view', 'v1'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('removes a view', async () => {
      expect(await one(['remove-view', 'v2'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('is a no-op when removing an absent view', async () => {
      expect(await one(['remove-view', 'nope'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
  });

  describe('coordination space', () => {
    it('adds a scope with an explicit name', async () => {
      expect(await transcript([
        ['init'],
        ['add-coordination', 'zoom', '--scope', 'zoomA', '--value', '10'],
      ])).toMatchSnapshot();
    });
    it('upserts a scope with an explicit name, without clobbering the value', async () => {
      expect(await transcript([
        ['add-coordination', 'myValue', '--scope', 'myValueScope1'],
        ['add-coordination', 'myValue', '--scope', 'myValueScope3'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('auto-names a scope, reporting the name on stderr', async () => {
      expect(await transcript([
        ['add-coordination', 'myValue'],
        ['add-coordination', 'zoom', '--value', '{"level":2}'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('sets a coordination value, creating the scope if needed', async () => {
      expect(await transcript([
        ['set-coordination-value', 'myValue', 'myValueScope1', '100'],
        ['set-coordination-value', 'obsType', 'obsTypeA', 'cell'],
        ['set-coordination-value', 'obsSetSelection', 'setA', '[["Cell Type","B cell"]]'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('removes a scope, dropping the type when it becomes empty', async () => {
      expect(await transcript([
        ['remove-coordination', 'myValue', 'myValueScope2'],
        ['remove-coordination', 'myValue', 'myValueScope1'],
        ['remove-coordination', 'myValue', 'nope'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
  });

  describe('wiring views to scopes', () => {
    it('maps a view to a scope', async () => {
      expect(await transcript([
        ['use-coordination', 'v3', 'myValue', 'myValueScope1'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('warns when the scope is absent from the coordination space', async () => {
      expect(await one(['use-coordination', 'v1', 'zoom', 'zoomA'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
    it('errors when the view is absent', async () => {
      expect(await one(['use-coordination', 'nope', 'myValue', 'myValueScope1'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
    it('unmaps a view from a coordination type', async () => {
      expect(await transcript([
        ['unuse-coordination', 'v1', 'myValue'],
        ['unuse-coordination', 'v1', 'myValue'],
        ['unuse-coordination', 'nope', 'myValue'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
  });

  describe('view-level values', () => {
    it('sets a value on a view directly', async () => {
      expect(await transcript([
        ['add-view', 'v4'],
        ['set-view-coordination-value', 'v4', 'myValue', '42'],
        ['set-view-coordination-value', 'v4', 'obsType', 'cell'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('warns when the view is also mapped to a scope of the same type', async () => {
      expect(await one(['set-view-coordination-value', 'v1', 'myValue', '42'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
    it('errors when the view is absent', async () => {
      expect(await one(['set-view-coordination-value', 'nope', 'myValue', '42'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
    it('is idempotent', async () => {
      const argv = ['set-view-coordination-value', 'v3', 'panelTitle', 'Right panel'];
      const once = await runCli(argv, async () => EXAMPLE_SPEC.text);
      const twice = await runCli(argv, async () => once.stdout);
      expect(twice.stdout).toBe(once.stdout);
    });
    it('unsets a value, dropping coordinationValues when it becomes empty', async () => {
      expect(await transcript([
        ['set-view-coordination-value', 'v3', 'myValue', '42'],
        ['unset-view-coordination-value', 'v3', 'myValue'],
        ['unset-view-coordination-value', 'v3', 'myValue'],
        ['unset-view-coordination-value', 'nope', 'myValue'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('survives a round-trip through the object-oriented API', async () => {
      expect(await transcript([
        ['set-view-coordination-value', 'v3', 'myValue', '42'],
        // link-views without --scope goes through CmvConfig.
        ['link-views', 'zoom', '--views', 'v1', 'v2', '--value', '10'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('gets a value which a view defines directly', async () => {
      expect(await transcript([
        ['set-view-coordination-value', 'v3', 'myValue', '{"level":2}'],
        ['get-view-coordination-value', 'v3', 'myValue'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('validates against the JSON schema', async () => {
      expect(await transcript([
        ['set-view-coordination-value', 'v3', 'panelTitle', 'Right panel'],
        ['validate'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('errors when the view does not define a value of the type', async () => {
      expect(await one(['get-view-coordination-value', 'v1', 'myValue'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
  });

  describe('link-views', () => {
    it('links views on an explicitly named scope, creating missing views', async () => {
      expect(await transcript([
        ['init'],
        ['link-views', 'zoom', '--views', 'v1', 'v2', 'v3', '--scope', 'zoomA', '--value', '10'],
      ])).toMatchSnapshot();
    });
    it('is idempotent when the scope is named', async () => {
      const stages: Stage[] = [
        ['link-views', 'zoom', '--views', 'v1', 'v2', '--scope', 'zoomA', '--value', '10'],
      ];
      const once = await runCli(stages[0], async () => EXAMPLE_SPEC.text);
      const twice = await runCli(stages[0], async () => once.stdout);
      expect(twice.stdout).toBe(once.stdout);
    });
    it('auto-names the shared scope, reporting the name on stderr', async () => {
      expect(await transcript([
        ['link-views', 'myValue', '--views', 'v1', 'v2', '--value', '"linked"'],
      ], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('errors when no views are passed', async () => {
      expect(await one(['link-views', 'zoom', '--scope', 'zoomA'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
  });

  describe('link-views-by-object', () => {
    it('sets up meta-coordination across views', async () => {
      expect(await transcript([
        ['init'],
        ['add-view', 'spatial'],
        ['link-views-by-object', '--views', 'spatial', 'lc', '--input', IMAGE_LAYER_INPUT],
      ])).toMatchSnapshot();
    });
    it('attaches the scopes directly to the views with --no-meta', async () => {
      expect(await one([
        'link-views-by-object',
        '--views', 'spatial',
        '--input', IMAGE_LAYER_INPUT,
        '--no-meta',
      ])).toMatchSnapshot();
    });
    it('prefixes the generated scope names', async () => {
      expect(await one([
        'link-views-by-object',
        '--views', 'spatial', 'lc',
        '--input', '{"zoom":10,"obsType":"cell"}',
        '--scope-prefix', 'init',
      ])).toMatchSnapshot();
    });
    it('errors when --input is absent', async () => {
      expect(await one(['link-views-by-object', '--views', 'v1'])).toMatchSnapshot();
    });
    it('errors when --input is not JSON', async () => {
      expect(await one(['link-views-by-object', '--views', 'v1', '--input', 'zoom']))
        .toMatchSnapshot();
    });
    it('errors when the $CL sentinel has sibling keys', async () => {
      expect(await one([
        'link-views-by-object',
        '--views', 'v1',
        '--input', '{"spatialImageLayer":{"$CL":[{"fileUid":"a"}],"other":1}}',
      ])).toMatchSnapshot();
    });
    it('errors when the $CL sentinel value is not an object', async () => {
      expect(await one([
        'link-views-by-object',
        '--views', 'v1',
        '--input', '{"spatialImageLayer":{"$CL":10}}',
      ])).toMatchSnapshot();
    });
  });

  describe('print', () => {
    it('normalizes and pretty-prints the spec', async () => {
      const messySpec = JSON.stringify({
        key: 'messy',
        coordinationSpace: { zoom: { zoomA: 10 }, obsType: null },
        metaCoordination: { coordinationScopes: {}, coordinationScopesBy: {} },
        viewCoordination: {
          v1: {
            coordinationScopes: {},
            metaCoordinationScopes: 'metaA',
            metaCoordinationScopesBy: [],
          },
          v2: null,
        },
      });
      expect(await one(['print'], messySpec)).toMatchSnapshot();
    });
    it('is an identity filter', async () => {
      const once = await runCli(['print'], async () => EXAMPLE_SPEC.text);
      const twice = await runCli(['print'], async () => once.stdout);
      expect(twice.stdout).toBe(once.stdout);
    });
    it('emits an empty spec for empty stdin', async () => {
      expect(await one(['print'], '  \n')).toMatchSnapshot();
    });
  });

  describe('validate', () => {
    it('reports a valid spec and passes it through', async () => {
      expect(await one(['validate'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('reports the issues of an invalid spec and exits non-zero', async () => {
      const invalidSpec = JSON.stringify({
        coordinationSpace: { myValue: { myValueScope1: 99 } },
        viewCoordination: {
          v1: { coordinationScopes: { myValue: 5 } },
          v2: { coordinationScopes: { myValue: ['myValueScope1', 3] } },
        },
      });
      expect(await one(['validate'], invalidSpec)).toMatchSnapshot();
    });
    it('sits mid-pipeline', async () => {
      expect(await transcript([
        ['init'],
        ['add-coordination', 'zoom', '--scope', 'zoomA', '--value', '10'],
        ['validate'],
        ['link-views', 'zoom', '--views', 'v1', 'v2', '--scope', 'zoomA'],
        ['validate'],
      ])).toMatchSnapshot();
    });
  });

  describe('queries', () => {
    it('lists the views', async () => {
      expect(await one(['list-views'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('lists no views for an empty spec', async () => {
      expect(await transcript([['init'], ['list-views']])).toMatchSnapshot();
    });
    it('gets a view mapping object', async () => {
      expect(await one(['get-view', 'v1'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('errors when getting an absent view', async () => {
      expect(await one(['get-view', 'nope'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('lists the coordination types', async () => {
      expect(await one(['list-coordination-types'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('lists the scopes of a coordination type', async () => {
      expect(await one(['list-scopes', 'myValue'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('warns when listing the scopes of an absent coordination type', async () => {
      expect(await one(['list-scopes', 'nope'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('gets a coordination value', async () => {
      expect(await one(['get-coordination-value', 'myValue', 'myValueScope1'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
    it('errors when getting an absent coordination value', async () => {
      expect(await one(['get-coordination-value', 'myValue', 'nope'], EXAMPLE_SPEC))
        .toMatchSnapshot();
    });
    it('gets a coordination value at the end of a pipeline', async () => {
      expect(await transcript([
        ['init'],
        ['add-coordination', 'zoom', '--scope', 'zoomA', '--value', '{"level":[1,2]}'],
        ['get-coordination-value', 'zoom', 'zoomA'],
      ])).toMatchSnapshot();
    });
  });

  describe('argument parsing', () => {
    it('accepts --option=value', async () => {
      expect(await one(['init', '--key=my-spec'])).toMatchSnapshot();
    });
    it('parses plain strings which are not JSON as strings', async () => {
      expect(await transcript([
        ['add-coordination', 'obsType', '--scope', 'obsTypeA', '--value', 'cell'],
        ['add-coordination', 'obsColorEncoding', '--scope', 'A', '--value', '"cellSetSelection"'],
        ['add-coordination', 'spatialTargetX', '--scope', 'A', '--value', '-1.5'],
        ['add-coordination', 'spatialLayerVisible', '--scope', 'A', '--value', 'false'],
        ['add-coordination', 'obsSetSelection', '--scope', 'A', '--value', 'null'],
      ])).toMatchSnapshot();
    });
    it('errors on an unknown command', async () => {
      expect(await one(['add-vieww', 'v1'])).toMatchSnapshot();
    });
    it('errors on an unknown option', async () => {
      expect(await one(['add-view', 'v1', '--scope', 'zoomA'])).toMatchSnapshot();
    });
    it('errors on a missing required argument', async () => {
      expect(await one(['use-coordination', 'v1', 'myValue'], EXAMPLE_SPEC)).toMatchSnapshot();
    });
    it('errors on an unexpected argument', async () => {
      expect(await one(['add-view', 'v1', 'v2'])).toMatchSnapshot();
    });
    it('errors on a missing option value', async () => {
      expect(await one(['add-coordination', 'zoom', '--scope'])).toMatchSnapshot();
    });
  });

  describe('spec parsing', () => {
    it('errors when stdin is not JSON', async () => {
      expect(await one(['print'], 'not json')).toMatchSnapshot();
    });
    it('errors when stdin is not a JSON object', async () => {
      expect(await one(['print'], '[1, 2]')).toMatchSnapshot();
    });
    it('errors when the coordination space is not an object', async () => {
      expect(await one(['print'], '{"coordinationSpace": 10}')).toMatchSnapshot();
    });
  });

  describe('authoring workflow', () => {
    it('builds the spec from the README', async () => {
      expect(await transcript([
        ['init', '--key', 'my-spec'],
        ['add-view', 'v1'],
        ['add-view', 'v2'],
        ['add-view', 'v3'],
        ['link-views', 'myValue', '--views', 'v1', 'v2', '--scope', 'myValueScope1', '--value', '99'],
        ['add-coordination', 'myValue', '--scope', 'myValueScope2', '--value', '20'],
        ['use-coordination', 'v3', 'myValue', 'myValueScope2'],
        ['set-coordination-value', 'myValue', 'myValueScope2', '21'],
        ['validate'],
      ])).toMatchSnapshot();
    });
    it('is idempotent', async () => {
      const stages: Stage[] = [
        ['add-view', 'v1'],
        ['add-view', 'v2'],
        ['link-views', 'myValue', '--views', 'v1', 'v2', '--scope', 'myValueScope1', '--value', '99'],
        ['add-coordination', 'myValue', '--scope', 'myValueScope2', '--value', '20'],
        ['use-coordination', 'v1', 'myValue', 'myValueScope1'],
      ];
      const run = async (stdin: string): Promise<string> => {
        let text = stdin;
        for (const argv of stages) {
          // Each stage depends on the stdout of the previous one.
          // eslint-disable-next-line no-await-in-loop
          const result = await runCli(argv, async () => text);
          expect(result.exitCode).toBe(0);
          text = result.stdout;
        }
        return text;
      };
      const once = await run('');
      expect(await run(once)).toBe(once);
    });
  });
});
