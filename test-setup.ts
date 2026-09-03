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

// Mock specific icons for fast jsdom execution without full barrel parsing
vi.mock('@tabler/icons-react', async (importOriginal) => {
    const createDummyIcon = (name: string) => {
        const Icon = (props: any) =>
            React.createElement('svg', {
                'data-testid': `icon-${name}`,
                ...props,
            });
        Icon.displayName = name;
        return Icon;
    };

    return {
        ...(await importOriginal<typeof import('@tabler/icons-react')>()),
        IconSearch: createDummyIcon('search'),
        IconCards: createDummyIcon('cards'),
        IconUpload: createDummyIcon('upload'),
        IconInfinity: createDummyIcon('infinity'),
        IconFolderPlus: createDummyIcon('folder-plus'),
        IconBrandYoutube: createDummyIcon('brand-youtube'),
        IconCopy: createDummyIcon('copy'),
        IconCheck: createDummyIcon('check'),
        IconAlertTriangle: createDummyIcon('alert-triangle'),
        IconPlus: createDummyIcon('plus'),
        IconMinus: createDummyIcon('minus'),
        IconFilter: createDummyIcon('filter'),
        IconArrowRight: createDummyIcon('arrow-right'),
        IconSparkles: createDummyIcon('sparkles'),
        IconDatabase: createDummyIcon('database'),
        IconTrash: createDummyIcon('trash'),
        IconEdit: createDummyIcon('edit'),
        IconX: createDummyIcon('x'),
        IconChevronDown: createDummyIcon('chevron-down'),
        IconChevronUp: createDummyIcon('chevron-up'),
        IconRotateCcw: createDummyIcon('rotate-ccw'),
        IconArrowBackUp: createDummyIcon('arrow-back-up'),
        IconCircleCheck: createDummyIcon('circle-check'),
        IconAlertCircle: createDummyIcon('alert-circle'),
        IconLock: createDummyIcon('lock'),
        IconLogout: createDummyIcon('logout'),
        IconUser: createDummyIcon('user'),
        IconFolder: createDummyIcon('folder'),
        IconArrowsExchange: createDummyIcon('arrows-exchange'),
    };
});
