import {
    Modal,
    Stack,
    Card,
    Group,
    Text,
    Badge,
    Progress,
    TextInput,
    Select,
    Button,
    Box,
    ScrollArea,
    Table,
    ActionIcon,
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
} from '@tabler/icons-react';
import { ALL_INKS } from '../../../../types/lorcana';

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
}: MyDecksViewModalProps) {
    if (!activeDeck) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
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
                                    fontFamily: "'Cinzel Decorative', serif",
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
                                                inkName.toLowerCase().trim(),
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
                                                    justifyContent: 'center',
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
                            <Badge
                                size="xs"
                                variant="light"
                                color="violet"
                                radius="sm"
                                style={{
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    background: 'rgba(168, 85, 247, 0.12)',
                                    fontWeight: 700,
                                }}
                            >
                                {activeDeck.totalCardsCount}/60 CARDS
                            </Badge>
                        </Group>
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
                body: {
                    padding: '20px 22px',
                },
            }}
        >
            <Stack gap="md">
                {/* Summary & Progress Bar */}
                <Card
                    padding="md"
                    radius="md"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}
                >
                    <Group justify="space-between" align="center" mb={6}>
                        <Text size="xs" fw={800} c="gray.3" tt="uppercase">
                            Collection Completion:
                        </Text>
                        <Badge
                            size="md"
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
                            {activeDeck.progress.ownedCount} /{' '}
                            {activeDeck.progress.totalCount} Owned (
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
                        size="md"
                        radius="xl"
                        striped
                        animated={activeDeck.progress.percentage < 100}
                    />
                    {activeDeck.meta.description && (
                        <Text size="xs" c="gray.4" mt="xs" lh={1.5}>
                            {activeDeck.meta.description}
                        </Text>
                    )}
                </Card>

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
                            Add Cards from Catalog
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
                        <Button
                            variant="light"
                            color="violet"
                            size="xs"
                            radius="md"
                            leftSection={
                                copyFeedback === activeDeck.$id ? (
                                    <IconCheck size={14} />
                                ) : (
                                    <IconCopy size={14} />
                                )
                            }
                            onClick={() => onExportDeck(activeDeck)}
                        >
                            {copyFeedback === activeDeck.$id
                                ? 'Copied!'
                                : 'Export'}
                        </Button>
                    </Group>
                </Group>

                {/* Cards Table with Bounded ScrollArea */}
                <Box
                    p="xs"
                    style={{
                        background: 'rgba(10, 15, 29, 0.55)',
                        borderRadius: 10,
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
                        <ScrollArea h={380} type="auto">
                            <Table highlightOnHover style={{ minWidth: 700 }}>
                                <Table.Thead>
                                    <Table.Tr
                                        style={{
                                            borderBottom:
                                                '1px solid rgba(255, 255, 255, 0.08)',
                                        }}
                                    >
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Card
                                        </Table.Th>
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Ink Color
                                        </Table.Th>
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                textAlign: 'center',
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Cost
                                        </Table.Th>
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                textAlign: 'center',
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Rarity
                                        </Table.Th>
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                textAlign: 'center',
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Deck Qty (1–4)
                                        </Table.Th>
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                textAlign: 'center',
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Owned
                                        </Table.Th>
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                textAlign: 'center',
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Status
                                        </Table.Th>
                                        <Table.Th
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 11,
                                                textAlign: 'right',
                                                tt: 'uppercase',
                                            }}
                                        >
                                            Actions
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredCards.map(
                                        ({ card, requiredQty, ownedQty }) => {
                                            const isMissing =
                                                ownedQty < requiredQty;
                                            const missingCount =
                                                requiredQty - ownedQty;
                                            const inkSlug = ALL_INKS.some(
                                                (i) =>
                                                    i.id ===
                                                    (card.ink_color || '')
                                                        .toLowerCase()
                                                        .trim(),
                                            )
                                                ? card.ink_color
                                                      .toLowerCase()
                                                      .trim()
                                                : 'amber';

                                            return (
                                                <Table.Tr
                                                    key={card.id}
                                                    style={{
                                                        background: isMissing
                                                            ? 'rgba(239, 68, 68, 0.05)'
                                                            : 'rgba(255, 255, 255, 0.015)',
                                                        borderBottom:
                                                            '1px solid rgba(255, 255, 255, 0.03)',
                                                    }}
                                                >
                                                    <Table.Td>
                                                        <Group
                                                            gap="xs"
                                                            wrap="nowrap"
                                                        >
                                                            {card.image_url && (
                                                                <img
                                                                    src={
                                                                        card.image_url
                                                                    }
                                                                    alt={
                                                                        card.name
                                                                    }
                                                                    style={{
                                                                        width: 28,
                                                                        height: 38,
                                                                        objectFit:
                                                                            'cover',
                                                                        borderRadius: 4,
                                                                    }}
                                                                />
                                                            )}
                                                            <Box>
                                                                <Text
                                                                    size="xs"
                                                                    fw={700}
                                                                    c="gray.1"
                                                                >
                                                                    {card.name}
                                                                </Text>
                                                                <Text
                                                                    size="10px"
                                                                    c="gray.5"
                                                                >
                                                                    {card.set} •
                                                                    #
                                                                    {
                                                                        card.number
                                                                    }
                                                                </Text>
                                                            </Box>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Group
                                                            gap={6}
                                                            wrap="nowrap"
                                                        >
                                                            <img
                                                                src={`/inks/${inkSlug}.svg`}
                                                                alt={
                                                                    card.ink_color
                                                                }
                                                                style={{
                                                                    width: 16,
                                                                    height: 16,
                                                                }}
                                                            />
                                                            <Text
                                                                size="xs"
                                                                c="gray.3"
                                                            >
                                                                {card.ink_color ||
                                                                    'Amber'}
                                                            </Text>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Badge
                                                            size="xs"
                                                            variant="light"
                                                            color="indigo"
                                                        >
                                                            {card.cost}⬡
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Badge
                                                            size="xs"
                                                            variant="outline"
                                                            color="gray"
                                                        >
                                                            {card.rarity}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Group
                                                            gap={4}
                                                            justify="center"
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
                                                                    size={12}
                                                                />
                                                            </ActionIcon>
                                                            <Text
                                                                size="xs"
                                                                fw={800}
                                                                style={{
                                                                    width: 20,
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
                                                                    size={12}
                                                                />
                                                            </ActionIcon>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c={
                                                                ownedQty > 0
                                                                    ? 'teal.4'
                                                                    : 'dimmed'
                                                            }
                                                            fw={700}
                                                        >
                                                            {ownedQty} Owned
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {isMissing ? (
                                                            <Badge
                                                                size="xs"
                                                                color="red"
                                                                variant="light"
                                                            >
                                                                Need{' '}
                                                                {missingCount}
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                size="xs"
                                                                color="teal"
                                                                variant="light"
                                                            >
                                                                ✓ Owned
                                                            </Badge>
                                                        )}
                                                    </Table.Td>
                                                    <Table.Td
                                                        style={{
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        <Group
                                                            gap={6}
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
                                                                        onQuickAdd(
                                                                            card.id,
                                                                            ownedQty,
                                                                        )
                                                                    }
                                                                >
                                                                    +1 Coll
                                                                </Button>
                                                            )}
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
                                                                    size={12}
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
                        </ScrollArea>
                    )}
                </Box>

                {/* Fixed Modal Footer */}
                <Group justify="space-between" align="center" mt="xs">
                    <Text size="xs" c="dimmed">
                        Total Cards:{' '}
                        <strong style={{ color: '#f8fafc' }}>
                            {activeDeck.totalCardsCount}/60
                        </strong>{' '}
                        • {activeDeck.cards.length} Unique Cards
                    </Text>
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet.6', to: 'indigo.6' }}
                        onClick={onClose}
                    >
                        Done
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
