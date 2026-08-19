import type { Route } from './+types/decks';
import {
    useLoaderData,
    useSubmit,
    useFetcher,
    useNavigate,
    data,
} from 'react-router';
import { useState, useMemo } from 'react';
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
    Table,
    TextInput,
    Select,
    Box,
    ActionIcon,
    Tabs,
    Modal,
    Textarea,
    Tooltip,
    SimpleGrid,
    ScrollArea,
} from '@mantine/core';
import {
    IconSearch,
    IconPlus,
    IconCheck,
    IconAlertTriangle,
    IconBrandYoutube,
    IconCards,
    IconInfinity,
    IconUpload,
    IconFolderPlus,
    IconCopy,
} from '@tabler/icons-react';
import { authService, dbService } from '../services/appwrite.server';
import {
    COLLECTIONS,
    type Card as LorcanaCard,
    SET_NAME_TO_INDEX,
} from '../types/lorcana';
import { Navbar } from '../components/Navbar';

// ---------------------------------------------------------
// Loader (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const sort = (url.searchParams.get('sort') || 'progress') as
        'progress' | 'missing_cost' | 'name';

    // Get active session user
    const user = await authService.getSessionUser(request);
    const userId = user ? user.$id : null;

    // Retrieve public decks and cards concurrently
    const [decks, cards] = await Promise.all([
        dbService.getDecksWithProgress(userId, sort, request),
        dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], request),
    ]);

    return { decks, cards, user, sort };
}

// ---------------------------------------------------------
// Action (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function action({ request }: Route.ActionArgs) {
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

    if (intent === 'import-deck') {
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
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

    if (intent === 'clone-deck') {
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const description =
            (formData.get('description') as string) ||
            'Cloned from Deck Directory';
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
        return { success: true, cloned: true, result };
    }

    return { success: false };
}

// Helper to map Lorcana ink colors to Mantine badge colors
// Helper to map Lorcana ink colors to custom hex styling
function getInkBadgeStyle(color: string) {
    const normalized = color.toLowerCase();
    let hex = '#94a3b8'; // default slate

    switch (normalized) {
        case 'amber':
            hex = '#F5B041'; // Vibrant Gold-Amber
            break;
        case 'amethyst':
            hex = '#AF7AC5'; // Vibrant Amethyst Violet
            break;
        case 'emerald':
            hex = '#2ECC71'; // Jade Emerald Green
            break;
        case 'ruby':
            hex = '#EC7063'; // Ruby Crimson
            break;
        case 'sapphire':
            hex = '#5DADE2'; // Sapphire Blue
            break;
        case 'steel':
            hex = '#A6ACAF'; // Steel Metallic Grey
            break;
    }

    return {
        backgroundColor: `${hex}1F`, // ~12% opacity background
        borderColor: `${hex}66`, // ~40% opacity border
        color: hex,
        textTransform: 'uppercase' as const,
        fontWeight: 700,
        letterSpacing: '0.5px',
    };
}

import {
    RARITY_RANK,
    RARITY_COLOR,
    INK_HEX_MAP,
    getFeaturedDeckCard,
    getKeyDeckCards,
} from '../utils/deck';
export {
    RARITY_RANK,
    RARITY_COLOR,
    INK_HEX_MAP,
    getFeaturedDeckCard,
    getKeyDeckCards,
};

