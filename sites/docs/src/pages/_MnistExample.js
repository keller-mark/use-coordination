import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function MnistExampleWrapper(props) {
    return (
        <BrowserOnly fallback={<div>Loading...</div>}>
        {() => {
            const MnistExample = require('@use-coordination/plots-example').MnistExample;
            return <MnistExample {...props} />;
        }}
        </BrowserOnly>
    );
}
