import {
    Modal,
    Stack,
    Group,
    Box,
    Text,
    Badge,
    Progress,
    TextInput,
    Select,
    Button,
    ScrollArea,
    Table,
    ActionIcon,
} from '@mantine/core';
import {
    IconCards,
    IconSearch,
    IconFolderPlus,
    IconBrandYoutube,
    IconCheck,
    IconCopy,
    IconPlus,
    IconX,
} from '@tabler/icons-react';
import type { useFetcher } from 'react-router';
import { RARITY_COLOR, parseDeckMetadata } from '../../../utils/deck';
import {
    getInkBadgeStyle,
    VALID_LORCANA_INKS,
    type ProcessedDeck,
} from '../utils/deckHelpers';

interface ViewDeckModalProps {
    opened: boolean;
    onClose: () => void;
    activeDeck: ProcessedDeck | null;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    inkFilter: string;
    onInkFilterChange: (val: string) => void;
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
    inkFilter,
    onInkFilterChange,
    filteredCards,
    cloneFetcher,
    copyFeedback,
    user,
    onCloneDeck,
    onExportDeck,
    onQuickAdd,
}: ViewDeckModalProps) {
    if (!activeDeck) return null;

    const meta = parseDeckMetadata(activeDeck.description);
    const displayDesc = activeDeck.displayDescription || meta.description;

    // Build ink filter options from deck's known inks
    const deckInkOptions = (activeDeck.displayInks || [])
        .filter((i) => VALID_LORCANA_INKS.has(i))
        .map((ink) => ({
            value: ink,
            label: ink.charAt(0).toUpperCase() + ink.slice(1),
        }));

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
            size="1100px"
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
                {displayDesc && displayDesc.trim() ? (
                    <Text size="xs" c="dimmed">
                        {displayDesc}
                    </Text>
                ) : null}

                {/* Search, Ink Filter & Actions Toolbar */}
                <Group justify="space-between" wrap="wrap" gap="xs">
                    <Group gap="xs" style={{ flex: 1 }}>
                        <TextInput
                            placeholder="Search cards in this deck..."
                            leftSection={
                                <IconSearch size={16} color="#a855f7" />
                            }
                            rightSection={
                                searchQuery ? (
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="gray"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <IconX size={13} />
                                    </ActionIcon>
                                ) : null
                            }
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(e.currentTarget.value)
                            }
                            size="xs"
                            style={{ minWidth: 220, flex: 1 }}
                            styles={{
                                input: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderColor: 'rgba(168, 85, 247, 0.2)',
                                    color: '#f8fafc',
                                },
                            }}
                        />
                        {deckInkOptions.length > 0 && (
                            <Select
                                size="xs"
                                value={inkFilter}
                                onChange={(val) =>
                                    onInkFilterChange(val || 'all')
                                }
                                data={[
                                    { value: 'all', label: 'All Inks' },
                                    ...deckInkOptions,
                                ]}
                                styles={{
                                    input: {
                                        backgroundColor:
                                            'rgba(15, 23, 42, 0.6)',
                                        borderColor: 'rgba(168, 85, 247, 0.2)',
                                        color: '#f8fafc',
                                    },
                                }}
                                style={{ width: 140 }}
                            />
                        )}
                    </Group>

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
                        <ScrollArea h={420} type="auto">
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
            </Stack>
        </Modal>
    );
}
