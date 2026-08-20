import {
    Modal,
    Stack,
    Group,
    Box,
    Text,
    Badge,
    Card,
    Progress,
    TextInput,
    Button,
    ScrollArea,
    Table,
} from '@mantine/core';
import {
    IconCards,
    IconSearch,
    IconFolderPlus,
    IconBrandYoutube,
    IconCheck,
    IconCopy,
    IconPlus,
} from '@tabler/icons-react';
import type { useFetcher } from 'react-router';
import { RARITY_COLOR } from '../../../utils/deck';
import { getInkBadgeStyle, type ProcessedDeck } from '../utils/deckHelpers';

interface ViewDeckModalProps {
    opened: boolean;
    onClose: () => void;
    activeDeck: ProcessedDeck | null;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filteredCards: ProcessedDeck['cards'];
    cloneFetcher: ReturnType<typeof useFetcher>;
    copyFeedback: string | null;
    user?: { $id: string } | null;
    onCloneDeck: (deck: ProcessedDeck) => void;
    onExportDeck: (deck: ProcessedDeck) => void;
    onQuickAdd: (cardId: string, currentOwned: number) => void;
}

export function ViewDeckModal({
    opened,
    onClose,
    activeDeck,
    searchQuery,
    setSearchQuery,
    filteredCards,
    cloneFetcher,
    copyFeedback,
    user,
    onCloneDeck,
    onExportDeck,
    onQuickAdd,
}: ViewDeckModalProps) {
    if (!activeDeck) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconCards size={22} color="#a855f7" />
                    <Box>
                        <Group gap="xs" align="center">
                            <Text fw={800} size="md">
                                {activeDeck.title}
                            </Text>
                            <Badge
                                size="xs"
                                variant="filled"
                                color={
                                    activeDeck.isCoreLegal
                                        ? 'teal.8'
                                        : 'orange.8'
                                }
                            >
                                {activeDeck.isCoreLegal
                                    ? 'Core Legal'
                                    : 'Infinity'}
                            </Badge>
                            <Badge size="xs" variant="outline" color="violet">
                                {activeDeck.cards.reduce(
                                    (acc, c) => acc + c.requiredQty,
                                    0,
                                )}
                                /60 Cards
                            </Badge>
                        </Group>
                    </Box>
                </Group>
            }
            size="1100px"
            centered
            radius="lg"
        >
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
                                        activeDeck.progress.percentage >= 80
                                            ? 'teal'
                                            : activeDeck.progress.percentage >=
                                                50
                                              ? 'yellow'
                                              : 'red'
                                    }
                                >
                                    {activeDeck.progress.ownedCount}/
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
                                size="sm"
                                radius="xl"
                                striped
                            />
                        </Box>
                    </Group>
                    {activeDeck.description && (
                        <Text size="xs" c="dimmed" mt="xs">
                            {activeDeck.description}
                        </Text>
                    )}
                </Card>

                {/* Search & Actions Toolbar */}
                <Group justify="space-between" wrap="wrap" gap="xs">
                    <TextInput
                        placeholder="Search cards in this deck..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        size="xs"
                        style={{ minWidth: 220, flex: 1 }}
                    />

                    <Group gap="xs">
                        <Button
                            variant="light"
                            color="violet"
                            size="xs"
                            leftSection={<IconFolderPlus size={14} />}
                            loading={cloneFetcher.state === 'submitting'}
                            onClick={() => onCloneDeck(activeDeck)}
                        >
                            Save to My Decks
                        </Button>

                        {activeDeck.youtube && (
                            <Button
                                component="a"
                                href={`https://www.youtube.com/watch?v=${activeDeck.youtube}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="xs"
                                variant="light"
                                color="red"
                                leftSection={<IconBrandYoutube size={14} />}
                            >
                                Watch Guide
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            color="gray"
                            size="xs"
                            leftSection={
                                copyFeedback === activeDeck.$id ? (
                                    <IconCheck size={14} color="#2ecc71" />
                                ) : (
                                    <IconCopy size={14} />
                                )
                            }
                            onClick={() => onExportDeck(activeDeck)}
                        >
                            {copyFeedback === activeDeck.$id
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
                    {filteredCards.length === 0 ? (
                        <Box p="lg" style={{ textAlign: 'center' }}>
                            <Text size="sm" c="gray.5">
                                No cards match your filter.
                            </Text>
                        </Box>
                    ) : (
                        <ScrollArea h={260} type="auto">
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
                                    {filteredCards.map((dc) => {
                                        const isMissing =
                                            dc.ownedQty < dc.requiredQty;
                                        const missingCount =
                                            dc.requiredQty - dc.ownedQty;

                                        return (
                                            <Table.Tr key={dc.card.id}>
                                                <Table.Td>
                                                    <Group gap="sm">
                                                        {dc.card.image_url ? (
                                                            <img
                                                                src={
                                                                    dc.card
                                                                        .image_url
                                                                }
                                                                alt={
                                                                    dc.card.name
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
                                                                    size={16}
                                                                    opacity={
                                                                        0.4
                                                                    }
                                                                />
                                                            </Box>
                                                        )}
                                                        <Box>
                                                            <Text
                                                                size="xs"
                                                                fw={600}
                                                                c="gray.2"
                                                            >
                                                                {dc.card.name}
                                                            </Text>
                                                            {dc.card.type && (
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
                                                            dc.card.ink_color ||
                                                                '',
                                                        )}
                                                    >
                                                        {dc.card.ink_color}
                                                    </Badge>
                                                </Table.Td>

                                                <Table.Td
                                                    style={{
                                                        textAlign: 'center',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {dc.card.cost}⬡
                                                </Table.Td>

                                                <Table.Td
                                                    style={{
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color={
                                                            RARITY_COLOR[
                                                                dc.card.rarity
                                                            ] || 'gray'
                                                        }
                                                    >
                                                        {dc.card.rarity}
                                                    </Badge>
                                                </Table.Td>

                                                <Table.Td
                                                    style={{
                                                        textAlign: 'center',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {dc.requiredQty}
                                                </Table.Td>

                                                <Table.Td
                                                    style={{
                                                        textAlign: 'center',
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
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {isMissing ? (
                                                        <Badge
                                                            size="xs"
                                                            color="red"
                                                            variant="light"
                                                        >
                                                            Need {missingCount}
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
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        <Button
                                                            size="compact-xs"
                                                            variant="subtle"
                                                            color="violet"
                                                            leftSection={
                                                                <IconPlus
                                                                    size={12}
                                                                />
                                                            }
                                                            onClick={() =>
                                                                onQuickAdd(
                                                                    dc.card.id,
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
                                    })}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}
                </Box>

                {/* Modal Footer */}
                <Group
                    justify="space-between"
                    align="center"
                    mt="xs"
                    style={{ flexShrink: 0 }}
                >
                    <Text size="xs" c="dimmed">
                        Total Cards:{' '}
                        <strong>
                            {activeDeck.cards.reduce(
                                (acc, c) => acc + c.requiredQty,
                                0,
                            )}
                            /60
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
