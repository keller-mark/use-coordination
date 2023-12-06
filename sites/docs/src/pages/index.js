
import React from 'react';
import Layout from '@theme/Layout';
import { CmvProviderExample } from '@mm-cmv/all';

const logoUrl = '';
const siteConfig = {};

export default function Index() {
  return (
    <Layout
      description="mmCMV is a library for coordinated multiple views in React-based visualization systems."
    >
      <header className={'hero hero--primary'}>
        <div className={'container'}>
          <h1>mmCMV</h1>
          <p className="hero__subtitle">Multi&#8211;level and meta&#8211; coordinated multiple views</p>
        </div>
      </header>
      <main>
        <section style={{ margin: '20px'}}>
          <h3>Installation</h3>
          <pre>
            npm install mm-cmv
          </pre>
          <h3>Demo</h3>
          <CmvProviderExample />
        </section>
      </main>
    </Layout>
  );
}