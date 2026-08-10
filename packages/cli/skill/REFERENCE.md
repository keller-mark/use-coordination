# `usecoord` reference

`usecoord` builds and edits **use-coordination specs**: JSON documents that declaratively link
multiple views (interactive plots / control components) on shared pieces of state.

Use it whenever a task involves creating or editing a use-coordination spec (also called a
coordination spec, or a Vitessce-style view config). Prefer it over hand-writing JSON: it keeps
the spec internally consistent, it can validate against the JSON schema, and the commands are
idempotent, so a script can be re-run safely.

## Invocation model

`usecoord` is a **stateless, idempotent Unix filter**:

- The input spec is read from **stdin**. Empty or absent stdin means "start from an empty spec",
  so a pipeline can be started from scratch.
- The output spec is written to **stdout**, pretty-printed with 2-space indentation.
- Diagnostics (warnings, auto-generated scope names, validation results) go to **stderr**,
  never to stdout. stdout always stays machine-readable.
- Exit code is `0` on success and `1` on error. On error, **nothing** is written to stdout.

Commands come in two flavors:

- **Transforms** emit the resulting spec, so they can be chained with pipes.
- **Queries** emit information (not a spec), so they end a pipeline.

```sh
# Chain transforms; each applies one change.
usecoord init | usecoord add-view v1 | usecoord add-view v2 > spec.json

# Read an existing spec, edit it, write it back.
usecoord set-coordination-value zoom zoomA 12 < spec.json > spec.next.json

# End a pipeline with a query.
usecoord list-views < spec.json
```

Do not write to the same file you are reading in one pipeline (`... < spec.json > spec.json`
truncates it). Write to a temporary file and move it, or use separate steps.

Meta commands (these ignore stdin and emit text, not a spec):

| Command | Behavior |
|---|---|
| `usecoord --help` | List all commands with one-line summaries. |
| `usecoord <command> --help`, `usecoord help <command>` | Show the arguments of one command. |
| `usecoord --version` | Print the package version. |
| `usecoord --skill` | Print this reference document. |

## Spec shape

```jsonc
{
  "key": "my-spec",                  // optional; a string or number
  "coordinationSpace": {             // the values of the shared state
    "<coordinationType>": {
      "<coordinationScope>": <coordinationValue>
    }
  },
  "metaCoordination": {              // only present when meta-coordination is used
    "coordinationScopes": { "<metaScope>": { "<coordinationType>": "<scope>" } },
    "coordinationScopesBy": { "<metaScope>": { /* multi-level mappings */ } }
  },
  "viewCoordination": {              // which view is wired to which scope
    "<viewUid>": {
      "coordinationScopes": { "<coordinationType>": "<scope>" },
      "coordinationScopesBy": { /* multi-level mappings */ },
      "metaCoordinationScopes": ["<metaScope>"],
      "metaCoordinationScopesBy": ["<metaScope>"],
      "coordinationValues": { "<coordinationType>": <coordinationValue> }
    }
  }
}
```

### Key concepts

- **Coordination type** — *what* is coordinated (a dimension of shared state), e.g. `zoom`,
  `spatialTargetX`, `obsSetSelection`. Any string is accepted; the CLI does not restrict the
  vocabulary, so use the type names the consuming app expects.
- **Coordination scope** — a named slot holding one value of a type. Views mapped to the *same*
  scope of a type are linked on it; different scopes keep them independent.
- **View mapping** — `viewCoordination[view].coordinationScopes[type] = scope` wires a view to a
  scope. A view with no mapping for a type is not coordinated on that type.
- **Meta-coordination** — an indirection where a view points at a named bundle of mappings
  (`metaCoordinationScopes`) instead of listing them itself. Produced by `link-views-by-object`.
- **Multi-level coordination** — `coordinationScopesBy` maps a *parent* scope to child scopes,
  which is how repeated structures (image layers, channels) are represented.
- **View-level value** — `viewCoordination[view].coordinationValues[type]` holds a value on the
  view itself, with no scope as an intermediary. Use it when a value belongs to one view only and
  will never be shared. It **takes precedence** over that view's `coordinationScopes` and
  `metaCoordinationScopes` for the same type (but not over a finer-grained `coordinationScopesBy`
  mapping), and the app writes updates back to it.

### Normalization

Every command normalizes the spec it emits, so output is stable and re-runnable:

- `coordinationSpace` and `viewCoordination` are always present, even when empty.
- Empty `coordinationScopes` / `coordinationScopesBy` / `coordinationValues` objects and empty
  meta-scope arrays are dropped from view mapping objects, leaving `{}` for an uncoordinated view.
- A single meta scope name is expanded to a one-element array
  (`"metaCoordinationScopes": "A"` becomes `["A"]`); both forms are valid per the schema.
