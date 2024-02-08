import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function TrrackExampleWrapper(props) {
    return (
        <BrowserOnly fallback={<div>Loading...</div>}>
        {() => {
            const TrrackExample = require('@use-coordination/plots-example').TrrackExample;
            return <TrrackExample {...props} />;
        }}
        </BrowserOnly>
    );
}
