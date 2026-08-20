import {
    Card,
    Group,
    Stack,
    Text,
    Badge,
    Progress,
    Box,
    Button,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import {
    IconCards,
    IconFolderPlus,
    IconBrandYoutube,
    IconCopy,
    IconCheck,
} from '@tabler/icons-react';
import type { useFetcher } from 'react-router';
import {
    INK_HEX_MAP,
    getFeaturedDeckCard,
    getKeyDeckCards,
} from '../../../utils/deck';
import type { ProcessedDeck } from '../utils/deckHelpers';

interface DeckCardItemProps {
    deck: ProcessedDeck;
    cloneFetcher: ReturnType<typeof useFetcher>;
    copyFeedback: string | null;
    onOpenViewModal: (deckId: string) => void;
    onCloneDeck: (deck: ProcessedDeck) => void;
    onExportDeck: (deck: ProcessedDeck) => void;
}

export function DeckCardItem({
    deck,
    cloneFetcher,
    copyFeedback,
    onOpenViewModal,
    onCloneDeck,
    onExportDeck,
}: DeckCardItemProps) {
    const { percentage, ownedCount, totalCount } = deck.progress;
    const featuredCard = getFeaturedDeckCard(deck.cards);
    const keyCards = getKeyDeckCards(deck.cards, 4);

    const deckInks = Array.from(
        new Set(
            deck.cards.flatMap((dc) =>
                dc.card.ink_color ? dc.card.ink_color.split('/') : [],
            ),
        ),
    );

    let progressColor = 'red';
    if (percentage >= 80) progressColor = 'teal';
    else if (percentage >= 50) progressColor = 'yellow';

    return (
        <Card
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
                                        inkName.charAt(0).toUpperCase() +
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
                                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
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
                        color={deck.isCoreLegal ? 'teal.8' : 'orange.8'}
                    >
                        {deck.isCoreLegal ? 'Core' : 'Infinity'}
                    </Badge>
                </Box>
            </Card.Section>

            {/* Card Main Info */}
            <Stack gap="xs" mt="sm" style={{ flex: 1 }}>
                <Box>
                    <Text fw={800} size="md" c="gray.1" lineClamp={1}>
                        {deck.title}
                    </Text>
                    {deck.description && deck.description.trim() ? (
                        <Text size="xs" c="gray.4" lineClamp={2} mt={2}>
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
                                        ? kc.ink_color.split('/')[0]
                                        : ''
                                )
                                    .toLowerCase()
                                    .trim();
                                const inkBorderColor =
                                    INK_HEX_MAP[primaryInk] || '#94a3b8';
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
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                border: `2px solid ${inkBorderColor}`,
                                                boxShadow: `0 0 6px ${inkBorderColor}40`,
                                                background: '#0a0f1d',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {kc.image_url ? (
                                                <img
                                                    src={kc.image_url}
                                                    alt={kc.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
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
                    <Group justify="space-between" align="center" mb={4}>
                        <Text size="xs" fw={700} c="gray.4">
                            Collection Progress
                        </Text>
                        <Badge size="xs" variant="light" color={progressColor}>
                            {ownedCount}/{totalCount} ({percentage}%)
                        </Badge>
                    </Group>
                    <Progress
                        value={percentage}
                        color={progressColor}
                        size="sm"
                        radius="xl"
                        striped
                    />
                </Box>
            </Stack>

            <Box
                mt="md"
                style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: 12,
                }}
            >
                <Group justify="space-between" align="center" gap="xs">
                    <Button
                        variant="light"
                        color="violet"
                        size="xs"
                        style={{ flex: 1 }}
                        leftSection={<IconCards size={14} />}
                        onClick={() => onOpenViewModal(deck.$id)}
                    >
                        View Decklist
                    </Button>

                    <Group gap={4}>
                        <Tooltip label="Save to My Decks" withArrow>
                            <ActionIcon
                                variant="subtle"
                                color="violet"
                                size="sm"
                                loading={cloneFetcher.state === 'submitting'}
                                onClick={() => onCloneDeck(deck)}
                            >
                                <IconFolderPlus size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {deck.youtube && (
                            <Tooltip label="Watch YouTube Guide" withArrow>
                                <ActionIcon
                                    component="a"
                                    href={`https://www.youtube.com/watch?v=${deck.youtube}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                >
                                    <IconBrandYoutube size={16} />
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
                                onClick={() => onExportDeck(deck)}
                            >
                                {copyFeedback === deck.$id ? (
                                    <IconCheck size={16} color="#2ecc71" />
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
}
