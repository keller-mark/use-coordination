# Use-Coordination CLI (`usecoord`)

`usecoord` builds and edits use-coordination specs, which declaratively link multiple views (interactive plots / control components) on shared pieces of state (a *coordination space*).

## Usage

```sh
npm install @use-coordination/cli
usecoord --help
```

Or invoke it without installing, via `npx`:

```sh
npx @use-coordination/cli --help
```

## Development

Setup:

```sh
pnpm install
pnpm run build-tsc
```

Then run the compiled CLI directly with `node`:

```sh
cd packages/cli
pnpm run exec-cli --skill
echo '{}' | pnpm run exec-cli init
```
