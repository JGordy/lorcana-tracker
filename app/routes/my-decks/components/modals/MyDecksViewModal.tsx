import { useState } from 'react';
import {
    Modal,
    Stack,
    Group,
    Text,
    Badge,
    Progress,
    TextInput,
    Select,
    Button,
    Box,
    ScrollArea,
    SimpleGrid,
    Tooltip,
    ActionIcon,
    Indicator,
} from '@mantine/core';
import {
    IconCards,
    IconSearch,
    IconPlus,
    IconEdit,
    IconCopy,
    IconCheck,
    IconTrash,
    IconMinus,
    IconShoppingCart,
    IconDice,
    IconChartBar,
    IconPhoto,
    IconArrowsExchange,
} from '@tabler/icons-react';
import { LorcanaCardTile } from '../../../../components/LorcanaCardTile';
import { ALL_INKS } from '../../../../types/lorcana';
import { DeckInkCurve } from '../../../../components/DeckInkCurve';
import { ExportDeckGraphicModal } from '../../../decks/components/ExportDeckGraphicModal';
import { calculateDeckCost, formatCurrency } from '../../../../utils/valuation';
import { getTcgPlayerCardSearchUrl } from '../../../../utils/shoppingList';
import { IconExternalLink } from '@tabler/icons-react';

interface MyDecksViewModalProps {
    opened: boolean;
    onClose: () => void;
    activeDeck: any;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    inkFilter: string;
    onInkFilterChange: (val: string) => void;
    filteredCards: any[];
    copyFeedback: string | null;
    onOpenAddCardsModal: () => void;
    onOpenEditModal: (deck: any) => void;
    onExportDeck: (deck: any) => void;
    onUpdateCardQty: (deck: any, cardId: string, delta: number) => void;
    onQuickAdd: (cardId: string, currentOwned: number) => void;
    onRemoveCard: (deck: any, card: any, currentQty: number) => void;
    onOpenShoppingList?: (deck: any) => void;
    onOpenPlaytest?: (deck: any) => void;
    onOpenSubstitutions?: (card: any) => void;
}

