import {
    Modal,
    Stack,
    Group,
    TextInput,
    Select,
    Checkbox,
    Box,
    ScrollArea,
    Table,
    ActionIcon,
    Text,
    Button,
    Badge,
} from '@mantine/core';
import { IconSearch, IconPlus, IconMinus } from '@tabler/icons-react';
import { ALL_INKS } from '../../../../types/lorcana';

interface MyDecksAddCardsModalProps {
    opened: boolean;
    onClose: () => void;
    searchQuery: string;
    onSearchQueryChange: (val: string) => void;
    inkFilter: string;
    onInkFilterChange: (val: string) => void;
    typeFilter: string;
    onTypeFilterChange: (val: string) => void;
    onlyCoreFilter: boolean;
    onOnlyCoreFilterChange: (val: boolean) => void;
    filteredCards: any[];
    activeDeckCardsMap: Map<string, number>;
    onUpdateCardQty: (cardId: string, delta: number) => void;
}

export function MyDecksAddCardsModal({
    opened,
    onClose,
    searchQuery,
    onSearchQueryChange,
    inkFilter,
    onInkFilterChange,
    typeFilter,
    onTypeFilterChange,
    onlyCoreFilter,
    onOnlyCoreFilterChange,
    filteredCards,
    activeDeckCardsMap,
    onUpdateCardQty,
}: MyDecksAddCardsModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Add Cards to Deck"
            size="xl"
            radius="lg"
            centered
        >
            <Stack gap="md">
                <Group wrap="wrap" gap="xs">
                    <TextInput
                        placeholder="Search by card name..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) =>
                            onSearchQueryChange(e.currentTarget.value)
                        }
                        style={{ flex: 1, minWidth: 200 }}
                        size="xs"
                    />
                    <Select
                        size="xs"
                        value={inkFilter}
                        onChange={(val) => onInkFilterChange(val || 'all')}
                        data={[
                            { value: 'all', label: 'All Inks' },
                            ...ALL_INKS.map((ink) => ({
                                value: ink.id,
                                label: ink.name,
                            })),
                        ]}
                        style={{ width: 130 }}
                    />
                    <Select
                        size="xs"
                        value={typeFilter}
                        onChange={(val) => onTypeFilterChange(val || 'all')}
                        data={[
                            { value: 'all', label: 'All Types' },
                            { value: 'Character', label: 'Character' },
                            { value: 'Action', label: 'Action' },
                            { value: 'Item', label: 'Item' },
                            { value: 'Location', label: 'Location' },
                        ]}
                        style={{ width: 130 }}
                    />
                    <Checkbox
                        label="Core Only"
                        checked={onlyCoreFilter}
                        onChange={(e) =>
                            onOnlyCoreFilterChange(e.currentTarget.checked)
                        }
                        size="xs"
                    />
                </Group>

                <Box
                    p="xs"
                    style={{
                        background: 'rgba(10, 15, 29, 0.55)',
                        borderRadius: 10,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                >
                    <ScrollArea h={380} type="auto">
                        <Table highlightOnHover style={{ minWidth: 600 }}>
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
                                        In Deck (0–4)
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredCards.map((card) => {
                                    const currentQty =
                                        activeDeckCardsMap.get(card.id) ||
                                        activeDeckCardsMap.get(card.$id) ||
                                        0;
                                    const inkSlug = ALL_INKS.some(
                                        (i) =>
                                            i.id ===
                                            (card.ink_color || '')
                                                .toLowerCase()
                                                .trim(),
                                    )
                                        ? card.ink_color.toLowerCase().trim()
                                        : 'amber';

                                    return (
                                        <Table.Tr key={card.id || card.$id}>
                                            <Table.Td>
                                                <Group gap="xs" wrap="nowrap">
                                                    {card.image_url && (
                                                        <img
                                                            src={card.image_url}
                                                            alt={card.name}
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
                                                            {card.set} • #
                                                            {card.number}
                                                        </Text>
                                                    </Box>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={6} wrap="nowrap">
                                                    <img
                                                        src={`/inks/${inkSlug}.svg`}
                                                        alt={card.ink_color}
                                                        style={{
                                                            width: 16,
                                                            height: 16,
                                                        }}
                                                    />
                                                    <Text size="xs" c="gray.3">
                                                        {card.ink_color ||
                                                            'Amber'}
                                                    </Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td
                                                style={{ textAlign: 'center' }}
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
                                                style={{ textAlign: 'center' }}
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
                                                style={{ textAlign: 'center' }}
                                            >
                                                <Group gap={4} justify="center">
                                                    <ActionIcon
                                                        size="xs"
                                                        variant="light"
                                                        color="violet"
                                                        aria-label={`Decrease ${card.name}`}
                                                        disabled={
                                                            currentQty <= 0
                                                        }
                                                        onClick={() =>
                                                            onUpdateCardQty(
                                                                card.id ||
                                                                    card.$id,
                                                                -1,
                                                            )
                                                        }
                                                    >
                                                        <IconMinus size={12} />
                                                    </ActionIcon>
                                                    <Text
                                                        size="xs"
                                                        fw={800}
                                                        style={{
                                                            width: 20,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {currentQty}
                                                    </Text>
                                                    <ActionIcon
                                                        size="xs"
                                                        variant="light"
                                                        color="violet"
                                                        aria-label={`Increase ${card.name}`}
                                                        disabled={
                                                            currentQty >= 4
                                                        }
                                                        onClick={() =>
                                                            onUpdateCardQty(
                                                                card.id ||
                                                                    card.$id,
                                                                1,
                                                            )
                                                        }
                                                    >
                                                        <IconPlus size={12} />
                                                    </ActionIcon>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Box>

                <Group justify="flex-end" mt="xs">
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet.6', to: 'indigo.6' }}
                        onClick={onClose}
                    >
                        Done Adding Cards
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
