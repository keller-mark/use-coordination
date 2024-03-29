import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function PlotsExampleWrapper(props) {
    return (
        <BrowserOnly fallback={<div>Loading...</div>}>
        {() => {
            const PlotsExample = require('@use-coordination/plots-example').PlotsExample;
            return <PlotsExample {...props} />;
        }}
        </BrowserOnly>
    );
}
