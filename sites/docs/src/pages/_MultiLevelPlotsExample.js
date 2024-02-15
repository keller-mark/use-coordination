import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function MultiLevelPlotsExampleWrapper(props) {
    return (
        <BrowserOnly fallback={<div>Loading...</div>}>
        {() => {
            const MultiLevelPlotsExample = require('@use-coordination/plots-example').MultiLevelPlotsExample;
            return <MultiLevelPlotsExample {...props} />;
        }}
        </BrowserOnly>
    );
}
