import type { Route } from './+types/my-decks';
import {
    useLoaderData,
    useSubmit,
    useFetcher,
    useNavigate,
    data,
    Link,
} from 'react-router';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Container,
    Title,
    Text,
    Button,
    Card,
    Group,
    Stack,
    Progress,
    Badge,
    Collapse,
    Table,
    TextInput,
    Select,
    Box,
    ActionIcon,
    Modal,
    Textarea,
    Tooltip,
    SimpleGrid,
    Paper,
    Alert,
    ScrollArea,
    UnstyledButton,
    Checkbox,
} from '@mantine/core';
import {
    IconSearch,
    IconChevronDown,
    IconChevronUp,
    IconPlus,
    IconMinus,
    IconTrash,
    IconCheck,
    IconAlertTriangle,
    IconCards,
    IconFolder,
    IconFolderPlus,
    IconUpload,
    IconEdit,
    IconCopy,
    IconArrowBackUp,
    IconArrowRight,
    IconInfinity,
    IconArrowsSort,
    IconX,
} from '@tabler/icons-react';
import { authService, dbService } from '../services/appwrite.server';
import {
    COLLECTIONS,
    type Card as LorcanaCard,
    SET_NAME_TO_INDEX,
    type DeckWithProgress,
} from '../types/lorcana';
import { Navbar } from '../components/Navbar';

// Lorcana Inks Configuration
const ALL_INKS = [
    { id: 'amber', name: 'Amber', hex: '#F5B041' },
    { id: 'amethyst', name: 'Amethyst', hex: '#AF7AC5' },
    { id: 'emerald', name: 'Emerald', hex: '#2ECC71' },
    { id: 'ruby', name: 'Ruby', hex: '#EC7063' },
    { id: 'sapphire', name: 'Sapphire', hex: '#5DADE2' },
    { id: 'steel', name: 'Steel', hex: '#A6ACAF' },
] as const;

export interface DeckMetadata {
    format: 'core' | 'infinity';
    inks: string[];
    description: string;
}

export function parseDeckMetadata(desc: string | undefined): DeckMetadata {
    if (!desc) return { format: 'core', inks: [], description: '' };
    try {
        const parsed = JSON.parse(desc);
        if (
            parsed &&
            typeof parsed === 'object' &&
            ('format' in parsed || 'inks' in parsed)
        ) {
            return {
                format: parsed.format === 'infinity' ? 'infinity' : 'core',
                inks: Array.isArray(parsed.inks)
                    ? parsed.inks.map((i: string) => i.toLowerCase().trim())
                    : [],
                description: parsed.description || '',
            };
        }
    } catch (_e) {
        // Ignore JSON parse error and fallback to plain description
    }
    return { format: 'core', inks: [], description: desc };
}

export function serializeDeckMetadata(
    format: 'core' | 'infinity',
    inks: string[],
    description: string,
): string {
    return JSON.stringify({ format, inks, description });
}

// ---------------------------------------------------------
// Loader (Server-side)
// ---------------------------------------------------------
export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const sort = (url.searchParams.get('sort') || 'progress') as
        'progress' | 'missing_cost' | 'name';

    const user = await authService.getSessionUser(request);
    const userId = user ? user.$id : null;

    const [decks, cards] = await Promise.all([
        userId
            ? dbService.getUserDecksWithProgress(userId, sort, request)
            : Promise.resolve([]),
        dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], request),
    ]);

    return { decks, cards, user, sort };
}

// ---------------------------------------------------------
// Action (Server-side)
// ---------------------------------------------------------
export async function action({ request }: Route.ActionArgs) {
    try {
        const formData = await request.formData();
        const intent = formData.get('intent');

        if (intent === 'logout') {
            const { cookieHeader } = await authService.logout(request);
            return data(
                { success: true },
                {
                    headers: {
                        'Set-Cookie': cookieHeader,
                    },
                },
            );
        }

        if (intent === 'login-demo') {
            const { user, cookieHeader } =
                await authService.anonymousLogin(request);
            const headers: Record<string, string> = {};
            if (cookieHeader) {
                headers['Set-Cookie'] = cookieHeader;
            }
            return data({ success: true, user }, { headers });
        }

        if (intent === 'quick-add') {
            const userId = formData.get('userId') as string;
            const cardId = formData.get('cardId') as string;
            const quantity = parseInt(formData.get('quantity') as string, 10);
            const isFoil = formData.get('isFoil') === 'true';

            const updatedItem = await dbService.updateInventory(
                userId,
                cardId,
                quantity,
                isFoil,
                request,
            );
            return { success: true, updatedItem };
        }

        if (intent === 'create-deck' || intent === 'import-deck') {
            const userId = formData.get('userId') as string;
            const title = formData.get('title') as string;
            const description = (formData.get('description') as string) || '';
            const cardsJson = formData.get('cards') as string;
            const cardsList = JSON.parse(cardsJson) as Array<{
                cardId: string;
                quantity: number;
            }>;

            const result = await dbService.createDeck(
                userId,
                title,
                description,
                cardsList,
                request,
            );
            return { success: true, result };
        }

        if (intent === 'update-deck-cards') {
            const deckId = formData.get('deckId') as string;
            const userId = formData.get('userId') as string;
            const cardsJson = formData.get('cards') as string;
            const cardsList = JSON.parse(cardsJson) as Array<{
                cardId: string;
                quantity: number;
            }>;

            const result = await dbService.updateDeckCards(
                deckId,
                userId,
                cardsList,
                request,
            );
            return { success: true, result };
        }

        if (intent === 'update-deck-details') {
            const deckId = formData.get('deckId') as string;
            const userId = formData.get('userId') as string;
            const title = formData.get('title') as string;
            const description = (formData.get('description') as string) || '';

            const result = await dbService.updateDeckDetails(
                deckId,
                userId,
                title,
                description,
                request,
            );
            return { success: true, result };
        }

        if (intent === 'delete-deck') {
            const deckId = formData.get('deckId') as string;
            const userId = formData.get('userId') as string;

            const result = await dbService.deleteDeck(deckId, userId, request);
            return { success: true, result };
        }

        return { success: false, error: 'Unknown intent' };
    } catch (error: any) {
        console.error('Action error in my-decks:', error);
        return {
            success: false,
            error: error?.message || 'An unexpected error occurred.',
        };
    }
}

