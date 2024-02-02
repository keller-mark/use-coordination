# use-coordination

A library for coordinated multiple views in React-based visualization systems.


## Usage

```sh
npm install use-coordination
```

Then, in a parent component of all views you would like to coordinate:

```js
import React from 'react';
import { CoordinationProvider } from 'use-coordination';

// ...

const initialConfig = defineConfig({ // Alternatively, use the OOP API
  coordinationSpace: {
    // TODO
  },
  viewCoordination: {
    v1: {}, // TODO
    v2: {},
    v3: {},
  },
});

function MyApp(props) {
  return (
    <CoordinationProvider config={initialConfig}>
      <SomeViewType viewUid="v1" />
      <SomeViewType viewUid="v2" />
      <AnotherViewType viewUid="v3" />
    </CoordinationProvider>
  );
}
```

The React components that define views can now use the React hooks to get and set values in the coordination space:

```js
import React from 'react';
import { useCoordination } from 'use-coordination';

function SomeViewType(props) {
  const { viewUid } = props;
  const [{}, {}] = useCoordination(viewUid, []);

  return (
    <input type="number" value={} />
  );
}
```

A list of all available hooks can be found in the documentation.

### Typescript usage

### Controlled component usage

### OOP API for initialConfig

### On Zustand store creation

### Validation of coordination values




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
