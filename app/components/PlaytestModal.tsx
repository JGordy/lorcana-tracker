import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Modal,
    Stack,
    Group,
    Box,
    Text,
    Badge,
    Button,
    Card,
    Tooltip,
    Paper,
} from '@mantine/core';
import {
    IconCards,
    IconDice,
    IconRefresh,
    IconArrowRight,
    IconCheck,
    IconX,
    IconHistory,
    IconDroplet,
    IconSparkles,
    IconLayersLinked,
    IconFlame,
    IconPlus,
} from '@tabler/icons-react';
import type { Card as LorcanaCard } from '../types/lorcana';
import {
    expandDeck,
    shuffleDeck,
    dealOpeningHand,
    alterHand,
    drawTurnCard,
    analyzeHand,
    type HandCardInstance,
} from '../utils/handSimulator';

export interface PlaytestModalProps {
    opened: boolean;
    onClose: () => void;
    deck: {
        $id?: string;
        id?: string;
        title: string;
        displayInks?: string[];
        isCoreLegal?: boolean;
        cards: Array<{
            card: LorcanaCard;
            requiredQty: number;
            ownedQty?: number;
        }>;
    } | null;
}

export function PlaytestModal({ opened, onClose, deck }: PlaytestModalProps) {
    const [hand, setHand] = useState<HandCardInstance[]>([]);
    const [drawPile, setDrawPile] = useState<HandCardInstance[]>([]);
    const [selectedForAlter, setSelectedForAlter] = useState<Set<string>>(
        new Set(),
    );
    const [hasAltered, setHasAltered] = useState(false);
    const [turnNumber, setTurnNumber] = useState(1);
    const [history, setHistory] = useState<
        Array<{ turn: number; action: string; time: string }>
    >([]);
    const [showHistory, setShowHistory] = useState(false);

    // Initialize or Reset opening hand
    const handleNewHand = useCallback(() => {
        if (!deck || !deck.cards || deck.cards.length === 0) {
            setHand([]);
            setDrawPile([]);
            setSelectedForAlter(new Set());
            setHasAltered(false);
            setTurnNumber(1);
            setHistory([]);
            return;
        }

        const expanded = expandDeck(deck.cards);
        const shuffled = shuffleDeck(expanded);
        const { hand: openingHand, drawPile: remaining } = dealOpeningHand(
            shuffled,
            7,
        );

        setHand(openingHand);
        setDrawPile(remaining);
        setSelectedForAlter(new Set());
        setHasAltered(false);
        setTurnNumber(1);
        setHistory([
            {
                turn: 1,
                action: `Dealt fresh opening hand (${openingHand.length} cards)`,
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            },
        ]);
    }, [deck]);

    // Reset when modal opens or active deck changes
    useEffect(() => {
        if (opened) {
            handleNewHand();
        }
    }, [opened, handleNewHand]);

    // Toggle card for Alter
    const handleToggleAlter = (instanceId: string) => {
        if (hasAltered) return;
        setSelectedForAlter((prev) => {
            const next = new Set(prev);
            if (next.has(instanceId)) {
                next.delete(instanceId);
            } else {
                next.add(instanceId);
            }
            return next;
        });
    };

    // Alter selected cards
    const handleExecuteAlter = () => {
        if (hasAltered) return;
        const alterCount = selectedForAlter.size;

        if (alterCount === 0) {
            // User chose to keep hand without alteration
            setHasAltered(true);
            setHistory((prev) => [
                ...prev,
                {
                    turn: 1,
                    action: 'Kept opening hand (0 cards altered)',
                    time: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                },
            ]);
            return;
        }

        const { newHand, newDrawPile, drawnCards, alteredCards } = alterHand(
            hand,
            drawPile,
            selectedForAlter,
        );

        setHand(newHand);
        setDrawPile(newDrawPile);
        setSelectedForAlter(new Set());
        setHasAltered(true);

        setHistory((prev) => [
            ...prev,
            {
                turn: 1,
                action: `Altered ${alterCount} card${alterCount > 1 ? 's' : ''} (${alteredCards.map((c) => c.card.name).join(', ')}) ➔ Drew ${drawnCards.map((c) => c.card.name).join(', ')}`,
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            },
        ]);
    };

    // Draw card for next turn
    const handleDrawNextTurn = () => {
        const nextTurn = turnNumber + 1;
        const { newHand, newDrawPile, drawnCard } = drawTurnCard(
            hand,
            drawPile,
            nextTurn,
        );

        if (!drawnCard) return;

        setHand(newHand);
        setDrawPile(newDrawPile);
        setTurnNumber(nextTurn);
        setHistory((prev) => [
            ...prev,
            {
                turn: nextTurn,
                action: `Turn ${nextTurn} Draw: ${drawnCard.card.name} (Cost ${drawnCard.card.cost})`,
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            },
        ]);
    };

    // Extra manual draw (e.g. card effects like "Friends on the Other Side")
    const handleDrawExtraCard = () => {
        const { newHand, newDrawPile, drawnCard } = drawTurnCard(
            hand,
            drawPile,
            turnNumber,
        );

        if (!drawnCard) return;

        setHand(newHand);
        setDrawPile(newDrawPile);
        setHistory((prev) => [
            ...prev,
            {
                turn: turnNumber,
                action: `Extra Draw: ${drawnCard.card.name} (Cost ${drawnCard.card.cost})`,
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            },
        ]);
    };

    // Select all / Deselect all
    const handleSelectAllAlter = () => {
        if (hasAltered) return;
        if (selectedForAlter.size === hand.length) {
            setSelectedForAlter(new Set());
        } else {
            setSelectedForAlter(new Set(hand.map((c) => c.instanceId)));
        }
    };

    // Metrics analysis
    const metrics = useMemo(() => analyzeHand(hand), [hand]);

    if (!deck) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
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
                                    'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(236, 72, 153, 0.3) 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
                            }}
                        >
                            <IconDice size={22} color="#e9d5ff" />
                        </Box>
                        <Box>
                            <Group gap="xs" align="center">
                                <Text
                                    fw={900}
                                    size="md"
                                    style={{
                                        fontFamily:
                                            "'Cinzel Decorative', serif",
                                        letterSpacing: '0.5px',
                                        background:
                                            'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {deck.title}
                                </Text>
                                <Badge
                                    size="xs"
                                    variant="gradient"
                                    gradient={
                                        deck.isCoreLegal
                                            ? {
                                                  from: 'teal.7',
                                                  to: 'emerald.8',
                                                  deg: 90,
                                              }
                                            : {
                                                  from: 'orange.7',
                                                  to: 'amber.8',
                                                  deg: 90,
                                              }
                                    }
                                    radius="sm"
                                    style={{ fontWeight: 700 }}
                                >
                                    {deck.isCoreLegal ? 'CORE' : 'INFINITY'}
                                </Badge>
                            </Group>
                            <Text size="11px" c="gray.4">
                                Opening Hand & Alter (Mulligan) Playtester
                            </Text>
                        </Box>
                    </Group>

                    {/* Header Right Status Badges */}
                    <Group gap="xs" align="center">
                        <Badge
                            size="sm"
                            variant="filled"
                            color={hasAltered ? 'violet.8' : 'blue.8'}
                            leftSection={<IconSparkles size={12} />}
                            style={{ fontWeight: 800 }}
                        >
                            {hasAltered ? `Turn ${turnNumber}` : 'Alter Phase'}
                        </Badge>
                        <Badge
                            size="sm"
                            variant="light"
                            color="gray"
                            leftSection={<IconCards size={12} />}
                        >
                            {drawPile.length} in Deck
                        </Badge>
                    </Group>
                </Group>
            }
            size="1240px"
            centered
            radius="lg"
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #110d24 0%, #0c0919 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow:
                        '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(168, 85, 247, 0.15)',
                },
                header: {
                    background: 'rgba(15, 11, 32, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px 22px',
                },
                title: {
                    flex: 1,
                    marginRight: 16,
                },
                body: {
                    padding: '20px 22px',
                },
            }}
        >
            <Stack gap="md">
                {/* 1. At-a-glance Hand Analysis Dashboard */}
                <Paper
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(20, 16, 43, 0.85) 0%, rgba(15, 23, 42, 0.85) 100%)',
                        borderColor: 'rgba(168, 85, 247, 0.25)',
                    }}
                >
                    <Group
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap="xs"
                    >
                        <Group gap="xs" align="center">
                            {/* Inkable Indicator */}
                            <Tooltip
                                label={`${metrics.inkableCount} out of ${metrics.totalCards} cards can be put into the inkwell`}
                                withArrow
                            >
                                <Badge
                                    size="md"
                                    variant="gradient"
                                    gradient={{
                                        from: 'teal.7',
                                        to: 'emerald.8',
                                        deg: 90,
                                    }}
                                    leftSection={<IconDroplet size={14} />}
                                    style={{ fontWeight: 800 }}
                                >
                                    {metrics.inkableCount} Inkable (
                                    {metrics.inkablePercentage}%)
                                </Badge>
                            </Tooltip>

                            {/* Uninkable Indicator */}
                            {metrics.uninkableCount > 0 && (
                                <Tooltip
                                    label={`${metrics.uninkableCount} cards CANNOT be inked (must be played or held)`}
                                    withArrow
                                >
                                    <Badge
                                        size="md"
                                        variant="filled"
                                        color="red.9"
                                        leftSection={<IconX size={13} />}
                                        style={{ fontWeight: 800 }}
                                    >
                                        {metrics.uninkableCount} Uninkable
                                    </Badge>
                                </Tooltip>
                            )}

                            {/* Turn 1 Plays */}
                            <Tooltip
                                label={`${metrics.turn1Plays.length} 1-cost cards available for Turn 1 play`}
                                withArrow
                            >
                                <Badge
                                    size="md"
                                    variant="light"
                                    color={
                                        metrics.turn1Plays.length > 0
                                            ? 'cyan'
                                            : 'gray'
                                    }
                                    leftSection={<IconFlame size={14} />}
                                    style={{ fontWeight: 700 }}
                                >
                                    {metrics.turn1Plays.length} T1 Play
                                    {metrics.turn1Plays.length === 1 ? '' : 's'}
                                </Badge>
                            </Tooltip>

                            {/* Turn 2 Plays */}
                            <Tooltip
                                label={`${metrics.turn2Plays.length} 2-cost cards available for Turn 2 play`}
                                withArrow
                            >
                                <Badge
                                    size="md"
                                    variant="light"
                                    color={
                                        metrics.turn2Plays.length > 0
                                            ? 'indigo'
                                            : 'gray'
                                    }
                                    style={{ fontWeight: 700 }}
                                >
                                    {metrics.turn2Plays.length} T2 Play
                                    {metrics.turn2Plays.length === 1 ? '' : 's'}
                                </Badge>
                            </Tooltip>

                            {/* Avg Cost */}
                            <Badge
                                size="md"
                                variant="outline"
                                color="violet"
                                style={{ fontWeight: 700 }}
                            >
                                Avg Cost: {metrics.averageCost}
                            </Badge>
                        </Group>

                        {/* History toggle */}
                        <Button
                            variant="subtle"
                            color="gray"
                            size="xs"
                            leftSection={<IconHistory size={14} />}
                            onClick={() => setShowHistory((prev) => !prev)}
                        >
                            {showHistory
                                ? 'Hide Log'
                                : `Log (${history.length})`}
                        </Button>
                    </Group>
                </Paper>

                {/* 2. Interactive Action / Phase Toolbar */}
                <Paper
                    p="sm"
                    radius="md"
                    style={{
                        background: hasAltered
                            ? 'rgba(30, 27, 75, 0.45)'
                            : 'linear-gradient(90deg, rgba(88, 28, 135, 0.3) 0%, rgba(30, 58, 138, 0.3) 100%)',
                        border: hasAltered
                            ? '1px solid rgba(255, 255, 255, 0.08)'
                            : '1px solid rgba(168, 85, 247, 0.4)',
                    }}
                >
                    <Group
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap="sm"
                    >
                        {!hasAltered ? (
                            <>
                                <Box>
                                    <Text fw={700} size="sm" c="purple.1">
                                        Alter Phase (Mulligan)
                                    </Text>
                                    <Text size="xs" c="gray.4">
                                        Click cards below to select which ones
                                        to put on the bottom of the deck and
                                        replace.
                                    </Text>
                                </Box>

                                <Group gap="xs">
                                    <Button
                                        variant="subtle"
                                        color="gray"
                                        size="xs"
                                        onClick={handleSelectAllAlter}
                                    >
                                        {selectedForAlter.size === hand.length
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </Button>

                                    <Button
                                        variant="gradient"
                                        gradient={{
                                            from: 'violet.6',
                                            to: 'pink.6',
                                            deg: 90,
                                        }}
                                        size="sm"
                                        leftSection={
                                            <IconLayersLinked size={16} />
                                        }
                                        onClick={handleExecuteAlter}
                                        style={{ fontWeight: 800 }}
                                    >
                                        {selectedForAlter.size > 0
                                            ? `Alter Selected (${selectedForAlter.size})`
                                            : 'Keep Hand (0 Alter)'}
                                    </Button>

                                    <Button
                                        variant="light"
                                        color="gray"
                                        size="sm"
                                        leftSection={<IconRefresh size={15} />}
                                        onClick={handleNewHand}
                                    >
                                        New Hand
                                    </Button>
                                </Group>
                            </>
                        ) : (
                            <>
                                <Group gap="xs" align="center">
                                    <Badge
                                        size="lg"
                                        variant="filled"
                                        color="teal.8"
                                        leftSection={<IconCheck size={14} />}
                                    >
                                        Alter Phase Locked
                                    </Badge>
                                    <Text size="xs" c="gray.4">
                                        Simulate turns by drawing top cards from
                                        library.
                                    </Text>
                                </Group>

                                <Group gap="xs">
                                    <Button
                                        variant="gradient"
                                        gradient={{
                                            from: 'teal.6',
                                            to: 'cyan.6',
                                            deg: 90,
                                        }}
                                        size="sm"
                                        leftSection={
                                            <IconArrowRight size={16} />
                                        }
                                        onClick={handleDrawNextTurn}
                                        disabled={drawPile.length === 0}
                                        style={{ fontWeight: 800 }}
                                    >
                                        Draw Next Turn (Turn {turnNumber + 1})
                                    </Button>

                                    <Button
                                        variant="light"
                                        color="cyan"
                                        size="sm"
                                        leftSection={<IconPlus size={15} />}
                                        onClick={handleDrawExtraCard}
                                        disabled={drawPile.length === 0}
                                    >
                                        Draw Extra
                                    </Button>

                                    <Button
                                        variant="light"
                                        color="violet"
                                        size="sm"
                                        leftSection={<IconRefresh size={15} />}
                                        onClick={handleNewHand}
                                    >
                                        New Hand
                                    </Button>
                                </Group>
                            </>
                        )}
                    </Group>
                </Paper>

                {/* Collapsible Action History Log */}
                {showHistory && (
                    <Paper
                        p="sm"
                        radius="md"
                        withBorder
                        style={{
                            background: 'rgba(10, 15, 29, 0.75)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            maxHeight: 160,
                            overflowY: 'auto',
                        }}
                    >
                        <Text
                            size="10px"
                            fw={800}
                            c="gray.5"
                            tt="uppercase"
                            style={{ letterSpacing: '0.5px' }}
                            mb={6}
                        >
                            Playtest Activity Log
                        </Text>
                        <Stack gap={4}>
                            {history.map((h, i) => (
                                <Group
                                    key={i}
                                    justify="space-between"
                                    wrap="nowrap"
                                    gap="xs"
                                >
                                    <Text size="xs" c="gray.3">
                                        <Text span fw={700} c="violet.3">
                                            [Turn {h.turn}]
                                        </Text>{' '}
                                        {h.action}
                                    </Text>
                                    <Text size="10px" c="gray.6">
                                        {h.time}
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    </Paper>
                )}

                {/* 3. Hand Cards Display Gallery (Overlapping Playmat Layout) */}
                <Box
                    p="md"
                    style={{
                        background: 'rgba(10, 15, 29, 0.65)',
                        borderRadius: 14,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        minHeight: 450,
                        overflowX: 'auto',
                        overflowY: 'visible',
                    }}
                >
                    {hand.length === 0 ? (
                        <Box p="xl" style={{ textAlign: 'center' }}>
                            <IconDice
                                size={36}
                                color="#a855f7"
                                style={{ opacity: 0.5, marginBottom: 8 }}
                            />
                            <Text size="sm" c="gray.4">
                                No cards in hand. Click "New Hand" to deal 7
                                cards.
                            </Text>
                        </Box>
                    ) : (
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                padding: '48px 24px 28px 24px',
                                minWidth: 'min-content',
                                overflow: 'visible',
                            }}
                        >
                            {hand.map((item, index) => {
                                const isSelected = selectedForAlter.has(
                                    item.instanceId,
                                );
                                const card = item.card;

                                // Dynamic negative margin overlap based on total hand size
                                const overlapMargin =
                                    index === 0
                                        ? '0px'
                                        : hand.length > 9
                                          ? '-68px'
                                          : hand.length > 7
                                            ? '-52px'
                                            : hand.length > 5
                                              ? '-36px'
                                              : '-18px';

                                return (
                                    <div
                                        key={item.instanceId}
                                        className="playtest-card-wrapper"
                                        style={{
                                            width: 175,
                                            minWidth: 155,
                                            maxWidth: 195,
                                            flexShrink: 0,
                                            marginLeft: overlapMargin,
                                            zIndex: index + 1,
                                            animation:
                                                'dealCardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
                                            animationDelay: `${Math.min(index, 8) * 45}ms`,
                                        }}
                                    >
                                        <Card
                                            className={`playtest-hand-card ${isSelected ? 'is-selected' : ''}`}
                                            padding={6}
                                            radius="md"
                                            withBorder
                                            onClick={() =>
                                                handleToggleAlter(
                                                    item.instanceId,
                                                )
                                            }
                                            style={{
                                                backgroundColor: isSelected
                                                    ? 'rgba(45, 10, 30, 0.88)'
                                                    : 'rgba(18, 22, 34, 0.95)',
                                                borderColor: isSelected
                                                    ? '#ef4444'
                                                    : !hasAltered
                                                      ? 'rgba(168, 85, 247, 0.45)'
                                                      : 'rgba(255, 255, 255, 0.12)',
                                                cursor: !hasAltered
                                                    ? 'pointer'
                                                    : 'default',
                                                boxShadow: isSelected
                                                    ? '0 0 20px rgba(239, 68, 68, 0.55)'
                                                    : '0 8px 20px rgba(0, 0, 0, 0.55)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            {/* Card Image Area */}
                                            <Box
                                                style={{
                                                    position: 'relative',
                                                    borderRadius: 6,
                                                    overflow: 'hidden',
                                                    backgroundColor:
                                                        'rgba(0, 0, 0, 0.4)',
                                                    aspectRatio: '5/7',
                                                }}
                                            >
                                                {card.image_url ? (
                                                    <img
                                                        src={card.image_url}
                                                        alt={card.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            display: 'block',
                                                        }}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <Box
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            display: 'flex',
                                                            flexDirection:
                                                                'column',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            padding: 8,
                                                        }}
                                                    >
                                                        <IconCards
                                                            size={28}
                                                            style={{
                                                                opacity: 0.3,
                                                                marginBottom: 4,
                                                            }}
                                                        />
                                                        <Text
                                                            size="xs"
                                                            fw={700}
                                                            ta="center"
                                                            c="gray.3"
                                                            lineClamp={2}
                                                        >
                                                            {card.name}
                                                        </Text>
                                                    </Box>
                                                )}

                                                {/* Center Alter Tag Overlay */}
                                                {isSelected && (
                                                    <Box
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            inset: 0,
                                                            background:
                                                                'rgba(239, 68, 68, 0.45)',
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                        }}
                                                    >
                                                        <Badge
                                                            size="sm"
                                                            variant="filled"
                                                            color="red"
                                                            style={{
                                                                fontWeight: 900,
                                                                letterSpacing:
                                                                    '0.5px',
                                                                boxShadow:
                                                                    '0 2px 10px rgba(0,0,0,0.8)',
                                                            }}
                                                        >
                                                            ALTER
                                                        </Badge>
                                                    </Box>
                                                )}

                                                {/* Turn Marker Badge if drawn after turn 1 */}
                                                {item.drawnOnTurn > 1 && (
                                                    <Badge
                                                        size="xs"
                                                        variant="filled"
                                                        color="cyan.9"
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            bottom: 4,
                                                            left: 4,
                                                            fontWeight: 800,
                                                            fontSize: '9px',
                                                        }}
                                                    >
                                                        Turn {item.drawnOnTurn}
                                                    </Badge>
                                                )}

                                                {item.isAltered && (
                                                    <Badge
                                                        size="xs"
                                                        variant="filled"
                                                        color="violet.8"
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            bottom: 4,
                                                            left: 4,
                                                            fontWeight: 800,
                                                            fontSize: '9px',
                                                        }}
                                                    >
                                                        Altered
                                                    </Badge>
                                                )}
                                            </Box>

                                            {/* Card Name */}
                                            <Box mt={6} px={2} pb={2}>
                                                <Text
                                                    size="11px"
                                                    fw={700}
                                                    c="gray.2"
                                                    ta="center"
                                                    lineClamp={1}
                                                    title={card.name}
                                                >
                                                    {card.name}
                                                </Text>
                                            </Box>
                                        </Card>
                                    </div>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Stack>
        </Modal>
    );
}
