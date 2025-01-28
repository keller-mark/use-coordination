
import React from 'react';
import Layout from '@theme/Layout';
import {
  BaseExample,
  MultiViewTypeExample,
  MultiCoordinationTypeExample,
  MetaCoordinationExample,
  MultiLevelExample,
  MetaMultiLevelExample,
} from '@use-coordination/basic-example';

const logoUrl = '';
const siteConfig = {};

export default function Index() {
  return (
    <Layout
      description="use-coordination is a library for coordinated multiple views in React-based visualization systems."
    >
      <header className={'hero hero--primary'}>
        <div className={'container'}>
          <h1>use-coordination</h1>
          <p className="hero__subtitle">Easily implement coordinated multiple views</p>
        </div>
      </header>
      <main>
        <section style={{ margin: '20px'}}>
          <h3>Installation</h3>
          <pre>
            npm install use-coordination
          </pre>
          <h3>Citation</h3>
          <p>
            Keller, M.S., Manz, T., Gehlenborg, N. Use-Coordination: Model, Grammar, and Library for Implementation of Coordinated Multiple Views. <i>Proc. IEEE VIS</i> (2024). https://doi.org/10.1109/VIS55277.2024.00041
          </p>
          <h3>Demo</h3>
          
          <h4>Coordinated Multiple Views</h4>
          <p>In this most basic example, the views are sliders, coordinated on a single property (their numeric value). Watch how the JSON representation updates in response to changes.</p>
          <BaseExample />
          
          <h4>Multiple view types</h4>
          <p>Different view types can be coordinated on the same set of coordination types. For example, both the slider views and the numeric text views are coordinated on the <code>sliderValue</code> coordination type below.</p>
          <MultiViewTypeExample />

          <h4>Multiple coordination types</h4>
          <p>Views can be coordinated on multiple coordination types. For example, these "colorful slider" views support both a numeric value and an RGB color array.</p>
          <MultiCoordinationTypeExample />


          <h4>Meta-coordination</h4>
          <p>We introduce the concept of meta-coordination, i.e., storage of view--coordination scope mappings in the coordination space itself.</p>
          <MetaCoordinationExample />

          <h4>Multi-level coordination</h4>
          <p>We introduce the concept of multi-level coordination. This enables using a hierarchy of coordination scope mappings, while retaining access to the most fine-grained level of coordination. In this example, views 4, 5, and 6 are coordinated directly on the channelValues, while views 1, 2, and 3 are coordinated on arrays of channels.</p>
          <MultiLevelExample />

          <h4>Multi-level coordination and meta-coordination</h4>
          <p>Multi-level coordination works well with meta-coordination. We can store both the coordinationScopes and the coordinationScopesBy mappings in the coordination space.</p>
          <MetaMultiLevelExample />
          
        </section>
      </main>
    </Layout>
  );
}
