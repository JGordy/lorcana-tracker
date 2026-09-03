import { useState, useMemo } from 'react';
import {
    Modal,
    Stack,
    Group,
    Box,
    Text,
    Badge,
    TextInput,
    Switch,
    ScrollArea,
    Paper,
    ThemeIcon,
    ActionIcon,
    SimpleGrid,
    Grid,
    Tooltip,
} from '@mantine/core';
import {
    IconArrowsExchange,
    IconSearch,
    IconX,
    IconInfoCircle,
    IconExternalLink,
} from '@tabler/icons-react';
import type { Card, DeckWithProgress } from '../../types/lorcana';
import {
    findCardSubstitutions,
    extractCardKeywords,
} from '../../utils/substitutions';
import { SubstituteCardTile } from './SubstituteCardTile';
import { LorcanaCardTile } from '../LorcanaCardTile';
import { getInkBadgeStyle } from '../../routes/decks/utils/deckHelpers';
import { formatCurrency } from '../../utils/valuation';
import { getTcgPlayerCardSearchUrl } from '../../utils/shoppingList';

export interface CardSubstitutionModalProps {
    opened: boolean;
    onClose: () => void;
    targetCard: Card | null;
    deck: DeckWithProgress | null;
    catalog: Card[];
    userCollection?: Array<{ card_id: string; quantity: number }>;
    user?: { $id: string } | null;
    canSwapInDeck?: boolean;
    onSwapCardInDeck?: (oldCard: Card, newCard: Card, swapQty: number) => void;
    onQuickAdd?: (cardId: string, currentOwned: number) => void;
}