- A `null` in place of a coordination type's scopes becomes `{}`.
- Key order is canonical: `key`, `coordinationSpace`, `metaCoordination`, `viewCoordination`.

## Authoring workflow

1. `usecoord init [--key <key>]` — emit an empty spec to start a pipeline.
2. `usecoord add-view <view_uid>` — one per view/plot/control you want to coordinate.
3. Link views on shared state, preferring **explicit `--scope` names** so commands stay
   idempotent:
   - `usecoord link-views <type> --views <a> <b> --scope <name> [--value <json>]` — one shared
     scope across several views (e.g. `zoom`, `selection`).
   - `usecoord add-coordination <type> --scope <name> [--value <json>]` followed by
     `usecoord use-coordination <view> <type> <name>` — for finer control (coordinate only some
     views, or give views different scopes of the same type).
4. `usecoord set-coordination-value <type> <scope> <value>` — set or adjust a value later.
5. `usecoord set-view-coordination-value <view> <type> <value>` — for a value which belongs to
   one view alone, skipping the coordination space entirely.
6. `usecoord validate` — check against the JSON schema; it sits mid-pipeline.
7. Inspect with the query commands: `list-views`, `get-view`, `list-coordination-types`,
   `list-scopes`, `get-coordination-value`, `get-view-coordination-value`.

## Value parsing

A `<value>` argument or `--value` option is parsed as **JSON when possible, otherwise as a plain
string**. This means:

| Argument | Resulting value |
|---|---|
| `--value 10` | the number `10` |
| `--value -1.5` | the number `-1.5` |
| `--value true` | the boolean `true` |
| `--value null` | `null` |
| `--value cell` | the string `"cell"` |
| `--value '"cell"'` | the string `"cell"` |
| `--value '[0, 1]'` | the array `[0, 1]` |
| `--value '{"level": 2}'` | the object `{"level": 2}` |

Quote JSON arguments in the shell. To force a numeric-looking string, wrap it in JSON quotes:
`--value '"10"'`.

## Creation

### `usecoord init [--key <key>]`

Ignore stdin; emit a fresh empty spec (`coordinationSpace: {}`, `viewCoordination: {}`),
optionally with a top-level `key`. A `--key` that looks like a number becomes a number.

```sh
$ usecoord init --key my-spec
{
  "key": "my-spec",
  "coordinationSpace": {},
  "viewCoordination": {}
}
```

## Transforms — views

### `usecoord add-view <view_uid>`

Add a view with no scopes attached. No-op if it already exists (existing mappings are preserved).

### `usecoord remove-view <view_uid>`

Remove a view. No-op if absent. Scopes the view used are left in the coordination space; remove
them with `remove-coordination` if they are now unused.

## Transforms — coordination space

### `usecoord add-coordination <type> [--scope <name>] [--value <json>]`

Add a scope of `type`.

- With `--scope`: a deterministic upsert. The scope is created if absent; its value is replaced
  only when `--value` is passed, so re-running the command never clobbers a value.
- Without `--scope`: the scope is auto-named (`A`, `B`, `C`, ... per type) and the chosen name is
  reported on stderr. **Not idempotent** — re-running adds another scope. Prefer `--scope` in
  scripts.
- A scope created without `--value` gets the value `null`.

### `usecoord set-coordination-value <type> <scope> <value>`

Upsert a scope's value, creating the coordination type and scope if needed. Idempotent.
Maps to `CmvConfig.setCoordinationValue`.

```sh
$ usecoord set-coordination-value obsSetSelection setA '[["Cell Type", "B cell"]]' < spec.json
```

### `usecoord remove-coordination <type> <scope>`

Remove a scope; the coordination type is dropped when it becomes empty. No-op if absent.
Views still mapped to the removed scope keep their (now dangling) mapping — clean those up with
`unuse-coordination`.

## Transforms — wiring views to scopes

### `usecoord use-coordination <view_uid> <type> <scope>`

Set `viewCoordination[view].coordinationScopes[type] = scope`. Idempotent.
**Errors** if the view is missing (add it first with `add-view`). **Warns** on stderr, but still
succeeds, if the scope is absent from the coordination space — which is useful when the value is
filled in later, but is usually a typo.

### `usecoord unuse-coordination <view_uid> <type>`

Remove a coordination type from a view's `coordinationScopes`. No-op if the view or the type is
absent.

## Transforms — view-level values

### `usecoord set-view-coordination-value <view_uid> <type> <value>`

Set `viewCoordination[view].coordinationValues[type] = value`, so the view holds the value itself
instead of pointing at a scope. Idempotent. **Errors** if the view is missing (add it first with
`add-view`). **Warns** on stderr, but still succeeds, if the view is also mapped to a scope of the
same type — the direct value wins, which makes the scope mapping dead weight.

