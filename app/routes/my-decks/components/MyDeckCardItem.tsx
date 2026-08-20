import {
    Card,
    Box,
    Group,
    Badge,
    Text,
    Stack,
    Progress,
    Button,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import {
    IconCards,
    IconPlus,
    IconEdit,
    IconTrash,
    IconCopy,
    IconCheck,
} from '@tabler/icons-react';
import {
    getFeaturedDeckCard,
    getKeyDeckCards,
    INK_HEX_MAP,
} from '../../../utils/deck';
import { ALL_INKS } from '../../../types/lorcana';

interface MyDeckCardItemProps {
    deck: any;
    copyFeedback: string | null;
    onOpenViewModal: (deckId: string) => void;
    onOpenEditModal: (deck: any) => void;
    onOpenDeleteModal: (deck: any) => void;
    onExportDeck: (deck: any) => void;
    onOpenAddCardsModal?: (deck: any) => void;
}

export function MyDeckCardItem({
    deck,
    copyFeedback,
    onOpenViewModal,
    onOpenEditModal,
    onOpenDeleteModal,
    onExportDeck,
    onOpenAddCardsModal,
}: MyDeckCardItemProps) {
    const { percentage, ownedCount, totalCount } = deck.progress;
    const featuredCard = getFeaturedDeckCard(deck.cards, deck.meta.coverCardId);
    const keyCards = getKeyDeckCards(deck.cards, 4);

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
            {/* Top Section: Hero Card Cover Art */}
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

                {/* Gradient Fade Overlay */}
                <Box
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        background:
                            'linear-gradient(180deg, rgba(10, 15, 29, 0.25) 0%, rgba(10, 15, 29, 0) 35%, rgba(15, 23, 42, 0.8) 85%, rgba(15, 23, 42, 0.98) 100%)',
                    }}
                />

                {/* Top Floating Inks (Top Right) */}
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
                        {deck.displayInks.map((inkName: string) => {
                            const inkSlug = ALL_INKS.some(
                                (i) => i.id === inkName.toLowerCase().trim(),
                            )
                                ? inkName.toLowerCase().trim()
                                : 'amber';
                            return (
                                <img
                                    key={inkName}
                                    src={`/inks/${inkSlug}.svg`}
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
                            );
                        })}
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
                    {deck.meta.description && deck.meta.description.trim() ? (
                        <Text size="xs" c="gray.4" lineClamp={2} mt={2}>
                            {deck.meta.description}
                        </Text>
                    ) : null}
                </Box>

                {/* Key Cards Row */}
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
                                            style={{
                                                position: 'relative',
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                border: `2px solid ${inkBorderColor}`,
                                                boxShadow:
                                                    '0 2px 6px rgba(0,0,0,0.5)',
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
                                                            'center top',
                                                    }}
                                                />
                                            ) : (
                                                <Box
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        background: '#1e293b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    <Text size="8px" c="gray.4">
                                                        {kc?.name
                                                            ? kc.name.slice(
                                                                  0,
                                                                  3,
                                                              )
                                                            : ''}
                                                    </Text>
                                                </Box>
                                            )}
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </Group>
                    </Box>
                )}

                {/* Progress Bar */}
                <Box mt="auto" pt="xs">
                    <Group justify="space-between" align="center" mb={4}>
                        <Text size="xs" c="gray.4" fw={600}>
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

            {/* Action Bar */}
            <Group
                justify="space-between"
                align="center"
                wrap="nowrap"
                mt="md"
                pt="xs"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
                <Button
                    size="xs"
                    px={8}
                    variant="light"
                    color="violet"
                    leftSection={<IconCards size={14} />}
                    onClick={() => onOpenViewModal(deck.$id)}
                    style={{ flexShrink: 1, minWidth: 0, fontSize: '11px' }}
                >
                    View & Edit Deck
                </Button>

                <Group gap={2} style={{ flexShrink: 0 }}>
                    <Tooltip label="Add Cards" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={() =>
                                onOpenAddCardsModal
                                    ? onOpenAddCardsModal(deck)
                                    : onOpenViewModal(deck.$id)
                            }
                        >
                            <IconPlus size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit Title / Cover Art" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={() => onOpenEditModal(deck)}
                        >
                            <IconEdit size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Export Decklist" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={() => onExportDeck(deck)}
                        >
                            {copyFeedback === deck.$id ? (
                                <IconCheck size={16} color="#2ecc71" />
                            ) : (
                                <IconCopy size={16} />
                            )}
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete Deck" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => onOpenDeleteModal(deck)}
                        >
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
        </Card>
    );
}