export default function MyDecks() {
    const { decks, cards, user, sort } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    // Optimistic local decks state
    const [localDecks, setLocalDecks] = useState<DeckWithProgress[]>(decks);

    // Synchronize with server loader revalidations
    useEffect(() => {
        setLocalDecks(decks);
    }, [decks]);

    // Rollback on server error
    useEffect(() => {
        if (fetcher.data && (fetcher.data as { error?: string }).error) {
            setLocalDecks(decks);
        }
    }, [fetcher.data, decks]);

    // Search and expand states
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDecks, setExpandedDecks] = useState<Record<string, boolean>>(
        {},
    );

    // Import Deck Modal state
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

    // Create New Deck Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [newDeckInks, setNewDeckInks] = useState<string[]>([]);
    const [newDeckFormat, setNewDeckFormat] = useState<'core' | 'infinity'>(
        'core',
    );
    const [newDeckDesc, setNewDeckDesc] = useState('');

    // Edit Deck Details Modal state
    const [editDeckModalOpen, setEditDeckModalOpen] = useState(false);
    const [editingDeck, setEditingDeck] = useState<DeckWithProgress | null>(
        null,
    );
    const [editTitle, setEditTitle] = useState('');
    const [editInks, setEditInks] = useState<string[]>([]);
    const [editFormat, setEditFormat] = useState<'core' | 'infinity'>('core');
    const [editDesc, setEditDesc] = useState('');

    // Add Cards Modal state
    const [addCardsModalOpen, setAddCardsModalOpen] = useState(false);
    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [cardSearchQuery, setCardSearchQuery] = useState('');
    const [cardInkFilter, setCardInkFilter] = useState<string>('all');
    const [onlyCoreFilter, setOnlyCoreFilter] = useState<boolean>(true);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deckToDelete, setDeckToDelete] = useState<DeckWithProgress | null>(
        null,
    );

    // Undo action state for card removals
    const [undoState, setUndoState] = useState<{
        deckId: string;
        deckTitle: string;
        card: LorcanaCard;
        previousQuantity: number;
        timestamp: number;
    } | null>(null);

    // Copy to clipboard toast
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    // Calculate quick stats
    const totalDecksCount = localDecks.length;
    const readyToPlayCount = localDecks.filter(
        (d) =>
            d.progress.ownedCount >= d.progress.totalCount &&
            d.progress.totalCount > 0,
    ).length;
    const inProgressCount = totalDecksCount - readyToPlayCount;

    const toggleDeckExpand = (deckId: string) => {
        setExpandedDecks((prev) => ({
            ...prev,
            [deckId]: !prev[deckId],
        }));
    };

    // Toggle Ink Selection helper (Max 2 inks)
    const toggleInkSelection = (
        inkId: string,
        current: string[],
        setter: (inks: string[]) => void,
    ) => {
        if (current.includes(inkId)) {
            setter(current.filter((i) => i !== inkId));
        } else {
            if (current.length >= 2) {
                // Replace the second ink with the newly clicked one
                setter([current[0], inkId]);
            } else {
                setter([...current, inkId]);
            }
        }
    };

    // Card lookup maps
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

    // Handle Deck Import Parsing
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
                userId: user ? user.$id : 'guest-user',
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

    // Create Empty Deck with Format & Inks
    const handleCreateDeck = () => {
        if (!newDeckTitle.trim()) return;

        const metaDesc = serializeDeckMetadata(
            newDeckFormat,
            newDeckInks,
            newDeckDesc.trim(),
        );

        submit(
            {
                intent: 'create-deck',
                userId: user ? user.$id : 'guest-user',
                title: newDeckTitle.trim(),
                description: metaDesc,
                cards: JSON.stringify([]),
            },
            { method: 'post' },
        );

        setCreateModalOpen(false);
        setNewDeckTitle('');
        setNewDeckInks([]);
        setNewDeckFormat('core');
        setNewDeckDesc('');
    };

    // Edit Deck Details with Format & Inks
    const handleSaveDeckDetails = () => {
        if (!editingDeck || !editTitle.trim()) return;

        const metaDesc = serializeDeckMetadata(
            editFormat,
            editInks,
            editDesc.trim(),
        );

        submit(
            {
                intent: 'update-deck-details',
                deckId: editingDeck.$id,
                userId: user ? user.$id : 'guest-user',
                title: editTitle.trim(),
                description: metaDesc,
            },
            { method: 'post' },
        );

        setEditDeckModalOpen(false);
        setEditingDeck(null);
    };

    // Helper for Optimistic Deck Card Updates
    const applyDeckCardsOptimistic = useCallback(
        (
            deckId: string,
            updatedCardEntries: Array<{
                card: LorcanaCard;
                requiredQty: number;
                ownedQty?: number;
            }>,
        ) => {
            setLocalDecks((prevDecks) =>
                prevDecks.map((d) => {
                    if (d.$id !== deckId) return d;

                    const newDeckCards = updatedCardEntries.filter(
                        (c) => c.requiredQty > 0,
                    );

                    let ownedCount = 0;
                    let totalCount = 0;
                    const missingCards: Array<{
                        cardId: string;
                        required: number;
                        owned: number;
                        missing: number;
                    }> = [];

                    const mappedCards = newDeckCards.map((entry) => {
                        const existingInDeck = d.cards.find(
                            (c) => c.card.id === entry.card.id,
                        );
                        const ownedQty =
                            entry.ownedQty !== undefined
                                ? entry.ownedQty
                                : existingInDeck?.ownedQty || 0;
                        const requiredQty = Math.min(
                            Math.max(entry.requiredQty, 1),
                            4,
                        );

                        totalCount += requiredQty;
                        const matched = Math.min(requiredQty, ownedQty);
                        ownedCount += matched;

                        if (ownedQty < requiredQty) {
                            missingCards.push({
                                cardId: entry.card.id,
                                required: requiredQty,
                                owned: ownedQty,
                                missing: requiredQty - ownedQty,
                            });
                        }

                        return {
                            card: entry.card,
                            requiredQty,
                            ownedQty,
                        };
                    });

                    const percentage =
                        totalCount === 0
                            ? 0
                            : Math.round((ownedCount / totalCount) * 100);

                    return {
                        ...d,
                        cards: mappedCards,
                        progress: {
                            percentage,
                            ownedCount,
                            totalCount,
                            missingCards,
                        },
                    };
                }),
            );
        },
        [],
    );

    // Card Quantity Adjustments (1-4 Max in Lorcana) with Instant Optimistic UI
    const handleAdjustQuantity = (
        deck: DeckWithProgress,
        cardId: string,
        delta: number,
    ) => {
        if (!user) return;

        const existingIndex = deck.cards.findIndex((c) => c.card.id === cardId);
        if (existingIndex === -1 && delta <= 0) return;

        let nextDeckCards: Array<{
            card: LorcanaCard;
            requiredQty: number;
            ownedQty?: number;
        }>;

        if (existingIndex !== -1) {
            const currentQty = deck.cards[existingIndex].requiredQty;
            const newQty = currentQty + delta;
            if (newQty <= 0) {
                const removedCard = deck.cards[existingIndex].card;
                nextDeckCards = deck.cards.filter((c) => c.card.id !== cardId);

                setUndoState({
                    deckId: deck.$id,
                    deckTitle: deck.title,
                    card: removedCard,
                    previousQuantity: currentQty,
                    timestamp: Date.now(),
                });
            } else {
                const clamped = Math.min(newQty, 4);
                nextDeckCards = deck.cards.map((c) =>
                    c.card.id === cardId ? { ...c, requiredQty: clamped } : c,
                );
            }
        } else {
            const cardRef = cards.find((c) => c.id === cardId);
            if (!cardRef) return;
            nextDeckCards = [
                ...deck.cards,
                { card: cardRef, requiredQty: Math.min(delta, 4), ownedQty: 0 },
            ];
        }

        // 1. Optimistic instant local update
        applyDeckCardsOptimistic(deck.$id, nextDeckCards);

        // 2. Submit to server in background
        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: deck.$id,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    // Remove Card from Deck Directly with Instant Optimistic UI
    const handleRemoveCard = (
        deck: DeckWithProgress,
        card: LorcanaCard,
        qty: number,
    ) => {
        if (!user) return;

        const nextDeckCards = deck.cards.filter((c) => c.card.id !== card.id);

        setUndoState({
            deckId: deck.$id,
            deckTitle: deck.title,
            card,
            previousQuantity: qty,
            timestamp: Date.now(),
        });

        // 1. Optimistic instant local update
        applyDeckCardsOptimistic(deck.$id, nextDeckCards);

        // 2. Submit to server in background
        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: deck.$id,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    // Handle Undo of Card Removal with Instant Optimistic UI
    const handleUndo = () => {
        if (!undoState || !user) return;

        const targetDeck = localDecks.find((d) => d.$id === undoState.deckId);
        if (!targetDeck) {
            setUndoState(null);
            return;
        }

        const existingCard = targetDeck.cards.find(
            (c) => c.card.id === undoState.card.id,
        );
        let nextDeckCards: Array<{
            card: LorcanaCard;
            requiredQty: number;
            ownedQty?: number;
        }>;

        if (existingCard) {
            const clamped = Math.min(
                existingCard.requiredQty + undoState.previousQuantity,
                4,
            );
            nextDeckCards = targetDeck.cards.map((c) =>
                c.card.id === undoState.card.id
                    ? { ...c, requiredQty: clamped }
                    : c,
            );
        } else {
            nextDeckCards = [
                ...targetDeck.cards,
                {
                    card: undoState.card,
                    requiredQty: undoState.previousQuantity,
                    ownedQty: 0,
                },
            ];
        }

        // 1. Optimistic instant local update
        applyDeckCardsOptimistic(undoState.deckId, nextDeckCards);

        // 2. Submit to server in background
        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: undoState.deckId,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );

        setUndoState(null);
    };

    // Add Card from Add Cards Modal with Instant Optimistic UI
    const handleAddCardToDeck = (card: LorcanaCard) => {
        if (!activeDeckId || !user) return;

        const targetDeck = localDecks.find((d) => d.$id === activeDeckId);
        if (!targetDeck) return;

        const existingCard = targetDeck.cards.find(
            (c) => c.card.id === card.id,
        );
        const currentQty = existingCard ? existingCard.requiredQty : 0;
        if (currentQty >= 4) return;

        const nextQty = currentQty + 1;
        let nextDeckCards: Array<{
            card: LorcanaCard;
            requiredQty: number;
            ownedQty?: number;
        }>;

        if (existingCard) {
            nextDeckCards = targetDeck.cards.map((c) =>
                c.card.id === card.id ? { ...c, requiredQty: nextQty } : c,
            );
        } else {
            nextDeckCards = [
                ...targetDeck.cards,
                { card, requiredQty: 1, ownedQty: 0 },
            ];
        }

        // 1. Optimistic instant local update
        applyDeckCardsOptimistic(activeDeckId, nextDeckCards);

        // 2. Submit to server in background
        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: activeDeckId,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    // Delete Deck Confirmation
    const handleDeleteDeck = () => {
        if (!deckToDelete || !user) return;

        setLocalDecks((prev) => prev.filter((d) => d.$id !== deckToDelete.$id));

        fetcher.submit(
            {
                intent: 'delete-deck',
                deckId: deckToDelete.$id,
                userId: user.$id,
            },
            { method: 'post' },
        );

        setDeleteModalOpen(false);
        setDeckToDelete(null);
    };

    // Export Deck to standard text format
    const handleExportDeck = (deck: DeckWithProgress) => {
        const textLines = deck.cards.map(
            (c) => `${c.requiredQty} ${c.card.name}`,
        );
        const fullText = textLines.join('\n');
        navigator.clipboard.writeText(fullText).then(() => {
            setCopyFeedback(deck.$id);
            setTimeout(() => setCopyFeedback(null), 2500);
        });
    };

    // Quick Add to collection with Instant Optimistic UI
    const handleQuickAdd = (cardId: string, currentOwned: number) => {
        if (!user) {
            alert('Please sign in to update your inventory.');
            return;
        }

        // Optimistically increment owned count across all local decks referencing this card
        setLocalDecks((prevDecks) =>
            prevDecks.map((d) => {
                const hasCard = d.cards.some((c) => c.card.id === cardId);
                if (!hasCard) return d;

                let ownedCount = 0;
                let totalCount = 0;
                const missingCards: Array<{
                    cardId: string;
                    required: number;
                    owned: number;
                    missing: number;
                }> = [];

                const mappedCards = d.cards.map((c) => {
                    const ownedQty =
                        c.card.id === cardId ? currentOwned + 1 : c.ownedQty;
                    totalCount += c.requiredQty;
                    const matched = Math.min(c.requiredQty, ownedQty);
                    ownedCount += matched;

                    if (ownedQty < c.requiredQty) {
                        missingCards.push({
                            cardId: c.card.id,
                            required: c.requiredQty,
                            owned: ownedQty,
                            missing: c.requiredQty - ownedQty,
                        });
                    }

                    return {
                        ...c,
                        ownedQty,
                    };
                });

                const percentage =
                    totalCount === 0
                        ? 0
                        : Math.round((ownedCount / totalCount) * 100);

                return {
                    ...d,
                    cards: mappedCards,
                    progress: {
                        percentage,
                        ownedCount,
                        totalCount,
                        missingCards,
                    },
                };
            }),
        );

        fetcher.submit(
            {
                intent: 'quick-add',
                userId: user.$id,
                cardId,
                quantity: (currentOwned + 1).toString(),
                isFoil: 'false',
            },
            { method: 'post' },
        );
    };

    // Process decks and extract metadata from live localDecks
    const processedDecks = useMemo(() => {
        return localDecks
            .filter((deck) => {
                const meta = parseDeckMetadata(deck.description);
                const desc = meta.description.toLowerCase();
                const title = deck.title.toLowerCase();
                const q = searchQuery.toLowerCase();
                return title.includes(q) || desc.includes(q);
            })
            .map((deck) => {
                const meta = parseDeckMetadata(deck.description);

                // Calculate active inks: combine chosen deck inks and any inks in added cards
                const cardInks = Array.from(
                    new Set(
                        deck.cards.flatMap((dc) =>
                            dc.card.ink_color
                                ? dc.card.ink_color.split('/')
                                : [],
                        ),
                    ),
                ).map((i) => i.toLowerCase().trim());

                const combinedInks = Array.from(
                    new Set([...(meta.inks || []), ...cardInks]),
                ).filter(Boolean);

                const displayInks = combinedInks.length > 0 ? combinedInks : [];

                const isCoreLegal =
                    meta.format === 'core' &&
                    (deck.cards.length === 0 ||
                        deck.cards.every((dc) =>
                            dc.card.formats?.includes('core'),
                        ));

                const totalCards = deck.cards.reduce(
                    (sum, c) => sum + c.requiredQty,
                    0,
                );

                return {
                    ...deck,
                    meta,
                    displayInks,
                    isCoreLegal,
                    totalCardsCount: totalCards,
                };
            });
    }, [localDecks, searchQuery]);

    // Active deck for the Add Cards modal (derived dynamically from live processedDecks)
    const activeDeckForAddCards = useMemo(() => {
        if (!activeDeckId) return null;
        const target = processedDecks.find((d) => d.$id === activeDeckId);
        if (!target) return null;
        return {
            deck: target,
            meta: target.meta,
            displayInks: target.displayInks,
        };
    }, [activeDeckId, processedDecks]);

    // Filter available cards in "Add Cards" Modal (Searching by Name, Subtypes / Classifications, Types)
    const filteredCatalogCards = useMemo(() => {
        const rawQuery = cardSearchQuery.trim().toLowerCase();
        const searchTerms = rawQuery
            ? rawQuery.split(/\s+/).filter(Boolean)
            : [];

        return cards
            .filter((c) => {
                let matchesSearch = true;

                if (searchTerms.length > 0) {
                    const name = c.name.toLowerCase();
                    const classifications = (c.classifications || []).map(
                        (cl) => cl.toLowerCase(),
                    );
                    const types = (c.type || []).map((t) => t.toLowerCase());
                    const ink = (c.ink_color || '').toLowerCase();
                    const set = (c.set || '').toLowerCase();

                    matchesSearch = searchTerms.every((term) => {
                        // Direct string matching on name, ink, or set
                        if (
                            name.includes(term) ||
                            ink.includes(term) ||
                            set.includes(term)
                        ) {
                            return true;
                        }

                        // Direct matching on types and classifications (e.g. "princess", "floodborn")
                        if (
                            types.some(
                                (t) => t.includes(term) || term.includes(t),
                            ) ||
                            classifications.some(
                                (cl) => cl.includes(term) || term.includes(cl),
                            )
                        ) {
                            return true;
                        }

                        // Plural/singular normalization variations (e.g. "princesses" -> "princess", "toys" -> "toy", "heroes" -> "hero")
                        const variations = [term];
                        if (term.endsWith('ies')) {
                            variations.push(term.slice(0, -3) + 'y');
                        } else if (term.endsWith('es')) {
                            variations.push(term.slice(0, -2));
                            variations.push(term.slice(0, -1));
                        } else if (term.endsWith('s')) {
                            variations.push(term.slice(0, -1));
                        }

                        return variations.some(
                            (v) =>
                                name.includes(v) ||
                                types.some(
                                    (t) => t.includes(v) || v.includes(t),
                                ) ||
                                classifications.some(
                                    (cl) => cl.includes(v) || v.includes(cl),
                                ),
                        );
                    });
                }

                if (!matchesSearch) return false;

                // Format filter
                if (onlyCoreFilter && !c.formats?.includes('core')) {
                    return false;
                }

                // Ink filter
                if (cardInkFilter === 'all') {
                    return true;
                }

                const cardInks = c.ink_color
                    ? c.ink_color
                          .toLowerCase()
                          .split('/')
                          .map((ci) => ci.trim())
                          .filter(Boolean)
                    : [];

                if (cardInks.length === 0) {
                    return false;
                }

                if (cardInkFilter === 'deck-inks') {
                    if (
                        !activeDeckForAddCards ||
                        activeDeckForAddCards.displayInks.length === 0
                    ) {
                        return true;
                    }
                    // Strict deck construction rule: EVERY ink color on the card must be legal for the deck
                    return cardInks.every((ci) =>
                        activeDeckForAddCards.displayInks.includes(ci),
                    );
                }

                // If user selected a specific individual ink from dropdown
                if (
                    activeDeckForAddCards &&
                    activeDeckForAddCards.displayInks.length > 0 &&
                    activeDeckForAddCards.displayInks.includes(
                        cardInkFilter.toLowerCase(),
                    )
                ) {
                    return (
                        cardInks.includes(cardInkFilter.toLowerCase()) &&
                        cardInks.every((ci) =>
                            activeDeckForAddCards.displayInks.includes(ci),
                        )
                    );
                }

                return cardInks.includes(cardInkFilter.toLowerCase());
            })
            .slice(0, 60);
    }, [
        cards,
        cardSearchQuery,
        cardInkFilter,
        onlyCoreFilter,
        activeDeckForAddCards,
    ]);

    // Helper component for format selector
    const renderFormatSelector = (
        selectedFormat: 'core' | 'infinity',
        onSelect: (format: 'core' | 'infinity') => void,
    ) => (
        <Stack gap={6}>
            <Text size="xs" fw={700} c="gray.3">
                Format
            </Text>
            <SimpleGrid cols={2} spacing="xs">
                <UnstyledButton
                    onClick={() => onSelect('core')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border:
                            selectedFormat === 'core'
                                ? '1px solid rgba(168, 85, 247, 0.7)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor:
                            selectedFormat === 'core'
                                ? 'rgba(168, 85, 247, 0.12)'
                                : 'rgba(15, 23, 42, 0.4)',
                        boxShadow:
                            selectedFormat === 'core'
                                ? '0 0 14px rgba(168, 85, 247, 0.15)'
                                : 'none',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                    }}
                >
                    <Box
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                                selectedFormat === 'core'
                                    ? 'rgba(168, 85, 247, 0.25)'
                                    : 'rgba(255, 255, 255, 0.04)',
                        }}
                    >
                        <IconCards
                            size={18}
                            color={
                                selectedFormat === 'core'
                                    ? '#c084fc'
                                    : '#94a3b8'
                            }
                        />
                    </Box>
                    <Box>
                        <Text
                            size="xs"
                            fw={700}
                            c={selectedFormat === 'core' ? 'white' : 'gray.3'}
                        >
                            Core Constructed
                        </Text>
                        <Text
                            size="10px"
                            c={
                                selectedFormat === 'core'
                                    ? 'violet.3'
                                    : 'gray.5'
                            }
                        >
                            Standard Legal
                        </Text>
                    </Box>
                </UnstyledButton>

                <UnstyledButton
                    onClick={() => onSelect('infinity')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border:
                            selectedFormat === 'infinity'
                                ? '1px solid rgba(168, 85, 247, 0.7)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor:
                            selectedFormat === 'infinity'
                                ? 'rgba(168, 85, 247, 0.12)'
                                : 'rgba(15, 23, 42, 0.4)',
                        boxShadow:
                            selectedFormat === 'infinity'
                                ? '0 0 14px rgba(168, 85, 247, 0.15)'
                                : 'none',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                    }}
                >
                    <Box
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                                selectedFormat === 'infinity'
                                    ? 'rgba(168, 85, 247, 0.25)'
                                    : 'rgba(255, 255, 255, 0.04)',
                        }}
                    >
                        <IconInfinity
                            size={18}
                            color={
                                selectedFormat === 'infinity'
                                    ? '#c084fc'
                                    : '#94a3b8'
                            }
                        />
                    </Box>
                    <Box>
                        <Text
                            size="xs"
                            fw={700}
                            c={
                                selectedFormat === 'infinity'
                                    ? 'white'
                                    : 'gray.3'
                            }
                        >
                            Infinity Constructed
                        </Text>
                        <Text
                            size="10px"
                            c={
                                selectedFormat === 'infinity'
                                    ? 'violet.3'
                                    : 'gray.5'
                            }
                        >
                            All Sets Legal
                        </Text>
                    </Box>
                </UnstyledButton>
            </SimpleGrid>
        </Stack>
    );

    // Helper component for ink selector buttons
    const renderInkSelector = (
        selectedInks: string[],
        onToggle: (inkId: string) => void,
        onClear: () => void,
    ) => {
        const isMaxSelected = selectedInks.length >= 2;

        return (
            <Stack gap={6}>
                <Group justify="space-between" align="center">
                    <Text size="xs" fw={700} c="gray.3">
                        Deck Inks{' '}
                        <Text component="span" c="dimmed" fw={400}>
                            (Select up to 2)
                        </Text>
                    </Text>
                    <Group gap="xs" align="center">
                        {selectedInks.length > 0 && (
                            <Text
                                size="xs"
                                c="violet.4"
                                fw={600}
                                style={{
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                                onClick={onClear}
                            >
                                Reset
                            </Text>
                        )}
                        <Badge
                            size="xs"
                            variant="light"
                            color={
                                selectedInks.length === 2
                                    ? 'teal'
                                    : selectedInks.length === 1
                                      ? 'violet'
                                      : 'gray'
                            }
                        >
                            {selectedInks.length === 0
                                ? '0/2 Selected'
                                : `${selectedInks.length}/2 Selected`}
                        </Badge>
                    </Group>
                </Group>

                <Paper
                    p="xs"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.4)"
                    style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                    <Group justify="space-around" align="center" px="4px">
                        {ALL_INKS.map((ink) => {
                            const isSelected = selectedInks.includes(ink.id);
                            const isDimmed = isMaxSelected && !isSelected;

                            return (
                                <Tooltip
                                    key={ink.id}
                                    label={ink.name}
                                    withArrow
                                    position="top"
                                >
                                    <UnstyledButton
                                        onClick={() => onToggle(ink.id)}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isSelected
                                                ? `${ink.hex}30`
                                                : isDimmed
                                                  ? 'rgba(255, 255, 255, 0.02)'
                                                  : `${ink.hex}14`,
                                            border: isSelected
                                                ? `2px solid ${ink.hex}`
                                                : isDimmed
                                                  ? '1px solid rgba(255, 255, 255, 0.05)'
                                                  : `1px solid ${ink.hex}40`,
                                            boxShadow: isSelected
                                                ? `0 0 14px ${ink.hex}77`
                                                : isDimmed
                                                  ? 'none'
                                                  : `0 0 8px ${ink.hex}22`,
                                            transform: isSelected
                                                ? 'scale(1.1)'
                                                : isDimmed
                                                  ? 'scale(0.92)'
                                                  : 'scale(1)',
                                            opacity: isDimmed ? 0.25 : 1,
                                            transition:
                                                'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <img
                                            src={`/inks/${ink.id}.svg`}
                                            alt={ink.name}
                                            style={{
                                                width: 28,
                                                height: 28,
                                                display: 'block',
                                                filter: isDimmed
                                                    ? 'grayscale(70%)'
                                                    : isSelected
                                                      ? `drop-shadow(0 0 4px ${ink.hex})`
                                                      : 'none',
                                                transition: 'all 0.15s ease',
                                            }}
                                        />
                                    </UnstyledButton>
                                </Tooltip>
                            );
                        })}
                    </Group>
                </Paper>
            </Stack>
        );
    };

    return (
        <Box bg="#0d0e12" style={{ minHeight: '100vh', color: '#e2e8f0' }}>
            <Navbar user={user} />

            <Container size="xl" py="xl">
                {/* Undo Notification Banner */}
                {undoState && (
                    <Alert
                        icon={<IconArrowBackUp size={18} />}
                        title="Card removed from deck"
                        color="violet"
                        radius="md"
                        mb="lg"
                        withCloseButton
                        onClose={() => setUndoState(null)}
                    >
                        <Group
                            justify="space-between"
                            align="center"
                            wrap="wrap"
                        >
                            <Text size="sm">
                                Removed{' '}
                                <strong>
                                    {undoState.previousQuantity}x{' '}
                                    {undoState.card.name}
                                </strong>{' '}
                                from <em>{undoState.deckTitle}</em>.
                            </Text>
                            <Button
                                size="xs"
                                variant="filled"
                                color="violet"
                                leftSection={<IconArrowBackUp size={14} />}
                                onClick={handleUndo}
                            >
                                Undo Removal
                            </Button>
                        </Group>
                    </Alert>
                )}

                {/* Hero / Header Section */}
                <Paper
                    p={{ base: 'lg', md: 'xl' }}
                    radius="lg"
                    mb="xl"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.15)',
                    }}
                >
                    <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="wrap"
                        gap="lg"
                    >
                        <Box style={{ maxWidth: 640 }}>
                            <Group gap="xs" mb="xs">
                                <IconFolder size={28} color="#a855f7" />
                                <Title
                                    order={1}
                                    style={{
                                        fontFamily:
                                            "'Cinzel Decorative', serif",
                                        letterSpacing: '0.5px',
                                        fontSize: 28,
                                        background:
                                            'linear-gradient(to right, #c084fc, #f472b6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    My Decks
                                </Title>
                            </Group>
                            <Text size="sm" c="gray.4" lh={1.6}>
                                Build, customize, and manage your personal
                                Lorcana decks. Real-time inventory tracking
                                automatically computes missing cards, required
                                quantities (1–4 copies max), and total
                                collection completion.
                            </Text>
                        </Box>

                        {/* Top Action CTAs */}
                        <Group gap="sm">
                            <Button
                                variant="light"
                                color="violet"
                                radius="md"
                                leftSection={<IconPlus size={16} />}
                                onClick={() => {
                                    setNewDeckTitle('');
                                    setNewDeckInks([]);
                                    setNewDeckFormat('core');
                                    setNewDeckDesc('');
                                    setCreateModalOpen(true);
                                }}
                            >
                                New Deck
                            </Button>
                            <Button
                                variant="gradient"
                                gradient={{ from: 'violet.6', to: 'indigo.6' }}
                                radius="md"
                                leftSection={<IconUpload size={16} />}
                                onClick={() => {
                                    setImportTitle('');
                                    setImportText('');
                                    setImportFormat('core');
                                    setParsedResults(null);
                                    setImportError(null);
                                    setImportModalOpen(true);
                                }}
                            >
                                Import Decklist
                            </Button>
                            <Button
                                component={Link}
                                to="/decks"
                                variant="subtle"
                                color="gray"
                                radius="md"
                                rightSection={<IconArrowRight size={16} />}
                            >
                                Directory
                            </Button>
                        </Group>
                    </Group>

                    {/* Metric Quick Stats */}
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="xl">
                        <Card
                            padding="md"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text size="xs" c="gray.5" fw={600} tt="uppercase">
                                Total Personal Decks
                            </Text>
                            <Text size="xl" fw={800} c="gray.1" mt={4}>
                                {totalDecksCount}
                            </Text>
                        </Card>
                        <Card
                            padding="md"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text size="xs" c="teal.4" fw={600} tt="uppercase">
                                Ready to Play (100% Owned)
                            </Text>
                            <Text size="xl" fw={800} c="teal.3" mt={4}>
                                {readyToPlayCount}
                            </Text>
                        </Card>
                        <Card
                            padding="md"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text size="xs" c="amber.4" fw={600} tt="uppercase">
                                Decks In-Progress
                            </Text>
                            <Text size="xl" fw={800} c="amber.3" mt={4}>
                                {inProgressCount}
                            </Text>
                        </Card>
                    </SimpleGrid>
                </Paper>

                {/* Sticky Glassmorphic Filter & Sort Toolbar */}
                <Paper
                    p="sm"
                    radius="lg"
                    withBorder
                    mb="xl"
                    style={{
                        position: 'sticky',
                        top: 76,
                        zIndex: 30,
                        background:
                            'linear-gradient(135deg, rgba(24, 20, 52, 0.88) 0%, rgba(12, 16, 33, 0.92) 100%)',
                        backdropFilter: 'blur(16px)',
                        borderColor: 'rgba(168, 85, 247, 0.25)',
                        boxShadow:
                            '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 15px rgba(168, 85, 247, 0.08)',
                    }}
                >
                    <Group
                        justify="space-between"
                        wrap="wrap"
                        gap="md"
                        align="center"
                    >
                        {/* Search Input */}
                        <TextInput
                            placeholder="Search personal decks by name or notes..."
                            leftSection={
                                <IconSearch size={16} color="#c084fc" />
                            }
                            rightSection={
                                searchQuery ? (
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="gray"
                                        onClick={() => setSearchQuery('')}
                                        title="Clear search"
                                    >
                                        <IconX size={14} />
                                    </ActionIcon>
                                ) : null
                            }
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(e.currentTarget.value)
                            }
                            style={{ flex: 1, minWidth: 260 }}
                            styles={{
                                input: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderColor: 'rgba(168, 85, 247, 0.2)',
                                    color: '#f8fafc',
                                },
                            }}
                            radius="md"
                        />

                        {/* Right Controls: Sort & Active Counter */}
                        <Group gap="sm" align="center">
                            <Select
                                leftSection={
                                    <IconArrowsSort size={15} color="#c084fc" />
                                }
                                data={[
                                    {
                                        value: 'progress',
                                        label: 'Highest Match %',
                                    },
                                    {
                                        value: 'missing_cost',
                                        label: 'Fewest Missing Cards',
                                    },
                                    { value: 'name', label: 'Deck Name (A-Z)' },
                                ]}
                                value={sort}
                                onChange={(val) => {
                                    if (val) {
                                        navigate(`/my-decks?sort=${val}`);
                                    }
                                }}
                                styles={{
                                    input: {
                                        backgroundColor:
                                            'rgba(15, 23, 42, 0.6)',
                                        borderColor: 'rgba(168, 85, 247, 0.2)',
                                        color: '#f8fafc',
                                    },
                                }}
                                radius="md"
                                style={{ width: 220 }}
                            />

                            <Badge
                                size="md"
                                variant="light"
                                color="violet"
                                style={{
                                    height: 36,
                                    padding: '0 12px',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                }}
                            >
                                {processedDecks.length}{' '}
                                {processedDecks.length === 1 ? 'Deck' : 'Decks'}
                            </Badge>
                        </Group>
                    </Group>
                </Paper>

                {/* Decks Listing or Empty State */}
                {processedDecks.length === 0 ? (
                    <Card
                        padding="xl"
                        radius="lg"
                        withBorder
                        bg="rgba(15, 23, 42, 0.4)"
                        style={{
                            textAlign: 'center',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            padding: '60px 20px',
                        }}
                    >
                        <Stack align="center" gap="md">
                            <Box
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    background: 'rgba(168, 85, 247, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(168, 85, 247, 0.25)',
                                }}
                            >
                                <IconFolderPlus size={32} color="#a855f7" />
                            </Box>
                            <Title order={3} c="gray.2">
                                {searchQuery
                                    ? 'No decks match your search'
                                    : 'No personal decks yet'}
                            </Title>
                            <Text
                                size="sm"
                                c="gray.5"
                                style={{ maxWidth: 500 }}
                            >
                                {searchQuery
                                    ? 'Try adjusting your search query or clear the filter.'
                                    : 'Create your first custom deck, choose your ink colors and format, or import an existing list from Pixelborn/Dreamborn.'}
                            </Text>
                            <Group gap="sm" mt="sm">
                                <Button
                                    variant="gradient"
                                    gradient={{
                                        from: 'violet.6',
                                        to: 'indigo.6',
                                    }}
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => {
                                        setNewDeckTitle('');
                                        setNewDeckInks([]);
                                        setNewDeckFormat('core');
                                        setNewDeckDesc('');
                                        setCreateModalOpen(true);
                                    }}
                                >
                                    Create New Deck
                                </Button>
                                <Button
                                    variant="light"
                                    color="violet"
                                    leftSection={<IconUpload size={16} />}
                                    onClick={() => {
                                        setImportTitle('');
                                        setImportText('');
                                        setImportFormat('core');
                                        setParsedResults(null);
                                        setImportError(null);
                                        setImportModalOpen(true);
                                    }}
                                >
                                    Import Decklist
                                </Button>
                                <Button
                                    component={Link}
                                    to="/decks"
                                    variant="outline"
                                    color="gray"
                                    rightSection={<IconArrowRight size={16} />}
                                >
                                    Explore Meta Decks
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                ) : (
                    <Stack gap="lg">
                        {processedDecks.map((deck) => {
                            const {
                                percentage,
                                ownedCount,
                                totalCount,
                                missingCards,
                            } = deck.progress;
                            const isExpanded = expandedDecks[deck.$id];

                            let progressColor = 'red';
                            if (percentage >= 80) progressColor = 'teal';
                            else if (percentage >= 50) progressColor = 'yellow';

                            return (
                                <Card
                                    key={deck.$id}
                                    padding="lg"
                                    radius="lg"
                                    withBorder
                                    style={{
                                        background:
                                            'linear-gradient(135deg, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.75) 100%)',
                                        borderColor: 'rgba(168, 85, 247, 0.2)',
                                        boxShadow:
                                            '0 8px 24px rgba(0, 0, 0, 0.25)',
                                    }}
                                >
                                    <Stack gap="md">
                                        {/* Header row */}
                                        <Group
                                            justify="space-between"
                                            align="start"
                                        >
                                            <Box style={{ flex: 1 }}>
                                                <Group
                                                    gap="xs"
                                                    mb={4}
                                                    align="center"
                                                    wrap="wrap"
                                                >
                                                    <Text
                                                        fw={700}
                                                        size="md"
                                                        c="gray.1"
                                                    >
                                                        {deck.title}
                                                    </Text>

                                                    {/* Display Inks (all chosen deck inks + card inks) */}
                                                    <Group gap={6} mr="xs">
                                                        {deck.displayInks.map(
                                                            (inkName) => (
                                                                <img
                                                                    key={
                                                                        inkName
                                                                    }
                                                                    src={`/inks/${inkName.toLowerCase().trim()}.svg`}
                                                                    alt={
                                                                        inkName
                                                                    }
                                                                    style={{
                                                                        width: 24,
                                                                        height: 24,
                                                                        display:
                                                                            'block',
                                                                    }}
                                                                    title={
                                                                        inkName
                                                                            .charAt(
                                                                                0,
                                                                            )
                                                                            .toUpperCase() +
                                                                        inkName.slice(
                                                                            1,
                                                                        )
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Group>

                                                    <Badge
                                                        size="xs"
                                                        variant="outline"
                                                        color="violet"
                                                    >
                                                        {deck.totalCardsCount}
                                                        /60 Cards
                                                    </Badge>

                                                    {deck.isCoreLegal ? (
                                                        <Badge
                                                            size="xs"
                                                            variant="light"
                                                            color="teal"
                                                        >
                                                            Core Legal
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            size="xs"
                                                            variant="light"
                                                            color="orange"
                                                        >
                                                            Infinity Only
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Text size="xs" c="gray.4">
                                                    {deck.meta.description ||
                                                        'No description provided.'}
                                                </Text>
                                            </Box>

                                            {/* Progress stats */}
                                            <Stack
                                                gap={4}
                                                align="end"
                                                style={{ minWidth: 150 }}
                                            >
                                                <Badge
                                                    size="sm"
                                                    variant="light"
                                                    color={progressColor}
                                                >
                                                    {ownedCount}/{totalCount}{' '}
                                                    Owned ({percentage}%)
                                                </Badge>
                                                <Progress
                                                    value={percentage}
                                                    color={progressColor}
                                                    size="sm"
                                                    radius="xl"
                                                    striped
                                                    style={{ width: 120 }}
                                                />
                                            </Stack>
                                        </Group>

                                        {/* Action toolbar & Expand line */}
                                        <Group
                                            justify="space-between"
                                            wrap="wrap"
                                            gap="sm"
                                            style={{
                                                borderTop:
                                                    '1px solid rgba(255,255,255,0.06)',
                                                paddingTop: 12,
                                            }}
                                        >
                                            <Text size="xs" c="gray.5">
                                                {missingCards.length === 0 &&
                                                totalCount > 0 ? (
                                                    <Text
                                                        component="span"
                                                        c="teal.4"
                                                        fw={500}
                                                        style={{
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <IconCheck size={14} />{' '}
                                                        Ready to play! Complete
                                                        in your collection.
                                                    </Text>
                                                ) : (
                                                    <Text
                                                        component="span"
                                                        c="rose.4"
                                                        fw={500}
                                                        style={{
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <IconAlertTriangle
                                                            size={14}
                                                        />{' '}
                                                        Missing{' '}
                                                        {totalCount -
                                                            ownedCount}{' '}
                                                        cards
                                                    </Text>
                                                )}
                                            </Text>

                                            <Group gap="xs" wrap="wrap">
                                                <Button
                                                    variant="light"
                                                    color="violet"
                                                    size="xs"
                                                    leftSection={
                                                        <IconPlus size={14} />
                                                    }
                                                    onClick={() => {
                                                        setActiveDeckId(
                                                            deck.$id,
                                                        );
                                                        setCardSearchQuery('');
                                                        setCardInkFilter(
                                                            deck.displayInks
                                                                .length > 0
                                                                ? 'deck-inks'
                                                                : 'all',
                                                        );
                                                        setOnlyCoreFilter(
                                                            deck.meta.format ===
                                                                'core',
                                                        );
                                                        setAddCardsModalOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Add Cards
                                                </Button>
                                                <Button
                                                    variant="subtle"
                                                    color="gray"
                                                    size="xs"
                                                    leftSection={
                                                        <IconEdit size={14} />
                                                    }
                                                    onClick={() => {
                                                        setEditingDeck(deck);
                                                        setEditTitle(
                                                            deck.title,
                                                        );
                                                        setEditInks(
                                                            deck.meta.inks,
                                                        );
                                                        setEditFormat(
                                                            deck.meta.format,
                                                        );
                                                        setEditDesc(
                                                            deck.meta
                                                                .description,
                                                        );
                                                        setEditDeckModalOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Edit Info
                                                </Button>
                                                <Button
                                                    variant="subtle"
                                                    color="gray"
                                                    size="xs"
                                                    leftSection={
                                                        <IconCopy size={14} />
                                                    }
                                                    onClick={() =>
                                                        handleExportDeck(deck)
                                                    }
                                                >
                                                    {copyFeedback === deck.$id
                                                        ? 'Copied!'
                                                        : 'Export'}
                                                </Button>
                                                <Button
                                                    variant="subtle"
                                                    color="red"
                                                    size="xs"
                                                    leftSection={
                                                        <IconTrash size={14} />
                                                    }
                                                    onClick={() => {
                                                        setDeckToDelete(deck);
                                                        setDeleteModalOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                                <Button
                                                    variant="subtle"
                                                    color="violet"
                                                    size="xs"
                                                    onClick={() =>
                                                        toggleDeckExpand(
                                                            deck.$id,
                                                        )
                                                    }
                                                    rightSection={
                                                        isExpanded ? (
                                                            <IconChevronUp
                                                                size={14}
                                                            />
                                                        ) : (
                                                            <IconChevronDown
                                                                size={14}
                                                            />
                                                        )
                                                    }
                                                >
                                                    {isExpanded
                                                        ? 'Hide Cards'
                                                        : 'View Cards'}
                                                </Button>
                                            </Group>
                                        </Group>

                                        {/* Collapsible Card List Table */}
                                        <Collapse expanded={isExpanded}>
                                            <Box
                                                p="sm"
                                                style={{
                                                    background:
                                                        'rgba(10, 15, 29, 0.55)',
                                                    borderRadius: 10,
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    overflowX: 'auto',
                                                }}
                                            >
                                                {deck.cards.length === 0 ? (
                                                    <Box
                                                        p="md"
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            size="sm"
                                                            c="gray.5"
                                                        >
                                                            No cards in this
                                                            deck yet. Click{' '}
                                                            <strong>
                                                                Add Cards
                                                            </strong>{' '}
                                                            above to build it!
                                                        </Text>
                                                    </Box>
                                                ) : (
                                                    <Table
                                                        striped
                                                        highlightOnHover
                                                        style={{
                                                            minWidth: 680,
                                                        }}
                                                    >
                                                        <Table.Thead>
                                                            <Table.Tr>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    Card Name
                                                                </Table.Th>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    Ink Color
                                                                </Table.Th>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                        textAlign:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    Cost
                                                                </Table.Th>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                        textAlign:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    Rarity
                                                                </Table.Th>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                        textAlign:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    Deck Qty
                                                                    (1–4)
                                                                </Table.Th>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                        textAlign:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    Owned
                                                                </Table.Th>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                        textAlign:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    Status
                                                                </Table.Th>
                                                                <Table.Th
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 11,
                                                                        textAlign:
                                                                            'right',
                                                                    }}
                                                                >
                                                                    Actions
                                                                </Table.Th>
                                                            </Table.Tr>
                                                        </Table.Thead>
                                                        <Table.Tbody>
                                                            {deck.cards.map(
                                                                ({
                                                                    card,
                                                                    requiredQty,
                                                                    ownedQty,
                                                                }) => {
                                                                    const isMissing =
                                                                        ownedQty <
                                                                        requiredQty;
                                                                    const missingCount =
                                                                        requiredQty -
                                                                        ownedQty;

                                                                    return (
                                                                        <Table.Tr
                                                                            key={
                                                                                card.$id
                                                                            }
                                                                        >
                                                                            <Table.Td
                                                                                style={{
                                                                                    fontWeight: 500,
                                                                                }}
                                                                            >
                                                                                <Tooltip
                                                                                    label={
                                                                                        card.image_url ? (
                                                                                            <img
                                                                                                src={
                                                                                                    card.image_url
                                                                                                }
                                                                                                alt={
                                                                                                    card.name
                                                                                                }
                                                                                                style={{
                                                                                                    width: 220,
                                                                                                    borderRadius: 8,
                                                                                                }}
                                                                                            />
                                                                                        ) : (
                                                                                            'No preview'
                                                                                        )
                                                                                    }
                                                                                    color="transparent"
                                                                                    position="right"
                                                                                >
                                                                                    <Text
                                                                                        size="sm"
                                                                                        c="gray.2"
                                                                                        style={{
                                                                                            cursor: 'pointer',
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            card.name
                                                                                        }
                                                                                    </Text>
                                                                                </Tooltip>
                                                                            </Table.Td>
                                                                            <Table.Td>
                                                                                <Badge
                                                                                    size="xs"
                                                                                    variant="light"
                                                                                    color="violet"
                                                                                >
                                                                                    {
                                                                                        card.ink_color
                                                                                    }
                                                                                </Badge>
                                                                            </Table.Td>
                                                                            <Table.Td
                                                                                style={{
                                                                                    textAlign:
                                                                                        'center',
                                                                                }}
                                                                            >
                                                                                <Text
                                                                                    size="sm"
                                                                                    c="gray.3"
                                                                                >
                                                                                    {
                                                                                        card.cost
                                                                                    }
                                                                                </Text>
                                                                            </Table.Td>
                                                                            <Table.Td
                                                                                style={{
                                                                                    textAlign:
                                                                                        'center',
                                                                                }}
                                                                            >
                                                                                <Badge
                                                                                    size="xs"
                                                                                    variant="dot"
                                                                                    color="gray"
                                                                                >
                                                                                    {
                                                                                        card.rarity
                                                                                    }
                                                                                </Badge>
                                                                            </Table.Td>

                                                                            {/* Quantity Stepper (1-4 max) */}
                                                                            <Table.Td
                                                                                style={{
                                                                                    textAlign:
                                                                                        'center',
                                                                                }}
                                                                            >
                                                                                <Group
                                                                                    gap={
                                                                                        4
                                                                                    }
                                                                                    justify="center"
                                                                                    align="center"
                                                                                >
                                                                                    <ActionIcon
                                                                                        size="xs"
                                                                                        variant="subtle"
                                                                                        color="gray"
                                                                                        onClick={() =>
                                                                                            handleAdjustQuantity(
                                                                                                deck,
                                                                                                card.id,
                                                                                                -1,
                                                                                            )
                                                                                        }
                                                                                        title="Decrease copy or remove"
                                                                                    >
                                                                                        <IconMinus
                                                                                            size={
                                                                                                12
                                                                                            }
                                                                                        />
                                                                                    </ActionIcon>
                                                                                    <Text
                                                                                        size="xs"
                                                                                        fw={
                                                                                            700
                                                                                        }
                                                                                        w={
                                                                                            20
                                                                                        }
                                                                                        style={{
                                                                                            textAlign:
                                                                                                'center',
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            requiredQty
                                                                                        }
                                                                                    </Text>
                                                                                    <ActionIcon
                                                                                        size="xs"
                                                                                        variant="subtle"
                                                                                        color="violet"
                                                                                        disabled={
                                                                                            requiredQty >=
                                                                                            4
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleAdjustQuantity(
                                                                                                deck,
                                                                                                card.id,
                                                                                                1,
                                                                                            )
                                                                                        }
                                                                                        title={
                                                                                            requiredQty >=
                                                                                            4
                                                                                                ? 'Maximum 4 copies allowed'
                                                                                                : 'Add copy'
                                                                                        }
                                                                                    >
                                                                                        <IconPlus
                                                                                            size={
                                                                                                12
                                                                                            }
                                                                                        />
                                                                                    </ActionIcon>
                                                                                </Group>
                                                                            </Table.Td>

                                                                            <Table.Td
                                                                                style={{
                                                                                    textAlign:
                                                                                        'center',
                                                                                }}
                                                                            >
                                                                                <Text
                                                                                    size="sm"
                                                                                    fw={
                                                                                        600
                                                                                    }
                                                                                    c={
                                                                                        isMissing
                                                                                            ? 'rose.4'
                                                                                            : 'teal.4'
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        ownedQty
                                                                                    }
                                                                                </Text>
                                                                            </Table.Td>

                                                                            <Table.Td
                                                                                style={{
                                                                                    textAlign:
                                                                                        'center',
                                                                                }}
                                                                            >
                                                                                {isMissing ? (
                                                                                    <Badge
                                                                                        size="xs"
                                                                                        color="red"
                                                                                        variant="light"
                                                                                    >
                                                                                        Missing{' '}
                                                                                        {
                                                                                            missingCount
                                                                                        }
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge
                                                                                        size="xs"
                                                                                        color="teal"
                                                                                        variant="light"
                                                                                    >
                                                                                        ✓
                                                                                        Owned
                                                                                    </Badge>
                                                                                )}
                                                                            </Table.Td>

                                                                            {/* Quick Add & Remove Action Buttons */}
                                                                            <Table.Td
                                                                                style={{
                                                                                    textAlign:
                                                                                        'right',
                                                                                }}
                                                                            >
                                                                                <Group
                                                                                    gap={
                                                                                        6
                                                                                    }
                                                                                    justify="flex-end"
                                                                                >
                                                                                    {isMissing && (
                                                                                        <Button
                                                                                            size="compact-xs"
                                                                                            variant="light"
                                                                                            color="violet"
                                                                                            leftSection={
                                                                                                <IconPlus
                                                                                                    size={
                                                                                                        10
                                                                                                    }
                                                                                                />
                                                                                            }
                                                                                            onClick={() =>
                                                                                                handleQuickAdd(
                                                                                                    card.id,
                                                                                                    ownedQty,
                                                                                                )
                                                                                            }
                                                                                            title="Add 1 to my collection"
                                                                                        >
                                                                                            +1
                                                                                            Coll
                                                                                        </Button>
                                                                                    )}
                                                                                    <ActionIcon
                                                                                        size="xs"
                                                                                        variant="subtle"
                                                                                        color="red"
                                                                                        onClick={() =>
                                                                                            handleRemoveCard(
                                                                                                deck,
                                                                                                card,
                                                                                                requiredQty,
                                                                                            )
                                                                                        }
                                                                                        title="Remove card from deck"
                                                                                    >
                                                                                        <IconTrash
                                                                                            size={
                                                                                                12
                                                                                            }
                                                                                        />
                                                                                    </ActionIcon>
                                                                                </Group>
                                                                            </Table.Td>
                                                                        </Table.Tr>
                                                                    );
                                                                },
                                                            )}
                                                        </Table.Tbody>
                                                    </Table>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Stack>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </Container>

            {/* Modal: Create New Deck */}
            <Modal
                opened={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title={<Text fw={700}>Create New Personal Deck</Text>}
                size="md"
                centered
                radius="md"
            >
                <Stack gap="md">
                    <TextInput
                        data-autofocus
                        label="Deck Title"
                        placeholder="e.g. Amber / Ruby Toys"
                        value={newDeckTitle}
                        onChange={(e) => setNewDeckTitle(e.currentTarget.value)}
                        required
                    />

                    {/* Format Selector */}
                    {renderFormatSelector(newDeckFormat, setNewDeckFormat)}

                    {/* Inks Selector */}
                    {renderInkSelector(
                        newDeckInks,
                        (inkId) =>
                            toggleInkSelection(
                                inkId,
                                newDeckInks,
                                setNewDeckInks,
                            ),
                        () => setNewDeckInks([]),
                    )}

                    <Textarea
                        label="Description / Notes"
                        placeholder="Optional strategy notes or tournament list details..."
                        value={newDeckDesc}
                        onChange={(e) => setNewDeckDesc(e.currentTarget.value)}
                        rows={3}
                    />

                    <Group justify="flex-end" gap="xs" mt="sm">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setCreateModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet.6', to: 'indigo.6' }}
                            onClick={handleCreateDeck}
                            disabled={!newDeckTitle.trim()}
                        >
                            Create Deck
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Modal: Import Decklist */}
            <Modal
                opened={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                title={<Text fw={700}>Import Decklist from Text</Text>}
                size="lg"
                centered
                radius="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Deck Title"
                        placeholder="e.g. Amber/Steel Steelsongs"
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.currentTarget.value)}
                        required
                    />

                    {/* Format Selector */}
                    {renderFormatSelector(importFormat, setImportFormat)}

                    <Textarea
                        label="Decklist Text"
                        description="Paste standard format (e.g. '4 Robin Hood - Champion of Sherwood (002-190)')"
                        placeholder={
                            '4 Cinderella - Stouthearted\n4 Robin Hood - Champion of Sherwood\n4 A Whole New World'
                        }
                        value={importText}
                        onChange={(e) => setImportText(e.currentTarget.value)}
                        rows={7}
                        required
                    />

                    {importError && (
                        <Alert
                            color="red"
                            title="Error"
                            icon={<IconAlertTriangle size={16} />}
                        >
                            {importError}
                        </Alert>
                    )}

                    {parsedResults && (
                        <Card padding="sm" radius="md" bg="dark.7" withBorder>
                            <Group
                                justify="space-between"
                                align="center"
                                mb={4}
                            >
                                <Text size="xs" fw={700} c="teal.4">
                                    Matched {parsedResults.matched.length}{' '}
                                    unique cards (
                                    {parsedResults.matched.reduce(
                                        (s, m) => s + m.quantity,
                                        0,
                                    )}{' '}
                                    total)
                                </Text>
                                <Group gap={4}>
                                    {parsedResults.detectedInks.map(
                                        (inkName) => (
                                            <img
                                                key={inkName}
                                                src={`/inks/${inkName}.svg`}
                                                alt={inkName}
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                }}
                                                title={inkName}
                                            />
                                        ),
                                    )}
                                </Group>
                            </Group>
                            {parsedResults.unmatched.length > 0 && (
                                <Text size="xs" c="rose.4">
                                    Unmatched {parsedResults.unmatched.length}{' '}
                                    card(s):{' '}
                                    {parsedResults.unmatched
                                        .map((u) => u.name)
                                        .join(', ')}
                                </Text>
                            )}
                        </Card>
                    )}

                    <Group justify="space-between" mt="sm">
                        <Button
                            variant="light"
                            color="violet"
                            onClick={handleValidateImport}
                        >
                            Validate List
                        </Button>
                        <Group gap="xs">
                            <Button
                                variant="subtle"
                                color="gray"
                                onClick={() => setImportModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="gradient"
                                gradient={{ from: 'violet.6', to: 'indigo.6' }}
                                onClick={handleSubmitImport}
                                disabled={
                                    !parsedResults ||
                                    parsedResults.matched.length === 0
                                }
                            >
                                Import Deck
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Modal>

            {/* Modal: Edit Deck Details */}
            <Modal
                opened={editDeckModalOpen}
                onClose={() => setEditDeckModalOpen(false)}
                title={<Text fw={700}>Edit Deck Information</Text>}
                size="md"
                centered
                radius="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Deck Title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.currentTarget.value)}
                        required
                    />

                    {/* Format Selector */}
                    {renderFormatSelector(editFormat, setEditFormat)}

                    {/* Inks Selector */}
                    {renderInkSelector(
                        editInks,
                        (inkId) =>
                            toggleInkSelection(inkId, editInks, setEditInks),
                        () => setEditInks([]),
                    )}

                    <Textarea
                        label="Description / Notes"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.currentTarget.value)}
                        rows={3}
                    />
                    <Group justify="flex-end" gap="xs" mt="sm">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setEditDeckModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet.6', to: 'indigo.6' }}
                            onClick={handleSaveDeckDetails}
                            disabled={!editTitle.trim()}
                        >
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Modal: Add Cards to Deck (with Smart Auto-Filtering & Large Grid Artwork) */}
            <Modal
                opened={addCardsModalOpen}
                onClose={() => {
                    setAddCardsModalOpen(false);
                    setActiveDeckId(null);
                }}
                title={
                    <Group gap="xs">
                        <IconCards size={22} color="#a855f7" />
                        <Box>
                            <Text fw={700} size="md">
                                Add Cards to {activeDeckForAddCards?.deck.title}
                            </Text>
                            <Text size="11px" c="dimmed">
                                Browse Lorcana catalog and add up to 4 copies
                                per card
                            </Text>
                        </Box>
                    </Group>
                }
                size="1100px"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    {/* Search & Filter Toolbar */}
                    <Group gap="xs" grow wrap="wrap">
                        <TextInput
                            data-autofocus
                            placeholder="Search by name, subtype (e.g. Princess, Toy, Floodborn), or card type..."
                            leftSection={<IconSearch size={16} />}
                            value={cardSearchQuery}
                            onChange={(e) =>
                                setCardSearchQuery(e.currentTarget.value)
                            }
                            style={{ minWidth: 240 }}
                            radius="md"
                        />
                        <Select
                            data={[
                                ...(activeDeckForAddCards &&
                                activeDeckForAddCards.displayInks.length > 0
                                    ? [
                                          {
                                              value: 'deck-inks',
                                              label: `🎨 Deck Colors (${activeDeckForAddCards.displayInks
                                                  .map(
                                                      (i) =>
                                                          i
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          i.slice(1),
                                                  )
                                                  .join(' / ')})`,
                                          },
                                      ]
                                    : []),
                                { value: 'all', label: 'All Inks' },
                                { value: 'amber', label: 'Amber' },
                                { value: 'amethyst', label: 'Amethyst' },
                                { value: 'emerald', label: 'Emerald' },
                                { value: 'ruby', label: 'Ruby' },
                                { value: 'sapphire', label: 'Sapphire' },
                                { value: 'steel', label: 'Steel' },
                            ]}
                            value={cardInkFilter}
                            onChange={(val) => setCardInkFilter(val || 'all')}
                            style={{ minWidth: 180 }}
                            radius="md"
                        />
                    </Group>

                    {/* Format Filter Checkbox & Status */}
                    <Group justify="space-between" align="center">
                        <Checkbox
                            label="Only show Core Legal cards"
                            checked={onlyCoreFilter}
                            onChange={(e) =>
                                setOnlyCoreFilter(e.currentTarget.checked)
                            }
                            color="violet"
                            size="xs"
                        />
                        <Text size="xs" c="dimmed">
                            Showing {filteredCatalogCards.length} cards
                        </Text>
                    </Group>

                    <ScrollArea h={560} offsetScrollbars>
                        {filteredCatalogCards.length === 0 ? (
                            <Box
                                style={{
                                    textAlign: 'center',
                                    padding: '60px 0',
                                }}
                            >
                                <Text size="md" c="gray.4" fw={600}>
                                    No cards found matching your query and
                                    filters.
                                </Text>
                                <Text size="xs" c="gray.6" mt={4}>
                                    Try clearing the search query or setting the
                                    ink filter to "All Inks".
                                </Text>
                            </Box>
                        ) : (
                            <SimpleGrid
                                cols={{ base: 1, xs: 2, sm: 3, md: 4 }}
                                spacing="md"
                            >
                                {filteredCatalogCards.map((card) => {
                                    const currentDeckCopy =
                                        activeDeckForAddCards?.deck.cards.find(
                                            (c) => c.card.id === card.id,
                                        )?.requiredQty || 0;

                                    return (
                                        <Card
                                            key={card.$id || card.id}
                                            padding="sm"
                                            radius="md"
                                            withBorder
                                            bg="dark.8"
                                            style={{
                                                borderColor:
                                                    currentDeckCopy > 0
                                                        ? 'rgba(168, 85, 247, 0.45)'
                                                        : 'rgba(255, 255, 255, 0.08)',
                                                backgroundColor:
                                                    currentDeckCopy > 0
                                                        ? 'rgba(30, 27, 75, 0.28)'
                                                        : 'rgba(15, 23, 42, 0.6)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                boxShadow:
                                                    currentDeckCopy > 0
                                                        ? '0 0 12px rgba(168, 85, 247, 0.15)'
                                                        : 'none',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <Box>
                                                {/* Card Artwork Image */}
                                                <Box
                                                    style={{
                                                        position: 'relative',
                                                        borderRadius: 8,
                                                        overflow: 'hidden',
                                                        aspectRatio: '5 / 7',
                                                        backgroundColor:
                                                            'rgba(0, 0, 0, 0.4)',
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    {card.image_url ? (
                                                        <img
                                                            src={card.image_url}
                                                            alt={card.name}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit:
                                                                    'cover',
                                                                display:
                                                                    'block',
                                                            }}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <Box
                                                            style={{
                                                                height: '100%',
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                            }}
                                                        >
                                                            <Text
                                                                size="xs"
                                                                c="gray.6"
                                                            >
                                                                No Image
                                                            </Text>
                                                        </Box>
                                                    )}

                                                    {/* In-deck badge overlay */}
                                                    {currentDeckCopy > 0 && (
                                                        <Badge
                                                            size="sm"
                                                            variant="filled"
                                                            color="violet"
                                                            style={{
                                                                position:
                                                                    'absolute',
                                                                top: 6,
                                                                right: 6,
                                                                boxShadow:
                                                                    '0 2px 8px rgba(0,0,0,0.6)',
                                                            }}
                                                        >
                                                            {currentDeckCopy}/4
                                                            in Deck
                                                        </Badge>
                                                    )}
                                                </Box>

                                                {/* Card Info Below Image */}
                                                <Text
                                                    size="sm"
                                                    fw={700}
                                                    c="gray.1"
                                                    lineClamp={1}
                                                    title={card.name}
                                                >
                                                    {card.name}
                                                </Text>
                                                <Text
                                                    size="11px"
                                                    c="gray.5"
                                                    mt={2}
                                                    lineClamp={1}
                                                >
                                                    {card.set} • #{card.number}
                                                </Text>
                                            </Box>

                                            {/* Action Control Button */}
                                            <Box
                                                mt="md"
                                                style={{
                                                    borderTop:
                                                        '1px solid rgba(255, 255, 255, 0.06)',
                                                    paddingTop: 10,
                                                }}
                                            >
                                                {currentDeckCopy > 0 ? (
                                                    <Group
                                                        justify="space-between"
                                                        align="center"
                                                    >
                                                        <Group
                                                            gap={4}
                                                            align="center"
                                                        >
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="subtle"
                                                                color="gray"
                                                                onClick={() => {
                                                                    if (
                                                                        activeDeckForAddCards
                                                                    ) {
                                                                        handleAdjustQuantity(
                                                                            activeDeckForAddCards.deck,
                                                                            card.id,
                                                                            -1,
                                                                        );
                                                                    }
                                                                }}
                                                                title="Remove copy"
                                                            >
                                                                <IconMinus
                                                                    size={14}
                                                                />
                                                            </ActionIcon>
                                                            <Text
                                                                size="xs"
                                                                fw={700}
                                                                w={20}
                                                                style={{
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                {
                                                                    currentDeckCopy
                                                                }
                                                            </Text>
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="subtle"
                                                                color="violet"
                                                                disabled={
                                                                    currentDeckCopy >=
                                                                    4
                                                                }
                                                                onClick={() =>
                                                                    handleAddCardToDeck(
                                                                        card,
                                                                    )
                                                                }
                                                                title={
                                                                    currentDeckCopy >=
                                                                    4
                                                                        ? 'Maximum 4 copies allowed'
                                                                        : 'Add copy'
                                                                }
                                                            >
                                                                <IconPlus
                                                                    size={14}
                                                                />
                                                            </ActionIcon>
                                                        </Group>

                                                        <Button
                                                            size="compact-xs"
                                                            variant={
                                                                currentDeckCopy >=
                                                                4
                                                                    ? 'outline'
                                                                    : 'light'
                                                            }
                                                            color="violet"
                                                            disabled={
                                                                currentDeckCopy >=
                                                                4
                                                            }
                                                            onClick={() =>
                                                                handleAddCardToDeck(
                                                                    card,
                                                                )
                                                            }
                                                        >
                                                            {currentDeckCopy >=
                                                            4
                                                                ? 'Max (4/4)'
                                                                : '+1 More'}
                                                        </Button>
                                                    </Group>
                                                ) : (
                                                    <Button
                                                        fullWidth
                                                        size="xs"
                                                        variant="light"
                                                        color="violet"
                                                        leftSection={
                                                            <IconPlus
                                                                size={14}
                                                            />
                                                        }
                                                        onClick={() =>
                                                            handleAddCardToDeck(
                                                                card,
                                                            )
                                                        }
                                                    >
                                                        Add to Deck
                                                    </Button>
                                                )}
                                            </Box>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        )}
                    </ScrollArea>

                    <Group justify="flex-end">
                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet.6', to: 'indigo.6' }}
                            onClick={() => {
                                setAddCardsModalOpen(false);
                                setActiveDeckId(null);
                            }}
                        >
                            Done
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Modal: Delete Deck Confirmation */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={
                    <Text fw={700} c="red.4">
                        Delete Deck
                    </Text>
                }
                centered
                radius="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="gray.3">
                        Are you sure you want to delete{' '}
                        <strong>{deckToDelete?.title}</strong>? This action
                        cannot be undone.
                    </Text>
                    <Group justify="flex-end" gap="xs">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleDeleteDeck}>
                            Delete Deck
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}