Prefer this over a single-view scope when the value will never be shared; prefer
`add-coordination` + `use-coordination` when another view might need to be linked on it later,
since moving a value out of `coordinationValues` means rewriting the view.

```sh
$ usecoord init | usecoord add-view v1 | usecoord set-view-coordination-value v1 zoom 10
{
  "coordinationSpace": {},
  "viewCoordination": {
    "v1": {
      "coordinationValues": {
        "zoom": 10
      }
    }
  }
}
```

### `usecoord unset-view-coordination-value <view_uid> <type>`

Remove a coordination type from a view's `coordinationValues`. No-op if the view or the type is
absent. Any `coordinationScopes` mapping for that type on the same view takes effect again.

## Transforms — multi-view linking

### `usecoord link-views <type> --views <uid> [<uid> ...] [--scope <name>] [--value <json>]`

Create a shared scope of `type` and attach it to every named view. **Missing views are created**,
so this can replace a series of `add-view` calls. Maps to `CmvConfig.linkViews`.

- With `--scope`: idempotent (same upsert rule as `add-coordination`).
- Without `--scope`: auto-named, reported on stderr, not idempotent.

```sh
$ usecoord init | usecoord link-views zoom --views v1 v2 --scope zoomA --value 10
{
  "coordinationSpace": {
    "zoom": {
      "zoomA": 10
    }
  },
  "viewCoordination": {
    "v1": {
      "coordinationScopes": {
        "zoom": "zoomA"
      }
    },
    "v2": {
      "coordinationScopes": {
        "zoom": "zoomA"
      }
    }
  }
}
```

To give views *different* scopes of one type, do not use `link-views`; use `add-coordination`
plus `use-coordination` per view.

### `usecoord link-views-by-object --views <uid> [<uid> ...] --input <json> [--no-meta] [--scope-prefix <p>]`

Set up multi-level and/or meta-coordination across the named views, creating any missing views.
Maps to `CmvConfig.linkViewsByObject`. Use this for nested structures such as image layers and
their channels; use `link-views` for flat, single-value coordination.

- `--input <json>` (required): a potentially nested object with coordination types as keys and
  either a coordination value or a nested **coordination level** as values.
- `--no-meta`: attach the scopes directly to the views (`coordinationScopes` /
  `coordinationScopesBy`) instead of via meta-coordination (`{ meta: false }`).
- `--scope-prefix <p>`: prefix all generated scope names, which makes the output readable and
  keeps generated names from colliding with hand-written ones (`p0`, `p1`, ...).

Scope names in the output are generated, so this command is **not idempotent**: running it twice
creates a second, parallel set of scopes.

#### The `{"$CL": ...}` sentinel

The library marks a nested coordination *level* (rather than a literal value) with its `CL(...)`
helper. `CL(...)` cannot be written in JSON, so express it as `{"$CL": <value>}`; the CLI revives
each such object into `CL(<value>)` before applying the input. `$CL` must be the only key of the
object containing it, and its value must be an object or an array of objects.

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

An array under `$CL` means "one scope per element" (two channels above); a plain object means a
single nested level. Scopes for the levels themselves hold the placeholder value `"__dummy__"`,
which is expected — the meaningful values live in the leaf types.

## Transforms — passthrough

### `usecoord print`

Re-emit the spec, normalized and pretty-printed (an identity filter). Useful to canonicalize a
hand-written spec, or to check that a file parses.

### `usecoord validate`

Validate against the JSON schema (`genericSpecSchema`). Reports `Valid`, or `Invalid:` followed
by one line per issue, on **stderr**; passes the spec through **stdout** unchanged; exits `1`
when invalid. Because it is a passthrough, it can sit mid-pipeline:

```sh
usecoord init | usecoord add-view v1 | usecoord validate | usecoord add-view v2
```

Validation checks the spec's structure (scope names are strings, mappings are objects, etc.). It
does **not** check that a view's scope exists in the coordination space, nor that coordination
type names are meaningful to the consuming app.

## Queries (terminal)

| Command | Output |
|---|---|
| `usecoord list-views` | One view UID per line. |
| `usecoord get-view <view_uid>` | The view's mapping object as JSON (`coordinationScopes`, `coordinationScopesBy`, `metaCoordinationScopes`, `metaCoordinationScopesBy`, `coordinationValues`). Errors if the view is absent. |
| `usecoord list-coordination-types` | One coordination type per line. |
| `usecoord list-scopes <type>` | One scope name (of `type`) per line. Warns on stderr and prints nothing if the type is absent. |
| `usecoord get-coordination-value <type> <scope>` | The scope's value as JSON. Errors if the type or scope is absent. |
| `usecoord get-view-coordination-value <view_uid> <type>` | The value the view defines directly for `type`, as JSON. Errors if the view is absent or defines no value of that type. |

