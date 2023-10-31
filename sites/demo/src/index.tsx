import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import Demo from './Demo.js';

const queryClient = new QueryClient({
    // Reference: https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching
    defaultOptions: {
        queries: {
        refetchOnWindowFocus: false,
        retry: 2,
        },
    },
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <QueryClientProvider client={queryClient}>
        <Demo />
    </QueryClientProvider>,
);
