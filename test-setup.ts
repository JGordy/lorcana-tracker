import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock window.matchMedia for Mantine and responsive tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock @tabler/icons-react to prevent parsing 5,000+ SVG icon modules per jsdom test suite worker
vi.mock('@tabler/icons-react', () => {
    return new Proxy(
        { __esModule: true },
        {
            has: () => true,
            get: (_target, prop) => {
                if (
                    prop === '__esModule' ||
                    prop === 'default' ||
                    typeof prop === 'symbol'
                ) {
                    return undefined;
                }
                const IconComponent = (props: any) =>
                    React.createElement('svg', {
                        'data-testid': `icon-${String(prop)}`,
                        ...props,
                    });
                IconComponent.displayName = String(prop);
                return IconComponent;
            },
        },
    );
});