`list-coordination-types` and `list-scopes` describe the **coordination space** only. A type which
appears solely in some view's `coordinationValues` has no scopes, so it shows up in `get-view`
rather than in those two listings.

## Recipes

### Two views linked, a third independent

```sh
usecoord init --key my-spec \
  | usecoord link-views myValue --views v1 v2 --scope myValueScope1 --value 99 \
  | usecoord add-view v3 \
  | usecoord add-coordination myValue --scope myValueScope2 --value 20 \
  | usecoord use-coordination v3 myValue myValueScope2 \
  | usecoord validate > spec.json
```

### Coordinate several types across the same views

```sh
usecoord init \
  | usecoord link-views spatialZoom --views spatial1 spatial2 --scope zoomA --value 3 \
  | usecoord link-views spatialTargetX --views spatial1 spatial2 --scope xA --value 0 \
  | usecoord link-views spatialTargetY --views spatial1 spatial2 --scope yA --value 0
```

### Adjust an existing spec in place

```sh
usecoord set-coordination-value zoom zoomA 12 < spec.json > spec.tmp && mv spec.tmp spec.json
```

### Unlink one view from a shared scope

```sh
usecoord unuse-coordination v2 zoom < spec.json \
  | usecoord add-coordination zoom --scope zoomB --value 4 \
  | usecoord use-coordination v2 zoom zoomB
```

### A value which belongs to one view only

```sh
usecoord init \
  | usecoord link-views zoom --views v1 v2 --scope zoomA --value 3 \
  | usecoord set-view-coordination-value v1 panelTitle 'Left panel' \
  | usecoord set-view-coordination-value v2 panelTitle 'Right panel'
```

### Inspect a spec

```sh
usecoord list-views < spec.json
usecoord get-view v1 < spec.json
usecoord list-scopes zoom < spec.json
usecoord get-coordination-value zoom zoomA < spec.json
usecoord get-view-coordination-value v1 panelTitle < spec.json
```

## Errors and troubleshooting

Errors are written to stderr as `usecoord <command>: <message>` with exit code `1`, and stdout
stays empty, so a failing stage does not emit a half-edited spec. In a shell pipeline the later
stages still run and see empty stdin, which produces an *empty* spec rather than an error — use
`set -o pipefail`, or run the steps separately, when that matters.

| Message | Cause and fix |
|---|---|
| `unknown command "..."` | Typo; run `usecoord --help`. |
| `unknown option "--..."` | Option not valid for that command; run `usecoord <command> --help`. |
| `missing required argument(s) <...>` | Positional argument omitted; the usage line follows the message. |
| `the spec does not contain a view "..."` | `use-coordination` or `set-view-coordination-value` on a missing view; `add-view` first, or use `link-views`, which creates views. |
| `the view "..." does not define a value of coordination type "..."` | `get-view-coordination-value` for a type the view does not hold directly; it may be coordinated via a scope instead — check `get-view`. |
| `expected at least one view UID after --views` | `--views` was omitted or consumed no values. |
| `could not parse the spec from stdin as JSON` | stdin was not a JSON spec — often a previous stage failed, or a shell redirect truncated the file. |
| `expected the option "--input" to be passed` | `link-views-by-object` requires `--input`. |
| `"$CL" must be the only key of the object which contains it` | Move the sibling keys into the object inside `$CL`. |
| `warning: the coordination space does not contain a scope ...` | The mapping was still written; add the scope with `add-coordination`, or fix the typo. |
| `warning: the view "..." is also mapped to a scope of coordination type ...` | Both were kept, but the view-level value wins; drop one with `unuse-coordination` or `unset-view-coordination-value`. |

## Guidance for agents

- Always pass an explicit `--scope` when scripting, so a re-run converges instead of piling up
  auto-named scopes. Auto-naming is for one-off exploration; the name it chose is on stderr.
- Build the spec in one pipeline where possible, and end with `usecoord validate` so a
  structurally broken spec fails loudly.
- Coordination type names are app-specific and are not validated. Take them from the app's
  documentation or from an existing spec (`usecoord list-coordination-types`), and do not invent
  new ones when linking views in an existing app.
- Reach for a coordination scope by default. Use `set-view-coordination-value` only for state
  that is genuinely local to one view (a title, a per-view toggle) — anything two views might
  ever share belongs in the coordination space.
- Read values back with `get-coordination-value` (or `get-view-coordination-value` for a
  view-level value) rather than re-parsing the spec by hand.
- After editing a spec that a user hand-wrote, `usecoord print` output is normalized, so the diff
  may include key reordering and pruned empty objects. That is expected and semantically neutral.
