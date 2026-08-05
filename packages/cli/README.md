# Use-Coordination CLI (`usecoord`)

`usecoord` builds and edits use-coordination specs, which declaratively link multiple views (interactive plots / control components) on shared pieces of state (a *coordination space*).

## Usage

Install globally to get the `usecoord` executable on your `PATH`:

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

After changing files under `src/`, re-run `pnpm run build-tsc` (or `pnpm run
start-tsc` from the repo root to watch and rebuild automatically) before
re-invoking the CLI. To run the test suite instead:

```sh
pnpm --filter @use-coordination/cli test
```

## Stateless pipe model

`usecoord` is a **stateless, idempotent Unix filter**: the input spec is read from **stdin** (an empty spec is used when stdin is empty, so you can start from scratch), and the transformed spec is written to **stdout**. Chain commands with pipes — each applies one transformation.


## Authoring workflow

1. `usecoord init [--key <key>]` — emit an empty spec (ignores stdin) to start a pipeline.
2. `usecoord add-view <view_uid>` — one per view/plot/control you want to coordinate.
3. Link views on shared state, preferring **explicit `--scope` names** so commands stay idempotent:
   - `usecoord link-views <type> --views <a> <b> --scope <name> [--value <json>]` — one shared scope across several views (e.g. `zoom`, `selection`).
   - `usecoord add-coordination <type> --scope <name> [--value <json>]` then `usecoord use-coordination <view> <type> <name>` — for finer control (e.g. coordinate only some views, or give views different scopes of the same type).
4. `usecoord set-coordination-value <type> <scope> <value>` — set/adjust a value later (idempotent upsert).
5. `usecoord validate` — check against the JSON schema; sits mid-pipeline (issues → stderr, spec passes through stdout, non-zero exit on failure).
6. Inspect with the query commands: `list-views`, `get-view <v>`, `list-coordination-types`, `list-scopes <type>`, `get-coordination-value <type> <scope>`.

## Key concepts

- **Coordination type**: *what* is coordinated (a dimension of shared state), e.g. `zoom`, `spatialTargetX`, `obsSetSelection`.
- **Coordination scope**: a named slot holding one value of a type. Views mapped to the *same* scope of a type are linked on it; different scopes keep them independent.
- **View mapping**: `viewCoordination[view].coordinationScopes[type] = scope` — wires a view to a scope.


# usecoord — Full Command Reference

`usecoord` is a stateless filter: unless noted, each command reads a spec from **stdin** (empty spec if stdin is empty/absent) and writes to **stdout**. **Transforms** emit the resulting spec; **queries** emit information and end a pipeline. A **value** argument is parsed as JSON when possible, otherwise as a plain string.

## Meta

These ignore stdin and emit text rather than a spec.

| Command | Behavior |
|---|---|
| `usecoord --help`, `usecoord <command> --help`, `usecoord help <command>` | List all commands, or show the arguments of one command. |
| `usecoord --version` | Print the package version. |
| `usecoord --skill` | Print the agent skill reference document (`skill/REFERENCE.md`) as markdown: the full guide to this CLI and its subcommands. |

## Creation

| Command | Behavior |
|---|---|
| `usecoord init [--key <key>]` | Ignore stdin; emit a fresh empty spec (`coordinationSpace: {}`, `viewCoordination: {}`), optionally with a top-level `key`. |

## Transforms — views

| Command | Behavior |
|---|---|
| `usecoord add-view <view_uid>` | Add a view with no scopes attached. No-op if it already exists. |
| `usecoord remove-view <view_uid>` | Remove a view. No-op if absent. |

## Transforms — coordination space

| Command | Behavior |
|---|---|
| `usecoord add-coordination <type> [--scope <name>] [--value <json>]` | Add a scope of `type`. With `--scope`: deterministic upsert. Without: auto-name the scope (reported on stderr). `--value` sets an initial value. |
| `usecoord set-coordination-value <type> <scope> <value>` | Upsert a scope's value (creating it if needed). Idempotent. Maps to `CmvConfig.setCoordinationValue`. |
| `usecoord remove-coordination <type> <scope>` | Remove a scope; drops the type if it becomes empty. No-op if absent. |

## Transforms — wiring views to scopes

| Command | Behavior |
|---|---|
| `usecoord use-coordination <view_uid> <type> <scope>` | Set `viewCoordination[view].coordinationScopes[type] = scope`. Idempotent. Errors if the view is missing; warns on stderr if the scope is absent from the coordination space. |
| `usecoord unuse-coordination <view_uid> <type>` | Remove a type from a view's `coordinationScopes`. No-op if absent. |

## Transforms — multi-view linking (convenience)

| Command | Behavior |
|---|---|
| `usecoord link-views <type> --views <uid> [<uid> ...] [--scope <name>] [--value <json>]` | Create a shared scope of `type` and attach it to every named view (missing views are created). With `--scope`: idempotent. Without: auto-named (reported on stderr). Maps to `CmvConfig.linkViews`. |
| `usecoord link-views-by-object --views <uid> [<uid> ...] --input <json> [--no-meta] [--scope-prefix <p>]` | Set up multi-level and/or meta-coordination across the named views. Maps to `CmvConfig.linkViewsByObject`. See below. |

### `--input` and the `{"$CL": ...}` sentinel

`linkViewsByObject` uses the library's `CL(...)` helper to mark a nested coordination *level* (rather than a literal value). Since `CL(...)` cannot be written in JSON, express it as `{"$CL": <value>}`; the CLI revives each such object into `CL(<value>)` before applying the input.

```jsonc
// One image layer with two channels, coordinated across --views:
{
  "spatialImageLayer": { "$CL": [
    {
      "fileUid": "my-image",
      "spatialLayerVisible": true,
      "spatialImageChannel": { "$CL": [
        { "spatialTargetC": 0, "spatialChannelColor": [255, 0, 0] },
        { "spatialTargetC": 1, "spatialChannelColor": [0, 255, 0] }
      ]}
    }
  ]}
}
```

- `--no-meta`: attach scopes directly to views instead of via meta-coordination (`{ meta: false }`).
- `--scope-prefix <p>`: prefix all generated scope names.

## Transforms — passthrough

| Command | Behavior |
|---|---|
| `usecoord print` | Re-emit the spec, normalized and pretty-printed (identity filter). |
| `usecoord validate` | Validate against the JSON schema (`genericSpecSchema`). Reports `Valid` or the issues on **stderr**, passes the spec through **stdout** unchanged, exits non-zero when invalid. |

## Queries (terminal)

| Command | Output |
|---|---|
| `usecoord list-views` | One view UID per line. |
| `usecoord get-view <view_uid>` | The view's mapping object as JSON (`coordinationScopes`, `coordinationScopesBy`, `metaCoordinationScopes`, `metaCoordinationScopesBy`). |
| `usecoord list-coordination-types` | One coordination type per line. |
| `usecoord list-scopes <type>` | One scope name (of `type`) per line. |
| `usecoord get-coordination-value <type> <scope>` | The scope's value as JSON. |
