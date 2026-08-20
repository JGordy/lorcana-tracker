import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { HomeDemoCallout } from '../HomeDemoCallout';

describe('HomeDemoCallout', () => {
    it('renders callout text and triggers demo login on button click', () => {
        const mockDemoLogin = vi.fn();
        render(
            <MantineProvider>
                <HomeDemoCallout onTriggerDemoLogin={mockDemoLogin} />
            </MantineProvider>,
        );

        expect(screen.getByText('Ready to test it in action?')).toBeInTheDocument();
        const button = screen.getByText('Sign In & Seed Mock Collection');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(mockDemoLogin).toHaveBeenCalled();
    });
});
