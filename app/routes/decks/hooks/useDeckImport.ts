import { useState } from 'react';
import type { useSubmit } from 'react-router';
import {
    SET_NAME_TO_INDEX,
    type Card as LorcanaCard,
} from '../../../types/lorcana';

export interface MatchedCard {
    card: LorcanaCard;
    quantity: number;
}

export interface UnmatchedCard {
    name: string;
    quantity: number;
    setCode?: string;
}

export interface ParsedResults {
    matched: MatchedCard[];
    unmatched: UnmatchedCard[];
}

interface UseDeckImportOptions {
    cards: LorcanaCard[];
    submit: ReturnType<typeof useSubmit>;
    userId?: string | null;
}

export function useDeckImport({ cards, submit, userId }: UseDeckImportOptions) {
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importTitle, setImportTitle] = useState('');
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [parsedResults, setParsedResults] = useState<ParsedResults | null>(null);

    const handleValidateImport = () => {
        if (!importText.trim()) {
            setImportError('Please paste a decklist first.');
            setParsedResults(null);
            return;
        }

        const lines = importText.split('\n');
        const matched: MatchedCard[] = [];
        const unmatched: UnmatchedCard[] = [];

        const cardsByName = new Map<string, LorcanaCard>();
        const cardsBySetNum = new Map<string, LorcanaCard>();

        cards.forEach((c) => {
            cardsByName.set(c.name.toLowerCase().trim(), c);
            const setIdx = SET_NAME_TO_INDEX[c.set];
            if (setIdx !== undefined) {
                const setCode = `${setIdx.toString().padStart(3, '0')}-${c.number.toString().padStart(3, '0')}`;
                cardsBySetNum.set(setCode, c);
                cardsBySetNum.set(`${setIdx}-${c.number}`, c);
            }
        });

        for (let line of lines) {
            line = line.trim();
            if (
                !line ||
                line.startsWith('//') ||
                line.startsWith('#') ||
                line.toLowerCase().startsWith('deck:')
            ) {
                continue;
            }

            const match = line.match(/^(\d+)\s+x?\s*([^(]+)(?:\(([^)]+)\))?/i);
            if (!match) {
                const simpleMatch = line.match(/^(\d+)\s+(.+)$/);
                if (simpleMatch) {
                    const qty = parseInt(simpleMatch[1], 10);
                    const name = simpleMatch[2].trim();
                    const card = cardsByName.get(name.toLowerCase());
                    if (card) {
                        matched.push({ card, quantity: qty });
                    } else {
                        unmatched.push({ name, quantity: qty });
                    }
                }
                continue;
            }

            const qty = parseInt(match[1], 10);
            const rawName = match[2].trim();
            const setCodeRaw = match[3]?.trim();

            const cardName = rawName.replace(/\s+x\d+$/i, '').trim();
            let resolvedCard: LorcanaCard | undefined = undefined;

            if (setCodeRaw) {
                resolvedCard = cardsBySetNum.get(setCodeRaw);
                if (!resolvedCard) {
                    const normalizedCode = setCodeRaw.replace(/[/\\s]/g, '-');
                    resolvedCard = cardsBySetNum.get(normalizedCode);
                }
            }

            if (!resolvedCard) {
                resolvedCard = cardsByName.get(cardName.toLowerCase());
            }

            if (!resolvedCard) {
                const normalizedInput = cardName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '');
                resolvedCard = cards.find(
                    (c) =>
                        c.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                        normalizedInput,
                );
            }

            if (resolvedCard) {
                matched.push({ card: resolvedCard, quantity: qty });
            } else {
                unmatched.push({
                    name: cardName,
                    quantity: qty,
                    setCode: setCodeRaw,
                });
            }
        }

        setParsedResults({ matched, unmatched });
        setImportError(null);
    };

    const handleSubmitImport = () => {
        if (!importTitle.trim()) {
            setImportError('Please enter a Deck Title.');
            return;
        }
        if (!parsedResults || parsedResults.matched.length === 0) {
            setImportError(
                'Please validate the deck first and ensure at least one card is matched.',
            );
            return;
        }

        const payload = parsedResults.matched.map((m) => ({
            cardId: m.card.id,
            quantity: m.quantity,
        }));

        submit(
            {
                intent: 'import-deck',
                userId: userId || 'guest-user',
                title: importTitle,
                description: 'User imported custom deck',
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );

        setImportModalOpen(false);
        setImportTitle('');
        setImportText('');
        setParsedResults(null);
    };

    return {
        importModalOpen,
        setImportModalOpen,
        importTitle,
        setImportTitle,
        importText,
        setImportText,
        importError,
        parsedResults,
        handleValidateImport,
        handleSubmitImport,
    };
}
