import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BackToTop } from './BackToTop';

// Mock @mantine/hooks useWindowScroll
const mockScrollTo = vi.fn();
let mockScrollY = 0;

vi.mock('@mantine/hooks', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@mantine/hooks')>();
    return {
        ...actual,
        useWindowScroll: () => [{ x: 0, y: mockScrollY }, mockScrollTo],
    };
});

describe('BackToTop Component', () => {
    const renderComponent = (threshold = 300) => {
        return render(
            <MantineProvider>
                <BackToTop threshold={threshold} />
            </MantineProvider>,
        );
    };

    it('should not render button when scroll position is at the top', () => {
        mockScrollY = 0;
        renderComponent();
        expect(
            screen.queryByRole('button', { name: /back to top/i }),
        ).not.toBeInTheDocument();
    });

    it('should render button when scrolled down beyond threshold', () => {
        mockScrollY = 400;
        renderComponent(300);
        const button = screen.getByRole('button', { name: /back to top/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Back to Top');
    });

    it('should call scrollTo with y: 0 when clicked', () => {
        mockScrollY = 500;
        renderComponent();
        const button = screen.getByRole('button', { name: /back to top/i });
        fireEvent.click(button);
        expect(mockScrollTo).toHaveBeenCalledWith({ y: 0 });
    });
});
