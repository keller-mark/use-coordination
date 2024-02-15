# use-coordination

A library for coordinated multiple views in React-based visualization systems.


## Usage

```sh
npm install use-coordination
```

### Quick start

- Define a coordination specification (i.e., representation of the coordinated state of your app) using the [declarative](https://keller-mark.github.io/use-coordination/docs/spec-json/) or [imperative](https://keller-mark.github.io/use-coordination/docs/spec-js/) API.
- Get and set coordinated state via the `useCoordination` [hooks](https://keller-mark.github.io/use-coordination/docs/view-hooks/) within React components (i.e., views).
- Wrap the views with a [coordination provider](https://keller-mark.github.io/use-coordination/docs/provider-components/).


### Basics

In React components that define views, use the [hooks](https://keller-mark.github.io/use-coordination/docs/view-hooks/#usecoordination) from `use-coordination` to get and set values in the coordination space.
For example, if we want our view to be coordinated on a coordination type called `myValue`:

```js
import React from 'react';
import { useCoordination } from 'use-coordination';

function SomeViewType(props) {
  const { viewUid } = props;
  const [{
    myValue,
  }, {
    setMyValue,
  }] = useCoordination(viewUid, ['myValue']);

  return (
    <input
      type="number"
      value={myValue}
      onChange={e => setMyValue(e.target.value)}
    />
  );
}
```

Then, wrap the app (or a parent component of all views you would like to coordinate) in a [CoordinationProvider](https://keller-mark.github.io/use-coordination/docs/provider-components/#coordinationprovider) (or [ZodCoordinationProvider](https://keller-mark.github.io/use-coordination/docs/provider-components/#zodcoordinationprovider)).
Pass a `spec` to the provider to set the initial state of the coordination space and the view-coordination scope mappings.


```js
import React from 'react';
import { CoordinationProvider } from 'use-coordination';

// ...

// Alternatively, use the object-oriented API.
const initialSpec = defineSpec({
  coordinationSpace: {
    myValue: {
      myValueScope1: 99,
      myValueScope2: 20,
    },
  },
  viewCoordination: {
    v1: {
      coordinationScopes: {
        myValue: 'myValueScope1',
      },
    },
    v2: {
      coordinationScopes: {
        myValue: 'myValueScope1',
      },
    },
    v3: {
      coordinationScopes: {
        myValue: 'myValueScope2',
      },
    },
  },
});

function MyApp(props) {
  return (
    <CoordinationProvider spec={initialSpec}>
      <SomeViewType viewUid="v1" />
      <SomeViewType viewUid="v2" />
      <AnotherViewType viewUid="v3" />
    </CoordinationProvider>
  );
}
```

To learn more, please visit the [documentation](https://keller-mark.github.io/use-coordination/):
- [List of available hooks](https://keller-mark.github.io/use-coordination/docs/view-hooks/)
- [List of available providers](https://keller-mark.github.io/use-coordination/docs/provider-components/)
- [JSON schema](https://keller-mark.github.io/use-coordination/docs/spec-json/)
- [Object-oriented spec API](https://keller-mark.github.io/use-coordination/docs/spec-js/)


## Development

Install pnpm v8

### Setup

```sh
git clone 
pnpm install
```

### Run demo

```sh
pnpm start
```

### Lint and format

```sh
pnpm lint
pnpm format
```

### Build library

```sh
pnpm build
```

### Build demo

```sh
pnpm build-demo
```

### Monorepo tasks

```sh
pnpm meta-updater
```

## Deployment
