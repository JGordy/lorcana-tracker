import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeckImport } from '../useDeckImport';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('useDeckImport', () => {
    const mockCards: LorcanaCard[] = [
        {
            id: 'c1',
            name: 'Stitch - Rock Star',
            set: 'The First Chapter',
            number: 23,
            ink_color: 'Amber',
            rarity: 'Super Rare',
            cost: 6,
        } as any,
    ];

    const mockSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sets error when validating empty import text', () => {
        const { result } = renderHook(() =>
            useDeckImport({ cards: mockCards, submit: mockSubmit }),
        );

        act(() => {
            result.current.handleValidateImport();
        });

        expect(result.current.importError).toBe('Please paste a decklist first.');
        expect(result.current.parsedResults).toBeNull();
    });

    it('parses matched and unmatched cards correctly', () => {
        const { result } = renderHook(() =>
            useDeckImport({ cards: mockCards, submit: mockSubmit }),
        );

        act(() => {
            result.current.setImportText('4 Stitch - Rock Star (001-023)\n2 Unknown Dragon');
            result.current.handleValidateImport();
        });

        expect(result.current.importError).toBeNull();
        expect(result.current.parsedResults?.matched).toHaveLength(1);
        expect(result.current.parsedResults?.matched[0].card.name).toBe('Stitch - Rock Star');
        expect(result.current.parsedResults?.matched[0].quantity).toBe(4);

        expect(result.current.parsedResults?.unmatched).toHaveLength(1);
        expect(result.current.parsedResults?.unmatched[0].name).toBe('Unknown Dragon');
    });

    it('submits validated import successfully', () => {
        const { result } = renderHook(() =>
            useDeckImport({ cards: mockCards, submit: mockSubmit, userId: 'user-1' }),
        );

        act(() => {
            result.current.setImportTitle('My Aggro Deck');
            result.current.setImportText('4 Stitch - Rock Star');
            result.current.handleValidateImport();
        });

        act(() => {
            result.current.handleSubmitImport();
        });

        expect(mockSubmit).toHaveBeenCalledWith(
            {
                intent: 'import-deck',
                userId: 'user-1',
                title: 'My Aggro Deck',
                description: 'User imported custom deck',
                cards: JSON.stringify([{ cardId: 'c1', quantity: 4 }]),
            },
            { method: 'post' },
        );
        expect(result.current.importModalOpen).toBe(false);
    });
});
