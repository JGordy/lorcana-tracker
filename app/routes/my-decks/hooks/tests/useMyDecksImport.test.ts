import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMyDecksImport } from '../useMyDecksImport';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('useMyDecksImport', () => {
    const mockCards: LorcanaCard[] = [
        {
            id: 'c1',
            name: 'Stitch - Rock Star',
            set: 'The First Chapter',
            number: 23,
            ink_color: 'Amber',
            cost: 6,
        } as any,
    ];

    const mockSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sets error when import text is empty', () => {
        const { result } = renderHook(() =>
            useMyDecksImport({ cards: mockCards, submit: mockSubmit }),
        );

        act(() => {
            result.current.handleValidateImport();
        });

        expect(result.current.importError).toBe(
            'Please paste a decklist first.',
        );
    });

    it('validates and submits deck import', () => {
        const { result } = renderHook(() =>
            useMyDecksImport({
                cards: mockCards,
                submit: mockSubmit,
                userId: 'u1',
            }),
        );

        act(() => {
            result.current.setImportTitle('My Custom Deck');
            result.current.setImportText('4 Stitch - Rock Star (001-023)');
        });

        act(() => {
            result.current.handleValidateImport();
        });

        expect(result.current.parsedResults?.matched).toHaveLength(1);

        act(() => {
            result.current.handleSubmitImport();
        });

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                intent: 'import-deck',
                title: 'My Custom Deck',
                userId: 'u1',
            }),
            { method: 'post' },
        );
    });
});
