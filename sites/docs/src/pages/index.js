
import React from 'react';
import Layout from '@theme/Layout';
import {
  CmvProviderExample,
  MultiViewTypeExample,
  MetaCoordinationExample,
} from '@mm-cmv/all';

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
          
          <h4>Multiple view types</h4>
          <p>Different view types can be coordinated on the same set of coordination types. For example, both the slider views and the numeric text views are coordinated on the <code>sliderValue</code> coordination type below.</p>
          <MultiViewTypeExample />

          <h4>Multiple coordination types</h4>
          <p>TODO</p>


          <h4>Meta-coordination</h4>
          <p>We introduce the concept of meta-coordination, i.e., storage of view--coordination scope mappings in the coordination space itself.</p>
          <MetaCoordinationExample />

          <h4>Multi-level coordination</h4>
          <p>TODO</p>
          
        </section>
      </main>
    </Layout>
  );
}