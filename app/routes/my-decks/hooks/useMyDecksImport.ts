import { useState, useMemo } from 'react';
import type { Card as LorcanaCard } from '../../../types/lorcana';
import { SET_NAME_TO_INDEX } from '../../../types/lorcana';
import { serializeDeckMetadata } from '../utils/myDecksHelpers';

interface UseMyDecksImportProps {
    cards: LorcanaCard[];
    submit: (formData: any, options?: any) => void;
    userId?: string | null;
}

export function useMyDecksImport({
    cards,
    submit,
    userId,
}: UseMyDecksImportProps) {
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importTitle, setImportTitle] = useState('');
    const [importText, setImportText] = useState('');
    const [importFormat, setImportFormat] = useState<'core' | 'infinity'>(
        'core',
    );
    const [importError, setImportError] = useState<string | null>(null);
    const [parsedResults, setParsedResults] = useState<{
        matched: Array<{ card: LorcanaCard; quantity: number }>;
        unmatched: Array<{ name: string; quantity: number; setCode?: string }>;
        detectedInks: string[];
    } | null>(null);

    const cardsByName = useMemo(() => {
        const map = new Map<string, LorcanaCard>();
        cards.forEach((c) => {
            map.set(c.name.toLowerCase().trim(), c);
        });
        return map;
    }, [cards]);

    const cardsBySetNum = useMemo(() => {
        const map = new Map<string, LorcanaCard>();
        cards.forEach((c) => {
            const setIdx = SET_NAME_TO_INDEX[c.set];
            if (setIdx !== undefined) {
                const setCode = `${setIdx.toString().padStart(3, '0')}-${c.number.toString().padStart(3, '0')}`;
                map.set(setCode, c);
                map.set(`${setIdx}-${c.number}`, c);
            }
        });
        return map;
    }, [cards]);

    const handleValidateImport = () => {
        if (!importText.trim()) {
            setImportError('Please paste a decklist first.');
            setParsedResults(null);
            return;
        }

        const lines = importText.split('\n');
        const matched: Array<{ card: LorcanaCard; quantity: number }> = [];
        const unmatched: Array<{
            name: string;
            quantity: number;
            setCode?: string;
        }> = [];

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
                    const qty = Math.min(parseInt(simpleMatch[1], 10), 4);
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

            const qty = Math.min(parseInt(match[1], 10), 4);
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

        const detectedInks = Array.from(
            new Set(
                matched.flatMap((m) =>
                    m.card.ink_color ? m.card.ink_color.split('/') : [],
                ),
            ),
        ).map((i) => i.toLowerCase().trim());

        setParsedResults({ matched, unmatched, detectedInks });
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

        const metaDesc = serializeDeckMetadata(
            importFormat,
            parsedResults.detectedInks,
            'Imported Lorcana deck',
        );

        submit(
            {
                intent: 'import-deck',
                userId: userId || 'guest-user',
                title: importTitle,
                description: metaDesc,
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
        importFormat,
        setImportFormat,
        importError,
        parsedResults,
        handleValidateImport,
        handleSubmitImport,
    };
}
