import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function WeatherExampleWrapper(props) {
    return (
        <BrowserOnly fallback={<div>Loading...</div>}>
        {() => {
            const WeatherExample = require('@use-coordination/plots-example').WeatherExample;
            return <WeatherExample {...props} />;
        }}
        </BrowserOnly>
    );
}
