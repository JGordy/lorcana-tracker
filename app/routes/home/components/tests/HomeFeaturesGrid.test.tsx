import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { HomeFeaturesGrid } from '../HomeFeaturesGrid';

describe('HomeFeaturesGrid', () => {
    it('renders the three core GlimmerForge feature cards', () => {
        render(
            <MantineProvider>
                <HomeFeaturesGrid />
            </MantineProvider>,
        );

        expect(screen.getByText('Catalog Collection')).toBeInTheDocument();
        expect(screen.getByText('Progress Matcher')).toBeInTheDocument();
        expect(screen.getByText('Smart Sort & Buy List')).toBeInTheDocument();
    });
});
