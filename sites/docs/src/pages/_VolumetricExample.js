import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function VolumetricExampleWrapper(props) {
    return (
        <BrowserOnly fallback={<div>Loading...</div>}>
        {() => {
            const NiivueExample = require('@use-coordination/volumetric-example').NiivueExample;
            return <NiivueExample {...props} />;
        }}
        </BrowserOnly>
    );
}
