import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function SplomExampleWrapper(props) {
    return (
        <BrowserOnly fallback={<div>Loading...</div>}>
        {() => {
            const SplomExample = require('@use-coordination/plots-example').SplomExample;
            return <SplomExample {...props} />;
        }}
        </BrowserOnly>
    );
}