export function CardSubstitutionModal({
    opened,
    onClose,
    targetCard,
    deck,
    catalog,
    userCollection = [],
    user,
    canSwapInDeck = false,
    onSwapCardInDeck,
    onQuickAdd,
}: CardSubstitutionModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [onlyOwned, setOnlyOwned] = useState(false);
    const [exactCostOnly, setExactCostOnly] = useState(false);
    const [allowOtherDeckInks, setAllowOtherDeckInks] = useState(false);

    const targetKeywords = useMemo(() => {
        if (!targetCard) return [];
        return extractCardKeywords(targetCard);
    }, [targetCard]);

    const targetDeckCard = useMemo(() => {
        if (!deck || !targetCard) return null;
        return (
            deck.cards.find(
                (c) =>
                    c.card.id === targetCard.id ||
                    (c.card as any).$id === targetCard.id,
            ) || null
        );
    }, [deck, targetCard]);
    // Combine server-provided userCollection with client-side local storage inventory
    const effectiveUserCollection = useMemo(() => {
        const map = new Map<string, { card_id: string; quantity: number }>();
        for (const item of userCollection || []) {
            const id =
                (item as any).card_id ||
                (item as any).cardId ||
                (item as any).$id ||
                (item as any).id;
            if (id && item.quantity > 0) {
                map.set(id, { card_id: id, quantity: item.quantity });
            }
        }

        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('lorcana_user_inventory');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        for (const item of parsed) {
                            const id =
                                (item as any).card_id ||
                                (item as any).cardId ||
                                (item as any).$id ||
                                (item as any).id;
                            if (id && item.quantity > 0) {
                                const current = map.get(id);
                                map.set(id, {
                                    card_id: id,
                                    quantity: Math.max(
                                        current?.quantity || 0,
                                        item.quantity,
                                    ),
                                });
                            }
                        }
                    }
                }
            } catch {
                // Ignore storage errors
            }
        }

        return Array.from(map.values());
    }, [userCollection, opened]);

    const substitutions = useMemo(() => {
        if (!targetCard || !deck || !catalog || catalog.length === 0) {
            return [];
        }

        const rawResults = findCardSubstitutions(
            targetCard,
            deck,
            catalog,
            effectiveUserCollection,
            {
                maxResults: 30,
                onlyOwned,
                exactCostOnly,
                allowOtherDeckInks,
                format: deck.meta?.format || 'core',
            },
        );

        if (!searchQuery.trim()) return rawResults;

        const q = searchQuery.toLowerCase().trim();
        return rawResults.filter(
            (r) =>
                r.card.name.toLowerCase().includes(q) ||
                (r.card.classifications || []).some((c) =>
                    c.toLowerCase().includes(q),
                ),
        );
    }, [
        targetCard,
        deck,
        catalog,
        effectiveUserCollection,
        onlyOwned,
        exactCostOnly,
        allowOtherDeckInks,
        searchQuery,
    ]);

    if (!targetCard || !deck) return null;

    const targetInkStyle = getInkBadgeStyle(targetCard.ink_color || '');
    const requiredQty = targetDeckCard?.requiredQty || 1;
    const ownedQty = targetDeckCard?.ownedQty || 0;
    const missingQty = Math.max(0, requiredQty - ownedQty);

    const handleSwap = (substituteCard: Card, qty: number) => {
        if (onSwapCardInDeck) {
            onSwapCardInDeck(targetCard, substituteCard, qty);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            zIndex={500}
            size="1240px"
            centered
            radius="lg"
            title={
                <Group
                    justify="space-between"
                    align="center"
                    style={{ width: '100%' }}
                >
                    <Group gap="sm" align="center">
                        <Box
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '10px',
                                background:
                                    'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconArrowsExchange size={20} color="#c084fc" />
                        </Box>
                        <Box>
                            <Text
                                fw={900}
                                size="md"
                                style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    letterSpacing: '0.5px',
                                    background:
                                        'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Card Substitutions: {targetCard.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                                Smart budget and functional alternatives for{' '}
                                {deck.title}
                            </Text>
                        </Box>
                    </Group>
                </Group>
            }
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #110d24 0%, #0c0919 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    boxShadow:
                        '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(168, 85, 247, 0.12)',
                    maxHeight: '90dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                },
                header: {
                    background: 'rgba(15, 11, 32, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px 20px',
                    flexShrink: 0,
                },
                title: {
                    flex: 1,
                    marginRight: 16,
                },
                body: {
                    padding: '16px 20px',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <Grid align="stretch" style={{ flex: 1, minHeight: 0 }}>
                {/* 1. Left Column (25%): Full-sized Target Card to Replace */}
                <Grid.Col
                    span={{ base: 12, sm: 4, md: 3.5, lg: 3 }}
                    style={{ display: 'flex', flexDirection: 'column' }}
                >
                    <Paper
                        p="sm"
                        radius="md"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${targetInkStyle.color}40`,
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%',
                        }}
                    >
                        <Stack gap="xs">
                            <Text
                                size="xs"
                                fw={800}
                                c="dimmed"
                                tt="uppercase"
                                style={{ letterSpacing: '0.5px' }}
                            >
                                Card Being Replaced
                            </Text>

                            {/* Full Visual Target Card Artwork */}
                            <LorcanaCardTile
                                card={targetCard}
                                badgeColor={targetInkStyle.color}
                                aspectRatio="5/7"
                                headerOverlay={
                                    <Group
                                        justify="flex-end"
                                        align="flex-start"
                                        wrap="nowrap"
                                        p={6}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            zIndex: 2,
                                        }}
                                    >
                                        <Group
                                            gap={4}
                                            align="center"
                                            wrap="nowrap"
                                        >
                                            {targetCard.prices?.usd != null && (
                                                <Badge
                                                    size="xs"
                                                    variant="filled"
                                                    color="teal.8"
                                                    style={{
                                                        backdropFilter:
                                                            'blur(6px)',
                                                        backgroundColor:
                                                            'rgba(13, 148, 136, 0.9)',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        targetCard.prices.usd,
                                                    )}
                                                </Badge>
                                            )}

                                            <Tooltip
                                                label="View on TCGPlayer"
                                                withArrow
                                                position="top"
                                                zIndex={1000}
                                            >
                                                <ActionIcon
                                                    component="a"
                                                    href={
                                                        targetCard.tcgplayer_url ||
                                                        getTcgPlayerCardSearchUrl(
                                                            targetCard.name,
                                                        )
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="xs"
                                                    variant="filled"
                                                    color="dark"
                                                    style={{
                                                        backdropFilter:
                                                            'blur(6px)',
                                                        backgroundColor:
                                                            'rgba(15, 23, 42, 0.85)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    }}
                                                >
                                                    <IconExternalLink
                                                        size={11}
                                                    />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Group>
                                }
                            >
                                <Stack gap={6} p={8}>
                                    <Text
                                        size="xs"
                                        fw={700}
                                        c="gray.2"
                                        truncate
                                        title={targetCard.name}
                                    >
                                        Replacing: {targetCard.name}
                                    </Text>

                                    {/* Deck Requirement & Collection Status */}
                                    <Box
                                        p={6}
                                        style={{
                                            backgroundColor:
                                                'rgba(0, 0, 0, 0.3)',
                                            borderRadius: 6,
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                        }}
                                    >
                                        <Text size="11px" c="gray.4">
                                            Deck Requirement:
                                        </Text>
                                        <Text
                                            size="xs"
                                            fw={700}
                                            c={
                                                missingQty > 0
                                                    ? 'orange.4'
                                                    : 'teal.4'
                                            }
                                        >
                                            {ownedQty} owned / {requiredQty} in
                                            deck
                                            {missingQty > 0
                                                ? ` (${missingQty} missing)`
                                                : ' (Complete)'}
                                        </Text>
                                    </Box>

                                    {/* Keywords / Roles */}
                                    {targetKeywords.length > 0 && (
                                        <Group gap={4} wrap="wrap">
                                            {targetKeywords.map((kw) => (
                                                <Badge
                                                    key={kw}
                                                    size="xs"
                                                    variant="light"
                                                    color="gray"
                                                    radius="sm"
                                                    style={{ fontSize: '10px' }}
                                                >
                                                    {kw}
                                                </Badge>
                                            ))}
                                        </Group>
                                    )}
                                </Stack>
                            </LorcanaCardTile>
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* 2. Right Column (75%): Filter Toolbar & Substitutes Card Grid */}
                <Grid.Col
                    span={{ base: 12, sm: 8, md: 8.5, lg: 9 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                    }}
                >
                    <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
                        {/* Search & Filter Toolbar */}
                        <Group justify="space-between" wrap="wrap" gap="sm">
                            <TextInput
                                placeholder="Search substitute cards..."
                                leftSection={
                                    <IconSearch size={15} color="#a855f7" />
                                }
                                rightSection={
                                    searchQuery ? (
                                        <ActionIcon
                                            size="xs"
                                            variant="subtle"
                                            color="gray"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <IconX size={12} />
                                        </ActionIcon>
                                    ) : null
                                }
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.currentTarget.value)
                                }
                                size="xs"
                                style={{ minWidth: 200, flex: 1 }}
                                styles={{
                                    input: {
                                        backgroundColor:
                                            'rgba(15, 23, 42, 0.6)',
                                        borderColor: 'rgba(168, 85, 247, 0.2)',
                                        color: '#f8fafc',
                                    },
                                }}
                            />

                            <Group gap="md">
                                <Switch
                                    size="xs"
                                    color="teal"
                                    label="Only owned cards"
                                    checked={onlyOwned}
                                    onChange={(e) =>
                                        setOnlyOwned(e.currentTarget.checked)
                                    }
                                />
                                <Switch
                                    size="xs"
                                    color="violet"
                                    label="Exact ink cost"
                                    checked={exactCostOnly}
                                    onChange={(e) =>
                                        setExactCostOnly(
                                            e.currentTarget.checked,
                                        )
                                    }
                                />
                                {(
                                    (deck as any).displayInks ||
                                    deck.meta?.inks ||
                                    []
                                ).length > 1 && (
                                    <Switch
                                        size="xs"
                                        color="indigo"
                                        label="Allow other deck ink"
                                        checked={allowOtherDeckInks}
                                        onChange={(e) =>
                                            setAllowOtherDeckInks(
                                                e.currentTarget.checked,
                                            )
                                        }
                                    />
                                )}
                            </Group>
                        </Group>

                        {/* Ranked Substitutes Grid Container */}
                        <Box
                            p="xs"
                            style={{
                                background: 'rgba(10, 15, 29, 0.55)',
                                borderRadius: 12,
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                flex: 1,
                                minHeight: 0,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {substitutions.length === 0 ? (
                                <Paper
                                    p="xl"
                                    radius="md"
                                    style={{
                                        background: 'transparent',
                                        textAlign: 'center',
                                    }}
                                >
                                    <ThemeIcon
                                        size={48}
                                        radius="xl"
                                        color="violet"
                                        variant="light"
                                        mx="auto"
                                        mb="sm"
                                    >
                                        <IconInfoCircle size={26} />
                                    </ThemeIcon>
                                    <Text fw={700} size="sm" c="gray.2">
                                        No matching substitutes found with
                                        current filters.
                                    </Text>
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        mt={4}
                                        maw={400}
                                        mx="auto"
                                    >
                                        Try unchecking &quot;Only owned
                                        cards&quot; or &quot;Exact ink
                                        cost&quot; to expand recommended
                                        alternatives.
                                    </Text>
                                </Paper>
                            ) : (
                                <ScrollArea
                                    h="calc(90dvh - 190px)"
                                    mah="calc(90dvh - 190px)"
                                    type="auto"
                                    offsetScrollbars
                                    style={{ flex: 1, minHeight: 0 }}
                                >
                                    <SimpleGrid
                                        cols={{ base: 1, sm: 2, lg: 3 }}
                                        spacing="md"
                                        p={4}
                                    >
                                        {substitutions.map((sub) => (
                                            <SubstituteCardTile
                                                key={sub.card.id}
                                                substitute={sub}
                                                targetCard={targetCard}
                                                user={user}
                                                canSwap={canSwapInDeck}
                                                onSwapCard={handleSwap}
                                                onQuickAdd={onQuickAdd}
                                            />
                                        ))}
                                    </SimpleGrid>
                                </ScrollArea>
                            )}
                        </Box>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Modal>
    );
}