export default function Decks() {
    const { decks, cards, user, sort } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewDeckModalOpen, setViewDeckModalOpen] = useState(false);
    const [viewDeckId, setViewDeckId] = useState<string | null>(null);
    const [deckModalSearch, setDeckModalSearch] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    // Import Deck states
    const submit = useSubmit();
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importTitle, setImportTitle] = useState('');
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [parsedResults, setParsedResults] = useState<{
        matched: Array<{ card: LorcanaCard; quantity: number }>;
        unmatched: Array<{ name: string; quantity: number; setCode?: string }>;
    } | null>(null);

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
                userId: user ? user.$id : 'guest-user',
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

    const handleQuickAdd = (cardId: string, currentOwned: number) => {
        if (!user) {
            alert(
                'Please sign in with a demo session to update your inventory.',
            );
            return;
        }
        fetcher.submit(
            {
                intent: 'quick-add',
                userId: user.$id,
                cardId,
                quantity: (currentOwned + 1).toString(),
                isFoil: 'false', // Default to normal copies for quick add
            },
            { method: 'post' },
        );
    };

    // Filter decks locally based on deck title, creator, or descriptions
    const filteredDecks = decks.filter(
        (deck) =>
            deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deck.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Compute Core legality for each deck dynamically
    const processedDecks = filteredDecks.map((deck) => {
        const isCoreLegal = deck.cards.every((dc) =>
            dc.card.formats?.includes('core'),
        );
        return {
            ...deck,
            isCoreLegal,
        };
    });

    const coreDecks = processedDecks.filter((deck) => deck.isCoreLegal);
    const infinityDecks = processedDecks;

    const cloneFetcher = useFetcher();

    const handleCloneDeck = (deckToClone: (typeof processedDecks)[0]) => {
        if (!user) {
            alert(
                'Please sign in or use demo login to save decks to your personal library.',
            );
            return;
        }

        const payload = deckToClone.cards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        cloneFetcher.submit(
            {
                intent: 'clone-deck',
                userId: user.$id,
                title: `${deckToClone.title} (Copy)`,
                description: `Cloned from ${deckToClone.title}. ${deckToClone.description || ''}`,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    const handleExportDeck = (deckToExport: (typeof processedDecks)[0]) => {
        const textLines = deckToExport.cards.map((c) => {
            const setIdx = SET_NAME_TO_INDEX[c.card.set];
            const setCode =
                setIdx !== undefined
                    ? `${setIdx.toString().padStart(3, '0')}-${c.card.number.toString().padStart(3, '0')}`
                    : '';
            return `${c.requiredQty} ${c.card.name}${setCode ? ` (${setCode})` : ''}`;
        });
        const fullText = textLines.join('\n');
        navigator.clipboard.writeText(fullText);
        setCopyFeedback(deckToExport.$id);
        setTimeout(() => setCopyFeedback(null), 2500);
    };

    const activeDeckForView = useMemo(() => {
        if (!viewDeckId) return null;
        return processedDecks.find((d) => d.$id === viewDeckId) || null;
    }, [viewDeckId, processedDecks]);

    const filteredDeckCardsForView = useMemo(() => {
        if (!activeDeckForView) return [];
        const q = deckModalSearch.trim().toLowerCase();
        return activeDeckForView.cards.filter((dc) => {
            if (q) {
                const nameMatch = dc.card.name.toLowerCase().includes(q);
                const classMatch = (dc.card.classifications || []).some((cl) =>
                    cl.toLowerCase().includes(q),
                );
                const typeMatch = (dc.card.type || []).some((t) =>
                    t.toLowerCase().includes(q),
                );
                if (!nameMatch && !classMatch && !typeMatch) return false;
            }
            return true;
        });
    }, [activeDeckForView, deckModalSearch]);

    const renderDeckList = (decksToRender: typeof processedDecks) => {
        if (decksToRender.length === 0) {
            return (
                <Card
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="dark.8"
                    style={{ textAlign: 'center', borderStyle: 'dashed' }}
                >
                    <Text c="gray.5" size="sm">
                        No decks found matching your filters in this format.
                    </Text>
                </Card>
            );
        }

        return (
            <SimpleGrid
                cols={{
                    base: 1,
                    xs: 1,
                    sm: 2,
                    md: 3,
                    lg: 4,
                    xl: 4,
                }}
                spacing="lg"
            >
                {decksToRender.map((deck) => {
                    const { percentage, ownedCount, totalCount, missingCards } =
                        deck.progress;
                    const featuredCard = getFeaturedDeckCard(deck.cards);
                    const keyCards = getKeyDeckCards(deck.cards, 4);

                    const deckInks = Array.from(
                        new Set(
                            deck.cards.flatMap((dc) =>
                                dc.card.ink_color
                                    ? dc.card.ink_color.split('/')
                                    : [],
                            ),
                        ),
                    );

                    let progressColor = 'red';
                    if (percentage >= 80) progressColor = 'teal';
                    else if (percentage >= 50) progressColor = 'yellow';

                    return (
                        <Card
                            key={deck.$id}
                            className="deck-card"
                            padding="md"
                            radius="lg"
                            withBorder
                            style={{
                                backgroundColor: 'var(--mantine-color-dark-8)',
                                backgroundImage:
                                    'linear-gradient(180deg, rgba(30, 27, 75, 0.35) 0%, rgba(15, 23, 42, 0.75) 100%)',
                                borderColor: 'rgba(168, 85, 247, 0.25)',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                overflow: 'hidden',
                            }}
                        >
                            <Card.Section
                                className="deck-cover-section"
                                style={{
                                    position: 'relative',
                                    height: 175,
                                    backgroundColor: 'transparent',
                                    overflow: 'hidden',
                                }}
                            >
                                {featuredCard?.image_url ? (
                                    <img
                                        src={featuredCard.image_url}
                                        alt={featuredCard.name}
                                        className="deck-cover-img"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'center top',
                                            filter: 'brightness(0.9)',
                                            display: 'block',
                                        }}
                                    />
                                ) : (
                                    <Box
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background:
                                                'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
                                        }}
                                    >
                                        <IconCards
                                            size={40}
                                            style={{
                                                opacity: 0.25,
                                                color: '#a855f7',
                                            }}
                                        />
                                    </Box>
                                )}

                                <Box
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        pointerEvents: 'none',
                                        background:
                                            'linear-gradient(180deg, rgba(10, 15, 29, 0.25) 0%, rgba(10, 15, 29, 0) 35%, rgba(15, 23, 42, 0.8) 85%, rgba(15, 23, 42, 0.98) 100%)',
                                    }}
                                />

                                {/* Top Floating Badges (Top Right) */}
                                <Group
                                    justify="flex-end"
                                    align="center"
                                    p="xs"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                    }}
                                >
                                    <Group gap={6}>
                                        {deck.is_trending ? (
                                            <Badge
                                                size="xs"
                                                variant="gradient"
                                                gradient={{
                                                    from: 'violet',
                                                    to: 'grape',
                                                }}
                                            >
                                                Trending
                                            </Badge>
                                        ) : deck.creator_id === 'system' ? (
                                            <Badge
                                                size="xs"
                                                variant="gradient"
                                                gradient={{
                                                    from: 'cyan',
                                                    to: 'blue',
                                                }}
                                            >
                                                Meta
                                            </Badge>
                                        ) : null}

                                        <Group
                                            gap={5}
                                            bg="rgba(10, 15, 29, 0.8)"
                                            px={8}
                                            py={4}
                                            style={{
                                                borderRadius: 20,
                                                backdropFilter: 'blur(6px)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                            }}
                                        >
                                            {deckInks.map((inkName) => (
                                                <img
                                                    key={inkName}
                                                    src={`/inks/${inkName.toLowerCase().trim()}.svg`}
                                                    alt={inkName}
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        display: 'block',
                                                    }}
                                                    title={
                                                        inkName
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                        inkName.slice(1)
                                                    }
                                                />
                                            ))}
                                        </Group>
                                    </Group>
                                </Group>

                                {/* Bottom Featured Card Tag & Legality Badge */}
                                <Box
                                    style={{
                                        position: 'absolute',
                                        bottom: 8,
                                        left: 12,
                                        right: 12,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    {featuredCard ? (
                                        <Text
                                            size="11px"
                                            fw={700}
                                            c="gray.2"
                                            style={{
                                                textShadow:
                                                    '0 1px 4px rgba(0,0,0,0.9)',
                                            }}
                                            lineClamp={1}
                                        >
                                            {featuredCard.name}
                                        </Text>
                                    ) : (
                                        <Box />
                                    )}
                                    <Badge
                                        size="xs"
                                        variant="filled"
                                        color={
                                            deck.isCoreLegal
                                                ? 'teal.8'
                                                : 'orange.8'
                                        }
                                    >
                                        {deck.isCoreLegal ? 'Core' : 'Infinity'}
                                    </Badge>
                                </Box>
                            </Card.Section>

                            {/* Card Main Info */}
                            <Stack gap="xs" mt="sm" style={{ flex: 1 }}>
                                <Box>
                                    <Text
                                        fw={800}
                                        size="md"
                                        c="gray.1"
                                        lineClamp={1}
                                    >
                                        {deck.title}
                                    </Text>
                                    {deck.description &&
                                    deck.description.trim() ? (
                                        <Text
                                            size="xs"
                                            c="gray.4"
                                            lineClamp={2}
                                            mt={2}
                                        >
                                            {deck.description}
                                        </Text>
                                    ) : null}
                                </Box>

                                {keyCards.length > 0 && (
                                    <Box>
                                        <Text
                                            size="10px"
                                            fw={700}
                                            c="gray.5"
                                            style={{
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                            }}
                                            mb={4}
                                        >
                                            Key Cards
                                        </Text>
                                        <Group gap={6}>
                                            {keyCards.map((kc) => {
                                                const primaryInk = (
                                                    kc.ink_color
                                                        ? kc.ink_color.split(
                                                              '/',
                                                          )[0]
                                                        : ''
                                                )
                                                    .toLowerCase()
                                                    .trim();
                                                const inkBorderColor =
                                                    INK_HEX_MAP[primaryInk] ||
                                                    '#94a3b8';
                                                return (
                                                    <Tooltip
                                                        key={kc.id}
                                                        label={`${kc.name} • ${kc.rarity} (${kc.cost}⬡)`}
                                                        withArrow
                                                        position="top"
                                                    >
                                                        <Box
                                                            className="deck-key-card"
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius:
                                                                    '50%',
                                                                overflow:
                                                                    'hidden',
                                                                border: `2px solid ${inkBorderColor}`,
                                                                boxShadow: `0 0 6px ${inkBorderColor}40`,
                                                                background:
                                                                    '#0a0f1d',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {kc.image_url ? (
                                                                <img
                                                                    src={
                                                                        kc.image_url
                                                                    }
                                                                    alt={
                                                                        kc.name
                                                                    }
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit:
                                                                            'cover',
                                                                        objectPosition:
                                                                            'center 20%',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <IconCards
                                                                    size={16}
                                                                    style={{
                                                                        margin: 6,
                                                                        opacity: 0.5,
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Group>
                                    </Box>
                                )}

                                <Box mt="xs">
                                    <Group
                                        justify="space-between"
                                        align="center"
                                        mb={4}
                                    >
                                        <Text size="xs" fw={700} c="gray.4">
                                            Collection Progress
                                        </Text>
                                        <Badge
                                            size="xs"
                                            variant="light"
                                            color={progressColor}
                                        >
                                            {ownedCount}/{totalCount} (
                                            {percentage}%)
                                        </Badge>
                                    </Group>
                                    <Progress
                                        value={percentage}
                                        color={progressColor}
                                        size="sm"
                                        radius="xl"
                                        striped
                                    />
                                    {missingCards.length > 0 &&
                                        ownedCount < totalCount && (
                                            <Box mt={6}>
                                                <Text
                                                    size="xs"
                                                    c="rose.4"
                                                    fw={500}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                >
                                                    <IconAlertTriangle
                                                        size={14}
                                                    />{' '}
                                                    Missing{' '}
                                                    {totalCount - ownedCount}{' '}
                                                    cards
                                                </Text>
                                            </Box>
                                        )}
                                </Box>
                            </Stack>

                            <Box
                                mt="md"
                                style={{
                                    borderTop:
                                        '1px solid rgba(255,255,255,0.06)',
                                    paddingTop: 12,
                                }}
                            >
                                <Group
                                    justify="space-between"
                                    align="center"
                                    gap="xs"
                                >
                                    <Button
                                        variant="light"
                                        color="violet"
                                        size="xs"
                                        style={{ flex: 1 }}
                                        leftSection={<IconCards size={14} />}
                                        onClick={() => {
                                            setViewDeckId(deck.$id);
                                            setDeckModalSearch('');
                                            setViewDeckModalOpen(true);
                                        }}
                                    >
                                        View Decklist
                                    </Button>

                                    <Group gap={4}>
                                        <Tooltip
                                            label="Save to My Decks"
                                            withArrow
                                        >
                                            <ActionIcon
                                                variant="subtle"
                                                color="violet"
                                                size="sm"
                                                loading={
                                                    cloneFetcher.state ===
                                                    'submitting'
                                                }
                                                onClick={() =>
                                                    handleCloneDeck(deck)
                                                }
                                            >
                                                <IconFolderPlus size={16} />
                                            </ActionIcon>
                                        </Tooltip>

                                        {deck.youtube && (
                                            <Tooltip
                                                label="Watch YouTube Guide"
                                                withArrow
                                            >
                                                <ActionIcon
                                                    component="a"
                                                    href={`https://www.youtube.com/watch?v=${deck.youtube}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="subtle"
                                                    color="red"
                                                    size="sm"
                                                >
                                                    <IconBrandYoutube
                                                        size={16}
                                                    />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}

                                        <Tooltip
                                            label={
                                                copyFeedback === deck.$id
                                                    ? 'Copied!'
                                                    : 'Export Decklist'
                                            }
                                            withArrow
                                        >
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                size="sm"
                                                onClick={() =>
                                                    handleExportDeck(deck)
                                                }
                                            >
                                                {copyFeedback === deck.$id ? (
                                                    <IconCheck
                                                        size={16}
                                                        color="#2ecc71"
                                                    />
                                                ) : (
                                                    <IconCopy size={16} />
                                                )}
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            </Box>
                        </Card>
                    );
                })}
            </SimpleGrid>
        );
    };

    return (
        <Box mih="100vh" bg="dark.9" c="gray.1">
            <Navbar user={user} />

            <Container size="lg" py="xl">
                {/* Banner Hero */}
                <Card
                    padding="xl"
                    radius="lg"
                    withBorder
                    mb="xl"
                    bg="dark.8"
                    style={(theme) => ({
                        borderColor: theme.colors.dark[7],
                        position: 'relative',
                        overflow: 'hidden',
                    })}
                >
                    {/* Accent blurs */}
                    <Box
                        style={{
                            position: 'absolute',
                            top: '-50px',
                            right: '-50px',
                            width: '200px',
                            height: '200px',
                            backgroundColor: 'rgba(124, 58, 237, 0.05)',
                            filter: 'blur(50px)',
                            borderRadius: '100%',
                        }}
                    />
                    <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
                        <Title order={1} size="xl" fw={900}>
                            Disney Lorcana Metagame Deck Matcher
                        </Title>
                        <Text
                            size="sm"
                            c="gray.4"
                            maw={800}
                            style={{ lineHeight: 1.6 }}
                        >
                            Upload or manage your card collection inventory. Our
                            recommendation engine automatically scans meta
                            decks, displays the percentage of cards you own, and
                            calculates the exact missing card counts to optimize
                            your next buy list.
                        </Text>
                    </Stack>
                </Card>

                {/* Filter Controls Row */}
                <Group justify="space-between" mb="lg" gap="md">
                    <Group
                        gap="md"
                        style={{ flex: 1, maxWidth: 600 }}
                        align="end"
                    >
                        <TextInput
                            placeholder="Search meta decks..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        {user && (
                            <Button
                                variant="light"
                                color="violet"
                                leftSection={<IconUpload size={16} />}
                                onClick={() => setImportModalOpen(true)}
                            >
                                Import Deck
                            </Button>
                        )}
                    </Group>

                    <Select
                        label="Sort by:"
                        value={sort}
                        onChange={(val) => {
                            if (val) {
                                navigate(`/decks?sort=${val}`);
                            }
                        }}
                        data={[
                            { value: 'progress', label: 'Highest Match %' },
                            {
                                value: 'missing_cost',
                                label: 'Lowest Missing Count',
                            },
                            { value: 'name', label: 'Alphabetical (A-Z)' },
                        ]}
                        style={{ width: 220 }}
                    />
                </Group>

                {/* Tabs for Core/Infinity Formats */}
                <Tabs
                    defaultValue="core"
                    color="violet"
                    variant="outline"
                    mt="md"
                    mb="xl"
                >
                    <Tabs.List
                        style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                        }}
                        mb="md"
                    >
                        <Tabs.Tab
                            value="core"
                            leftSection={<IconCards size={16} />}
                            style={{ fontWeight: 600 }}
                        >
                            Core Constructed ({coreDecks.length})
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="infinity"
                            leftSection={<IconInfinity size={16} />}
                            style={{ fontWeight: 600 }}
                        >
                            Infinity Constructed ({infinityDecks.length})
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="core">
                        {renderDeckList(coreDecks)}
                    </Tabs.Panel>

                    <Tabs.Panel value="infinity">
                        {renderDeckList(infinityDecks)}
                    </Tabs.Panel>
                </Tabs>
            </Container>

            {/* Import Deck Modal */}
            <Modal
                opened={importModalOpen}
                onClose={() => {
                    setImportModalOpen(false);
                    setImportTitle('');
                    setImportText('');
                    setParsedResults(null);
                    setImportError(null);
                }}
                title={
                    <Text fw={700} size="lg">
                        Import Lorcana Deck List
                    </Text>
                }
                size="lg"
                centered
                styles={{
                    content: {
                        backgroundColor: 'var(--mantine-color-dark-8)',
                        color: 'var(--mantine-color-gray-1)',
                    },
                    header: {
                        backgroundColor: 'var(--mantine-color-dark-8)',
                        color: 'var(--mantine-color-gray-1)',
                    },
                }}
            >
                <Stack gap="md">
                    <Text size="xs" c="gray.4">
                        Paste a decklist from Dreamborn.ink or Inkdecks.com. The
                        parser supports quantities and card names (e.g.{' '}
                        <code>4 Elsa - Spirit of Winter</code> or{' '}
                        <code>4 Elsa - Spirit of Winter (001-042)</code>).
                    </Text>

                    <TextInput
                        label="Deck Title"
                        placeholder="e.g. Amber/Emerald Toys"
                        required
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.target.value)}
                        styles={{
                            input: {
                                backgroundColor: 'var(--mantine-color-dark-9)',
                            },
                        }}
                    />

                    <Textarea
                        label="Decklist Text"
                        placeholder="Paste decklist here, e.g.&#10;4 Elsa - Spirit of Winter&#10;4 Koda - Talkative Cub (005-001)"
                        minRows={8}
                        required
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        styles={{
                            input: {
                                backgroundColor: 'var(--mantine-color-dark-9)',
                                fontFamily: 'monospace',
                                fontSize: 12,
                            },
                        }}
                    />

                    {importError && (
                        <Text size="xs" c="red.4" fw={500}>
                            {importError}
                        </Text>
                    )}

                    {parsedResults && (
                        <Stack
                            gap="xs"
                            style={{
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                paddingTop: 12,
                            }}
                        >
                            <Text size="sm" fw={600}>
                                Parser Validation Summary:
                            </Text>
                            <Group gap="md">
                                <Badge color="teal" variant="light">
                                    {parsedResults.matched.reduce(
                                        (acc, curr) => acc + curr.quantity,
                                        0,
                                    )}{' '}
                                    Cards Matched (
                                    {parsedResults.matched.length} Unique)
                                </Badge>
                                {parsedResults.unmatched.length > 0 && (
                                    <Badge color="red" variant="light">
                                        {parsedResults.unmatched.reduce(
                                            (acc, curr) => acc + curr.quantity,
                                            0,
                                        )}{' '}
                                        Unknown Cards
                                    </Badge>
                                )}
                            </Group>

                            {parsedResults.unmatched.length > 0 && (
                                <Box>
                                    <Text size="xs" c="red.4" fw={500} mb={4}>
                                        Warning: The following cards could not
                                        be found in the database (they will be
                                        skipped):
                                    </Text>
                                    <Box
                                        style={{
                                            maxHeight: 100,
                                            overflowY: 'auto',
                                            backgroundColor:
                                                'rgba(255,0,0,0.05)',
                                            padding: 8,
                                            borderRadius: 4,
                                        }}
                                    >
                                        {parsedResults.unmatched.map(
                                            (item, idx) => (
                                                <Text
                                                    key={idx}
                                                    size="xs"
                                                    c="gray.4"
                                                    style={{
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    - {item.quantity}x{' '}
                                                    {item.name}{' '}
                                                    {item.setCode
                                                        ? `(${item.setCode})`
                                                        : ''}
                                                </Text>
                                            ),
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Stack>
                    )}

                    <Group justify="end" mt="md">
                        <Button
                            variant="outline"
                            color="gray"
                            onClick={() => {
                                setImportModalOpen(false);
                                setImportTitle('');
                                setImportText('');
                                setParsedResults(null);
                                setImportError(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="light"
                            color="blue"
                            onClick={handleValidateImport}
                        >
                            Validate List
                        </Button>
                        <Button
                            variant="filled"
                            color="violet"
                            disabled={
                                !parsedResults ||
                                parsedResults.matched.length === 0
                            }
                            onClick={handleSubmitImport}
                        >
                            Import Deck
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Modal: View Meta Deck Details & Cards */}
            <Modal
                opened={viewDeckModalOpen}
                onClose={() => {
                    setViewDeckModalOpen(false);
                    setViewDeckId(null);
                }}
                title={
                    activeDeckForView ? (
                        <Group gap="xs">
                            <IconCards size={22} color="#a855f7" />
                            <Box>
                                <Group gap="xs" align="center">
                                    <Text fw={800} size="md">
                                        {activeDeckForView.title}
                                    </Text>
                                    <Badge
                                        size="xs"
                                        variant="filled"
                                        color={
                                            activeDeckForView.isCoreLegal
                                                ? 'teal.8'
                                                : 'orange.8'
                                        }
                                    >
                                        {activeDeckForView.isCoreLegal
                                            ? 'Core Legal'
                                            : 'Infinity'}
                                    </Badge>
                                    <Badge
                                        size="xs"
                                        variant="outline"
                                        color="violet"
                                    >
                                        {activeDeckForView.cards.reduce(
                                            (acc, c) => acc + c.requiredQty,
                                            0,
                                        )}
                                        /60 Cards
                                    </Badge>
                                </Group>
                            </Box>
                        </Group>
                    ) : (
                        'Deck Details'
                    )
                }
                size="1100px"
                centered
                radius="lg"
            >
                {activeDeckForView && (
                    <Stack gap="md">
                        {/* Progress Bar & Summary */}
                        <Card padding="sm" radius="md" bg="dark.8" withBorder>
                            <Group justify="space-between" align="center">
                                <Box style={{ flex: 1 }}>
                                    <Group
                                        justify="space-between"
                                        align="center"
                                        mb={4}
                                    >
                                        <Text size="xs" fw={700} c="gray.3">
                                            Collection Completion:
                                        </Text>
                                        <Badge
                                            size="sm"
                                            variant="light"
                                            color={
                                                activeDeckForView.progress
                                                    .percentage >= 80
                                                    ? 'teal'
                                                    : activeDeckForView.progress
                                                            .percentage >= 50
                                                      ? 'yellow'
                                                      : 'red'
                                            }
                                        >
                                            {
                                                activeDeckForView.progress
                                                    .ownedCount
                                            }
                                            /
                                            {
                                                activeDeckForView.progress
                                                    .totalCount
                                            }{' '}
                                            Owned (
                                            {
                                                activeDeckForView.progress
                                                    .percentage
                                            }
                                            %)
                                        </Badge>
                                    </Group>
                                    <Progress
                                        value={
                                            activeDeckForView.progress
                                                .percentage
                                        }
                                        color={
                                            activeDeckForView.progress
                                                .percentage >= 80
                                                ? 'teal'
                                                : activeDeckForView.progress
                                                        .percentage >= 50
                                                  ? 'yellow'
                                                  : 'red'
                                        }
                                        size="sm"
                                        radius="xl"
                                        striped
                                    />
                                </Box>
                            </Group>
                            {activeDeckForView.description && (
                                <Text size="xs" c="dimmed" mt="xs">
                                    {activeDeckForView.description}
                                </Text>
                            )}
                        </Card>

                        {/* Search & Actions Toolbar */}
                        <Group justify="space-between" wrap="wrap" gap="xs">
                            <TextInput
                                placeholder="Search cards in this deck..."
                                leftSection={<IconSearch size={16} />}
                                value={deckModalSearch}
                                onChange={(e) =>
                                    setDeckModalSearch(e.currentTarget.value)
                                }
                                size="xs"
                                style={{ minWidth: 220, flex: 1 }}
                            />

                            <Group gap="xs">
                                <Button
                                    variant="light"
                                    color="violet"
                                    size="xs"
                                    leftSection={<IconFolderPlus size={14} />}
                                    loading={
                                        cloneFetcher.state === 'submitting'
                                    }
                                    onClick={() =>
                                        handleCloneDeck(activeDeckForView)
                                    }
                                >
                                    Save to My Decks
                                </Button>

                                {activeDeckForView.youtube && (
                                    <Button
                                        component="a"
                                        href={`https://www.youtube.com/watch?v=${activeDeckForView.youtube}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="xs"
                                        variant="light"
                                        color="red"
                                        leftSection={
                                            <IconBrandYoutube size={14} />
                                        }
                                    >
                                        Watch Guide
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    color="gray"
                                    size="xs"
                                    leftSection={
                                        copyFeedback ===
                                        activeDeckForView.$id ? (
                                            <IconCheck
                                                size={14}
                                                color="#2ecc71"
                                            />
                                        ) : (
                                            <IconCopy size={14} />
                                        )
                                    }
                                    onClick={() =>
                                        handleExportDeck(activeDeckForView)
                                    }
                                >
                                    {copyFeedback === activeDeckForView.$id
                                        ? 'Copied List!'
                                        : 'Export'}
                                </Button>
                            </Group>
                        </Group>

                        {/* Cards Table */}
                        <Box
                            p="xs"
                            style={{
                                background: 'rgba(10, 15, 29, 0.55)',
                                borderRadius: 10,
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                        >
                            {filteredDeckCardsForView.length === 0 ? (
                                <Box p="lg" style={{ textAlign: 'center' }}>
                                    <Text size="sm" c="gray.5">
                                        No cards match your filter.
                                    </Text>
                                </Box>
                            ) : (
                                <ScrollArea.Autosize mah={480}>
                                    <Table
                                        striped
                                        highlightOnHover
                                        style={{ minWidth: 700 }}
                                    >
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th
                                                    style={{
                                                        color: '#94a3b8',
                                                        fontSize: 11,
                                                    }}
                                                >
                                                    Card
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
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Cost
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        color: '#94a3b8',
                                                        fontSize: 11,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Rarity
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        color: '#94a3b8',
                                                        fontSize: 11,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Required
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        color: '#94a3b8',
                                                        fontSize: 11,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Owned
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        color: '#94a3b8',
                                                        fontSize: 11,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Status
                                                </Table.Th>
                                                {user && (
                                                    <Table.Th
                                                        style={{
                                                            color: '#94a3b8',
                                                            fontSize: 11,
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        Collection
                                                    </Table.Th>
                                                )}
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {filteredDeckCardsForView.map(
                                                (dc) => {
                                                    const isMissing =
                                                        dc.ownedQty <
                                                        dc.requiredQty;
                                                    const missingCount =
                                                        dc.requiredQty -
                                                        dc.ownedQty;

                                                    return (
                                                        <Table.Tr
                                                            key={dc.card.id}
                                                        >
                                                            <Table.Td>
                                                                <Group gap="sm">
                                                                    {dc.card
                                                                        .image_url ? (
                                                                        <img
                                                                            src={
                                                                                dc
                                                                                    .card
                                                                                    .image_url
                                                                            }
                                                                            alt={
                                                                                dc
                                                                                    .card
                                                                                    .name
                                                                            }
                                                                            style={{
                                                                                width: 32,
                                                                                height: 44,
                                                                                objectFit:
                                                                                    'cover',
                                                                                borderRadius: 4,
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Box
                                                                            style={{
                                                                                width: 32,
                                                                                height: 44,
                                                                                borderRadius: 4,
                                                                                background:
                                                                                    'rgba(255,255,255,0.05)',
                                                                                display:
                                                                                    'flex',
                                                                                alignItems:
                                                                                    'center',
                                                                                justifyContent:
                                                                                    'center',
                                                                            }}
                                                                        >
                                                                            <IconCards
                                                                                size={
                                                                                    16
                                                                                }
                                                                                opacity={
                                                                                    0.4
                                                                                }
                                                                            />
                                                                        </Box>
                                                                    )}
                                                                    <Box>
                                                                        <Text
                                                                            size="xs"
                                                                            fw={
                                                                                600
                                                                            }
                                                                            c="gray.2"
                                                                        >
                                                                            {
                                                                                dc
                                                                                    .card
                                                                                    .name
                                                                            }
                                                                        </Text>
                                                                        {dc.card
                                                                            .type && (
                                                                            <Text
                                                                                size="10px"
                                                                                c="dimmed"
                                                                            >
                                                                                {dc.card.type.join(
                                                                                    ' • ',
                                                                                )}
                                                                            </Text>
                                                                        )}
                                                                    </Box>
                                                                </Group>
                                                            </Table.Td>

                                                            <Table.Td>
                                                                <Badge
                                                                    size="xs"
                                                                    variant="outline"
                                                                    style={getInkBadgeStyle(
                                                                        dc.card
                                                                            .ink_color,
                                                                    )}
                                                                >
                                                                    {
                                                                        dc.card
                                                                            .ink_color
                                                                    }
                                                                </Badge>
                                                            </Table.Td>

                                                            <Table.Td
                                                                style={{
                                                                    textAlign:
                                                                        'center',
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {dc.card.cost}⬡
                                                            </Table.Td>

                                                            <Table.Td
                                                                style={{
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                <Badge
                                                                    size="xs"
                                                                    variant="light"
                                                                    color={
                                                                        RARITY_COLOR[
                                                                            dc
                                                                                .card
                                                                                .rarity
                                                                        ] ||
                                                                        'gray'
                                                                    }
                                                                >
                                                                    {
                                                                        dc.card
                                                                            .rarity
                                                                    }
                                                                </Badge>
                                                            </Table.Td>

                                                            <Table.Td
                                                                style={{
                                                                    textAlign:
                                                                        'center',
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {dc.requiredQty}
                                                            </Table.Td>

                                                            <Table.Td
                                                                style={{
                                                                    textAlign:
                                                                        'center',
                                                                    fontWeight: 700,
                                                                    color: isMissing
                                                                        ? '#f87171'
                                                                        : '#34d399',
                                                                }}
                                                            >
                                                                {dc.ownedQty}
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
                                                                        Need{' '}
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
                                                                        Matched
                                                                    </Badge>
                                                                )}
                                                            </Table.Td>

                                                            {user && (
                                                                <Table.Td
                                                                    style={{
                                                                        textAlign:
                                                                            'right',
                                                                    }}
                                                                >
                                                                    <Button
                                                                        size="compact-xs"
                                                                        variant="subtle"
                                                                        color="violet"
                                                                        leftSection={
                                                                            <IconPlus
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />
                                                                        }
                                                                        onClick={() =>
                                                                            handleQuickAdd(
                                                                                dc
                                                                                    .card
                                                                                    .id,
                                                                                dc.ownedQty,
                                                                            )
                                                                        }
                                                                        title="Add 1 copy to your collection"
                                                                    >
                                                                        +1 Coll
                                                                    </Button>
                                                                </Table.Td>
                                                            )}
                                                        </Table.Tr>
                                                    );
                                                },
                                            )}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea.Autosize>
                            )}
                        </Box>

                        {/* Modal Footer */}
                        <Group justify="space-between" align="center" mt="xs">
                            <Text size="xs" c="dimmed">
                                Total Cards:{' '}
                                <strong>
                                    {activeDeckForView.cards.reduce(
                                        (acc, c) => acc + c.requiredQty,
                                        0,
                                    )}
                                    /60
                                </strong>{' '}
                                • {activeDeckForView.cards.length} Unique Cards
                            </Text>
                            <Button
                                variant="gradient"
                                gradient={{ from: 'violet.6', to: 'indigo.6' }}
                                onClick={() => {
                                    setViewDeckModalOpen(false);
                                    setViewDeckId(null);
                                }}
                            >
                                Done
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Box>
    );
}
