
import React from 'react';
import Layout from '@theme/Layout';

import { ScmdUi } from 'mm-cmv';

export default function Index() {
  return (
    <Layout
      description="Example repo."
    >
      <h1>Some home page content</h1>
      <ScmdUi color="blue" a={1} b={2} />
    </Layout>
  );
}