export function MyDecksViewModal({
    opened,
    onClose,
    activeDeck,
    searchQuery,
    onSearchChange,
    inkFilter,
    onInkFilterChange,
    filteredCards,
    copyFeedback,
    onOpenAddCardsModal,
    onOpenEditModal,
    onExportDeck,
    onUpdateCardQty,
    onQuickAdd,
    onRemoveCard,
    onOpenShoppingList,
    onOpenPlaytest,
    onOpenSubstitutions,
}: MyDecksViewModalProps) {
    const [showCurve, setShowCurve] = useState(false);
    const [showGraphicModal, setShowGraphicModal] = useState(false);

    if (!activeDeck) return null;

    const deckCost = calculateDeckCost(activeDeck.cards || []);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            zIndex={200}
            title={
                <Group
                    justify="space-between"
                    align="center"
                    style={{ width: '100%' }}
                >
                    <Group gap="sm" align="center">
                        <Box
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                background:
                                    'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconCards size={20} color="#c084fc" />
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
                                    {activeDeck.title}
                                </Text>
                                <Group gap={4} ml={2}>
                                    {activeDeck.displayInks.map(
                                        (inkName: string) => {
                                            const inkSlug = ALL_INKS.some(
                                                (i) =>
                                                    i.id ===
                                                    inkName
                                                        .toLowerCase()
                                                        .trim(),
                                            )
                                                ? inkName.toLowerCase().trim()
                                                : 'amber';
                                            return (
                                                <Box
                                                    key={inkName}
                                                    style={{
                                                        padding: 3,
                                                        borderRadius: '50%',
                                                        background:
                                                            'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    <img
                                                        src={`/inks/${inkSlug}.svg`}
                                                        alt={inkName}
                                                        style={{
                                                            width: 15,
                                                            height: 15,
                                                            display: 'block',
                                                        }}
                                                        title={inkName}
                                                    />
                                                </Box>
                                            );
                                        },
                                    )}
                                </Group>
                                <Badge
                                    size="xs"
                                    variant="gradient"
                                    gradient={
                                        activeDeck.isCoreLegal
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
                                    style={{
                                        fontWeight: 700,
                                        letterSpacing: '0.3px',
                                    }}
                                >
                                    {activeDeck.isCoreLegal
                                        ? 'CORE LEGAL'
                                        : 'INFINITY'}
                                </Badge>
                            </Group>
                        </Box>
                    </Group>

                    {/* Header Right: Valuation & Collection Completion */}
                    <Group
                        gap="md"
                        align="center"
                        style={{ marginLeft: 'auto' }}
                    >
                        {deckCost.totalDeckCost > 0 && (
                            <Box style={{ textAlign: 'right' }}>
                                <Text
                                    size="10px"
                                    fw={800}
                                    c="yellow.4"
                                    tt="uppercase"
                                >
                                    Est. Value:{' '}
                                    {formatCurrency(deckCost.totalDeckCost)}
                                </Text>
                                {deckCost.costToFinish > 0 && (
                                    <Text size="10px" fw={700} c="red.4">
                                        Need:{' '}
                                        {formatCurrency(deckCost.costToFinish)}
                                    </Text>
                                )}
                            </Box>
                        )}

                        <Box style={{ width: 180 }}>
                            <Group
                                justify="space-between"
                                align="center"
                                mb={4}
                            >
                                <Text
                                    size="10px"
                                    fw={800}
                                    c="gray.4"
                                    tt="uppercase"
                                >
                                    Completion
                                </Text>
                                <Badge
                                    size="xs"
                                    variant="light"
                                    color={
                                        activeDeck.progress.percentage >= 80
                                            ? 'teal'
                                            : activeDeck.progress.percentage >=
                                                50
                                              ? 'yellow'
                                              : 'red'
                                    }
                                    radius="sm"
                                    style={{ fontWeight: 800 }}
                                >
                                    {activeDeck.progress.ownedCount}/
                                    {activeDeck.progress.totalCount} (
                                    {activeDeck.progress.percentage}%)
                                </Badge>
                            </Group>
                            <Progress
                                value={activeDeck.progress.percentage}
                                color={
                                    activeDeck.progress.percentage >= 80
                                        ? 'teal'
                                        : activeDeck.progress.percentage >= 50
                                          ? 'yellow'
                                          : 'red'
                                }
                                size="xs"
                                radius="xl"
                                striped
                            />
                        </Box>
                    </Group>
                </Group>
            }
            size="1150px"
            centered
            radius="lg"
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #110d24 0%, #0c0919 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    boxShadow:
                        '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(168, 85, 247, 0.12)',
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
                {/* Toolbar */}
                <Group justify="space-between" wrap="wrap" gap="xs">
                    <Group gap="xs" style={{ flex: 1 }}>
                        <TextInput
                            placeholder="Search cards in this deck..."
                            leftSection={
                                <IconSearch size={16} color="#a855f7" />
                            }
                            value={searchQuery}
                            onChange={(e) =>
                                onSearchChange(e.currentTarget.value)
                            }
                            size="xs"
                            styles={{
                                input: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                },
                            }}
                            style={{ minWidth: 220, flex: 1 }}
                        />
                        {activeDeck.displayInks.length > 0 && (
                            <Select
                                size="xs"
                                value={inkFilter}
                                onChange={(val) =>
                                    onInkFilterChange(val || 'all')
                                }
                                data={[
                                    { value: 'all', label: 'All Inks' },
                                    ...activeDeck.displayInks.map(
                                        (ink: string) => ({
                                            value: ink,
                                            label:
                                                ink.charAt(0).toUpperCase() +
                                                ink.slice(1),
                                        }),
                                    ),
                                ]}
                                comboboxProps={{ zIndex: 1000 }}
                                styles={{
                                    input: {
                                        backgroundColor:
                                            'rgba(15, 23, 42, 0.6)',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                    },
                                }}
                                style={{ width: 140 }}
                            />
                        )}
                    </Group>

                    <Group gap="xs">
                        {onOpenPlaytest && (
                            <Button
                                variant="gradient"
                                gradient={{
                                    from: 'violet.7',
                                    to: 'indigo.6',
                                    deg: 90,
                                }}
                                size="xs"
                                radius="md"
                                leftSection={<IconDice size={14} />}
                                onClick={() => onOpenPlaytest(activeDeck)}
                                style={{ fontWeight: 700 }}
                            >
                                Playtest Hand
                            </Button>
                        )}

                        <Button
                            variant="gradient"
                            gradient={{
                                from: 'violet.7',
                                to: 'indigo.6',
                                deg: 90,
                            }}
                            size="xs"
                            radius="md"
                            leftSection={<IconPlus size={14} />}
                            onClick={onOpenAddCardsModal}
                            style={{ fontWeight: 700 }}
                        >
                            Add Cards
                        </Button>

                        <Button
                            variant="light"
                            color="gray"
                            size="xs"
                            radius="md"
                            leftSection={<IconEdit size={14} />}
                            onClick={() => onOpenEditModal(activeDeck)}
                        >
                            Edit Info
                        </Button>

                        {/* Compact Tooltipped Utility Icons */}
                        <Tooltip
                            label={
                                showCurve
                                    ? 'Hide Deck Curve'
                                    : 'Show Deck Curve'
                            }
                            withArrow
                        >
                            <ActionIcon
                                aria-label={
                                    showCurve
                                        ? 'Hide Deck Curve'
                                        : 'Show Deck Curve'
                                }
                                variant={showCurve ? 'light' : 'subtle'}
                                color="violet"
                                size="md"
                                radius="md"
                                onClick={() => setShowCurve((prev) => !prev)}
                            >
                                <IconChartBar size={16} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip
                            label="Shopping List (Missing Cards)"
                            withArrow
                        >
                            <Indicator
                                disabled={
                                    activeDeck.progress.ownedCount >=
                                    activeDeck.progress.totalCount
                                }
                                label={
                                    activeDeck.progress.totalCount -
                                    activeDeck.progress.ownedCount
                                }
                                color="red"
                                size={15}
                                offset={2}
                            >
                                <ActionIcon
                                    aria-label="Shopping List (Missing Cards)"
                                    variant="gradient"
                                    gradient={{
                                        from: 'violet.6',
                                        to: 'pink.6',
                                        deg: 90,
                                    }}
                                    size="md"
                                    radius="md"
                                    onClick={() =>
                                        onOpenShoppingList?.(activeDeck)
                                    }
                                >
                                    <IconShoppingCart size={16} />
                                </ActionIcon>
                            </Indicator>
                        </Tooltip>

                        <Tooltip
                            label={
                                copyFeedback === activeDeck.$id
                                    ? 'Copied List!'
                                    : 'Export Deck List'
                            }
                            withArrow
                        >
                            <ActionIcon
                                aria-label={
                                    copyFeedback === activeDeck.$id
                                        ? 'Copied List!'
                                        : 'Export Deck List'
                                }
                                variant="outline"
                                color={
                                    copyFeedback === activeDeck.$id
                                        ? 'teal'
                                        : 'gray'
                                }
                                size="md"
                                radius="md"
                                onClick={() => onExportDeck(activeDeck)}
                            >
                                {copyFeedback === activeDeck.$id ? (
                                    <IconCheck size={16} color="#2ecc71" />
                                ) : (
                                    <IconCopy size={16} />
                                )}
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Share Visual Graphic" withArrow>
                            <ActionIcon
                                aria-label="Share Visual Graphic"
                                variant="gradient"
                                gradient={{
                                    from: 'violet.6',
                                    to: 'indigo.6',
                                    deg: 90,
                                }}
                                size="md"
                                radius="md"
                                onClick={() => setShowGraphicModal(true)}
                            >
                                <IconPhoto size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                {/* 60-Card Deck Ink Curve & Cost Distribution */}
                {showCurve && <DeckInkCurve cards={activeDeck.cards} />}

                {/* Cards Visual Grid Gallery */}
                <Box
                    p="sm"
                    style={{
                        background: 'rgba(10, 15, 29, 0.55)',
                        borderRadius: 12,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                >
                    {filteredCards.length === 0 ? (
                        <Box p="lg" style={{ textAlign: 'center' }}>
                            <Text size="sm" c="gray.5">
                                No cards match your search filter.
                            </Text>
                        </Box>
                    ) : (
                        <ScrollArea h={520} type="auto" offsetScrollbars>
                            <SimpleGrid
                                cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 5 }}
                                spacing="md"
                            >
                                {filteredCards.map(
                                    ({ card, requiredQty, ownedQty }) => {
                                        const isMissing =
                                            ownedQty < requiredQty;
                                        const missingCount =
                                            requiredQty - ownedQty;

                                        return (
                                            <LorcanaCardTile
                                                key={card.id}
                                                card={card}
                                                style={{
                                                    borderColor: isMissing
                                                        ? 'rgba(239, 68, 68, 0.35)'
                                                        : 'rgba(168, 85, 247, 0.25)',
                                                }}
                                                headerOverlay={
                                                    isMissing ? (
                                                        <Badge
                                                            size="sm"
                                                            color="red"
                                                            variant="filled"
                                                            style={{
                                                                position:
                                                                    'absolute',
                                                                top: 6,
                                                                right: 6,
                                                                fontWeight: 900,
                                                                boxShadow:
                                                                    '0 2px 8px rgba(0, 0, 0, 0.75)',
                                                            }}
                                                        >
                                                            Need {missingCount}
                                                        </Badge>
                                                    ) : null
                                                }
                                            >
                                                {/* Bottom Info & Clean 2-Row Controls */}
                                                <Stack
                                                    gap={6}
                                                    p="xs"
                                                    justify="space-between"
                                                    style={{ flex: 1 }}
                                                >
                                                    <Box>
                                                        <Group
                                                            justify="space-between"
                                                            align="flex-start"
                                                            wrap="nowrap"
                                                            gap={2}
                                                        >
                                                            <Text
                                                                size="xs"
                                                                fw={800}
                                                                c="gray.1"
                                                                lineClamp={1}
                                                                title={
                                                                    card.name
                                                                }
                                                                style={{
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                {card.name}
                                                            </Text>
                                                            <Group
                                                                gap={3}
                                                                align="center"
                                                                wrap="nowrap"
                                                            >
                                                                {onOpenSubstitutions && (
                                                                    <Tooltip
                                                                        label="Find Substitutes"
                                                                        position="top"
                                                                        withArrow
                                                                    >
                                                                        <ActionIcon
                                                                            size="xs"
                                                                            variant="subtle"
                                                                            color="violet"
                                                                            aria-label={`Find substitutes for ${card.name}`}
                                                                            onClick={() =>
                                                                                onOpenSubstitutions(
                                                                                    card,
                                                                                )
                                                                            }
                                                                            style={{
                                                                                opacity: 0.85,
                                                                                marginTop:
                                                                                    -2,
                                                                            }}
                                                                        >
                                                                            <IconArrowsExchange
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                )}
                                                                <Tooltip
                                                                    label="TCGPlayer"
                                                                    position="top"
                                                                    withArrow
                                                                >
                                                                    <ActionIcon
                                                                        component="a"
                                                                        href={
                                                                            card.tcgplayer_url ||
                                                                            getTcgPlayerCardSearchUrl(
                                                                                card.name,
                                                                            )
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        size="xs"
                                                                        variant="subtle"
                                                                        color="blue"
                                                                        style={{
                                                                            opacity: 0.7,
                                                                            marginTop:
                                                                                -2,
                                                                        }}
                                                                    >
                                                                        <IconExternalLink
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            </Group>
                                                        </Group>
                                                        {card.prices?.usd !=
                                                            null && (
                                                            <Text
                                                                size="10px"
                                                                c="teal.3"
                                                                fw={700}
                                                                mt={1}
                                                            >
                                                                {formatCurrency(
                                                                    card.prices
                                                                        .usd,
                                                                )}{' '}
                                                                <span
                                                                    style={{
                                                                        color: '#64748b',
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    ea
                                                                </span>
                                                            </Text>
                                                        )}
                                                    </Box>

                                                    {/* Row 1: Deck In-Use Quantity Stepper & Separate Delete Button */}
                                                    <Group
                                                        justify="space-between"
                                                        align="center"
                                                        wrap="nowrap"
                                                        gap="xs"
                                                    >
                                                        <Group
                                                            justify="space-between"
                                                            align="center"
                                                            style={{
                                                                flex: 1,
                                                                background:
                                                                    'rgba(168, 85, 247, 0.12)',
                                                                padding:
                                                                    '2px 8px',
                                                                borderRadius:
                                                                    '16px',
                                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                                            }}
                                                        >
                                                            <Text
                                                                size="11px"
                                                                c="gray.4"
                                                                fw={600}
                                                            >
                                                                Deck
                                                            </Text>
                                                            <Group
                                                                gap={2}
                                                                align="center"
                                                            >
                                                                <ActionIcon
                                                                    size="xs"
                                                                    radius="xl"
                                                                    variant="subtle"
                                                                    color="violet"
                                                                    aria-label={`Decrease ${card.name}`}
                                                                    onClick={() =>
                                                                        onUpdateCardQty(
                                                                            activeDeck,
                                                                            card.id,
                                                                            -1,
                                                                        )
                                                                    }
                                                                >
                                                                    <IconMinus
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                                <Text
                                                                    size="xs"
                                                                    fw={800}
                                                                    c="violet.2"
                                                                    style={{
                                                                        width: 14,
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
                                                                    radius="xl"
                                                                    variant="subtle"
                                                                    color="violet"
                                                                    aria-label={`Increase ${card.name}`}
                                                                    disabled={
                                                                        requiredQty >=
                                                                        4
                                                                    }
                                                                    onClick={() =>
                                                                        onUpdateCardQty(
                                                                            activeDeck,
                                                                            card.id,
                                                                            1,
                                                                        )
                                                                    }
                                                                >
                                                                    <IconPlus
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            </Group>
                                                        </Group>

                                                        {/* Separate Delete Button Outside Purple Capsule */}
                                                        <Tooltip
                                                            label="Remove from deck"
                                                            position="top"
                                                            withArrow
                                                        >
                                                            <ActionIcon
                                                                size="sm"
                                                                radius="md"
                                                                variant="subtle"
                                                                color="red"
                                                                aria-label={`Remove ${card.name} from deck`}
                                                                onClick={() =>
                                                                    onRemoveCard(
                                                                        activeDeck,
                                                                        card,
                                                                        requiredQty,
                                                                    )
                                                                }
                                                                style={{
                                                                    backgroundColor:
                                                                        'rgba(239, 68, 68, 0.12)',
                                                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                                                }}
                                                            >
                                                                <IconTrash
                                                                    size={12}
                                                                />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>

                                                    {/* Row 2: Personal Collection Ownership Stepper */}
                                                    <Group
                                                        justify="space-between"
                                                        align="center"
                                                        style={{
                                                            background:
                                                                'rgba(15, 23, 42, 0.6)',
                                                            padding: '2px 8px',
                                                            borderRadius:
                                                                '12px',
                                                            border: isMissing
                                                                ? '1px solid rgba(239, 68, 68, 0.2)'
                                                                : '1px solid rgba(46, 204, 113, 0.2)',
                                                        }}
                                                    >
                                                        <Text
                                                            size="11px"
                                                            c="gray.4"
                                                            fw={600}
                                                        >
                                                            Owned{' '}
                                                            <Text
                                                                component="span"
                                                                fw={800}
                                                                c={
                                                                    isMissing
                                                                        ? ownedQty >
                                                                          0
                                                                            ? 'orange.4'
                                                                            : 'red.4'
                                                                        : 'teal.4'
                                                                }
                                                            >
                                                                {ownedQty}/
                                                                {requiredQty}
                                                            </Text>
                                                        </Text>

                                                        <Group
                                                            gap={2}
                                                            align="center"
                                                        >
                                                            <Tooltip
                                                                label="Remove 1 copy from collection"
                                                                position="top"
                                                                withArrow
                                                            >
                                                                <ActionIcon
                                                                    size="xs"
                                                                    radius="xl"
                                                                    variant="subtle"
                                                                    color="violet"
                                                                    aria-label={`Decrease owned quantity for ${card.name}`}
                                                                    disabled={
                                                                        ownedQty <=
                                                                        0
                                                                    }
                                                                    onClick={() =>
                                                                        onQuickAdd(
                                                                            card.id,
                                                                            Math.max(
                                                                                0,
                                                                                ownedQty -
                                                                                    1,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    <IconMinus
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                            <Tooltip
                                                                label="Add 1 copy to collection"
                                                                position="top"
                                                                withArrow
                                                            >
                                                                <ActionIcon
                                                                    size="xs"
                                                                    radius="xl"
                                                                    variant="subtle"
                                                                    color="violet"
                                                                    aria-label={`Increase owned quantity for ${card.name}`}
                                                                    onClick={() =>
                                                                        onQuickAdd(
                                                                            card.id,
                                                                            ownedQty +
                                                                                1,
                                                                        )
                                                                    }
                                                                >
                                                                    <IconPlus
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Group>
                                                    </Group>
                                                </Stack>
                                            </LorcanaCardTile>
                                        );
                                    },
                                )}
                            </SimpleGrid>
                        </ScrollArea>
                    )}
                </Box>
            </Stack>

            <ExportDeckGraphicModal
                opened={showGraphicModal}
                onClose={() => setShowGraphicModal(false)}
                deck={activeDeck}
            />
        </Modal>
    );
}
