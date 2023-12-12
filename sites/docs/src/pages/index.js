
import React from 'react';
import Layout from '@theme/Layout';
import { CmvProviderExample, MetaCoordinationExample } from '@mm-cmv/all';

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
          <h4>Coordinated Multiple Views</h4>
          <p>In this most basic example, the views are sliders, coordinated on a single property (their numeric value). Watch how the JSON representation updates in response to changes.</p>
          <CmvProviderExample />
          <h4>Meta-coordination</h4>
          <p>We introduce the concept of meta-coordination, i.e., storage of view--coordination scope mappings in the coordination space itself.</p>
          <MetaCoordinationExample />
        </section>
      </main>
    </Layout>
  );
}