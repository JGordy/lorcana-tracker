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
    Card,
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
} from '@tabler/icons-react';
import { ALL_INKS } from '../../../../types/lorcana';
import { DeckInkCurve } from '../../../../components/DeckInkCurve';
import { ExportDeckGraphicModal } from '../../../decks/components/ExportDeckGraphicModal';

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
}: MyDecksViewModalProps) {
    const [showCurve, setShowCurve] = useState(false);
    const [showGraphicModal, setShowGraphicModal] = useState(false);

    if (!activeDeck) return null;

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

                    {/* Header Right: Compact Collection Completion */}
                    <Box style={{ width: 220, marginLeft: 'auto' }}>
                        <Group justify="space-between" align="center" mb={4}>
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
                                        : activeDeck.progress.percentage >= 50
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
                                            <Card
                                                key={card.id}
                                                padding={10}
                                                radius="md"
                                                withBorder
                                                style={{
                                                    backgroundColor:
                                                        'rgba(18, 22, 34, 0.85)',
                                                    borderColor: isMissing
                                                        ? 'rgba(239, 68, 68, 0.35)'
                                                        : 'rgba(168, 85, 247, 0.25)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent:
                                                        'space-between',
                                                    transition:
                                                        'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                                                }}
                                            >
                                                {/* Top: Card Image with floating status badge & remove button */}
                                                <Box
                                                    style={{
                                                        position: 'relative',
                                                        borderRadius: 6,
                                                        overflow: 'hidden',
                                                        backgroundColor:
                                                            'rgba(0, 0, 0, 0.3)',
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
                                                                size={24}
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

                                                    {/* Floating Status Badge */}
                                                    <Badge
                                                        size="sm"
                                                        color={
                                                            isMissing
                                                                ? 'red'
                                                                : 'teal'
                                                        }
                                                        variant={
                                                            isMissing
                                                                ? 'filled'
                                                                : 'light'
                                                        }
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
                                                        {isMissing
                                                            ? `Need ${missingCount}`
                                                            : '✓ Owned'}
                                                    </Badge>
                                                </Box>

                                                {/* Bottom: Card Name, Deck Stepper & Remove, Ownership & Quick Add */}
                                                <Stack
                                                    gap={8}
                                                    mt="xs"
                                                    justify="space-between"
                                                    style={{ flex: 1 }}
                                                >
                                                    <Text
                                                        size="xs"
                                                        fw={700}
                                                        c="gray.2"
                                                        lh={1.3}
                                                        style={{
                                                            minHeight: '2.6em',
                                                        }}
                                                    >
                                                        {card.name}
                                                    </Text>

                                                    <Group
                                                        justify="space-between"
                                                        align="center"
                                                        wrap="nowrap"
                                                    >
                                                        {/* Deck Stepper (1-4) & Remove Button */}
                                                        <Group
                                                            gap={3}
                                                            align="center"
                                                            wrap="nowrap"
                                                        >
                                                            <ActionIcon
                                                                size="xs"
                                                                variant="light"
                                                                color="violet"
                                                                onClick={() =>
                                                                    onUpdateCardQty(
                                                                        activeDeck,
                                                                        card.id,
                                                                        -1,
                                                                    )
                                                                }
                                                            >
                                                                <IconMinus
                                                                    size={11}
                                                                />
                                                            </ActionIcon>
                                                            <Text
                                                                size="xs"
                                                                fw={800}
                                                                style={{
                                                                    width: 14,
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                {requiredQty}
                                                            </Text>
                                                            <ActionIcon
                                                                size="xs"
                                                                variant="light"
                                                                color="violet"
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
                                                                    size={11}
                                                                />
                                                            </ActionIcon>

                                                            <Tooltip
                                                                label="Remove from deck"
                                                                position="top"
                                                                withArrow
                                                            >
                                                                <ActionIcon
                                                                    size="xs"
                                                                    variant="subtle"
                                                                    color="red"
                                                                    onClick={() =>
                                                                        onRemoveCard(
                                                                            activeDeck,
                                                                            card,
                                                                            requiredQty,
                                                                        )
                                                                    }
                                                                >
                                                                    <IconTrash
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Group>

                                                        {/* Ownership & Quick Add */}
                                                        <Group
                                                            gap={4}
                                                            wrap="nowrap"
                                                        >
                                                            <Text
                                                                size="11px"
                                                                c="dimmed"
                                                            >
                                                                Own{' '}
                                                                <Text
                                                                    component="span"
                                                                    fw={700}
                                                                    c={
                                                                        isMissing
                                                                            ? ownedQty >
                                                                              0
                                                                                ? 'orange.4'
                                                                                : 'red.4'
                                                                            : 'teal.4'
                                                                    }
                                                                >
                                                                    {ownedQty}
                                                                </Text>
                                                            </Text>

                                                            {isMissing && (
                                                                <Tooltip
                                                                    label="Add 1 copy to your collection"
                                                                    position="top"
                                                                >
                                                                    <Button
                                                                        size="compact-xs"
                                                                        variant="light"
                                                                        color="violet"
                                                                        leftSection={
                                                                            <IconPlus
                                                                                size={
                                                                                    11
                                                                                }
                                                                            />
                                                                        }
                                                                        onClick={() =>
                                                                            onQuickAdd(
                                                                                card.id,
                                                                                ownedQty,
                                                                            )
                                                                        }
                                                                        style={{
                                                                            paddingLeft: 4,
                                                                            paddingRight: 6,
                                                                            fontSize: 10,
                                                                        }}
                                                                    >
                                                                        +1 Coll
                                                                    </Button>
                                                                </Tooltip>
                                                            )}
                                                        </Group>
                                                    </Group>
                                                </Stack>
                                            </Card>
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
