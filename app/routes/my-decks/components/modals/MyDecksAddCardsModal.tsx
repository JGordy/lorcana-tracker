import { useState, useEffect } from 'react';
import {
    Modal,
    Stack,
    Group,
    TextInput,
    Select,
    Checkbox,
    Box,
    ScrollArea,
    ActionIcon,
    Text,
    Button,
    Badge,
    SimpleGrid,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconPlus, IconMinus } from '@tabler/icons-react';
import { ALL_INKS } from '../../../../types/lorcana';
import { LorcanaCardTile } from '../../../../components/LorcanaCardTile';

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
    deckInks?: string[];
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
    deckInks,
}: MyDecksAddCardsModalProps) {
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [debouncedSearch] = useDebouncedValue(localSearch, 150);
    const [displayLimit, setDisplayLimit] = useState(60);

    // Sync external searchQuery with local state when modal opens
    useEffect(() => {
        if (opened) {
            setLocalSearch(searchQuery);
            setDisplayLimit(60);
        }
    }, [opened, searchQuery]);

    // Notify parent of debounced search changes
    useEffect(() => {
        if (debouncedSearch !== searchQuery) {
            onSearchQueryChange(debouncedSearch);
            setDisplayLimit(60);
        }
    }, [debouncedSearch, searchQuery, onSearchQueryChange]);

    // Reset display limit when filters change
    useEffect(() => {
        setDisplayLimit(60);
    }, [inkFilter, typeFilter, onlyCoreFilter]);

    const totalCardsInDeck = Array.from(activeDeckCardsMap.values()).reduce(
        (acc, qty) => acc + qty,
        0,
    );

    const visibleCards = filteredCards.slice(0, displayLimit);
    const hasMoreCards = filteredCards.length > displayLimit;

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
                    <Text
                        fw={900}
                        size="lg"
                        style={{
                            fontFamily: "'Cinzel Decorative', Georgia, serif",
                            letterSpacing: '0.5px',
                            background:
                                'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Add Cards to Deck
                    </Text>
                    <Badge size="sm" variant="light" color="violet">
                        {totalCardsInDeck} Cards in Deck
                    </Badge>
                </Group>
            }
            size="1350px"
            radius="lg"
            centered
            zIndex={400}
            styles={{
                content: {
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '16px',
                    boxShadow:
                        '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.2)',
                },
                header: {
                    backgroundColor: '#0f172a',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                    paddingBottom: '12px',
                },
            }}
        >
            <Stack gap="md">
                <Group wrap="wrap" gap="xs">
                    <TextInput
                        placeholder="Search by card name..."
                        leftSection={<IconSearch size={16} />}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.currentTarget.value)}
                        style={{ flex: 1, minWidth: 220 }}
                        size="xs"
                        styles={{
                            input: {
                                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                borderColor: 'rgba(148, 163, 184, 0.2)',
                                color: '#f8fafc',
                            },
                        }}
                    />
                    <Select
                        size="xs"
                        value={inkFilter}
                        onChange={(val) => onInkFilterChange(val || 'all')}
                        data={[
                            ...(deckInks && deckInks.length > 0
                                ? [
                                      {
                                          value: 'deck',
                                          label: `Deck Inks (${deckInks
                                              .map(
                                                  (i) =>
                                                      i
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      i.slice(1).toLowerCase(),
                                              )
                                              .join(' / ')})`,
                                      },
                                  ]
                                : []),
                            { value: 'all', label: 'All Inks' },
                            ...ALL_INKS.map((ink) => ({
                                value: ink.id,
                                label: ink.name,
                            })),
                        ]}
                        style={{
                            minWidth:
                                deckInks && deckInks.length > 0 ? 180 : 140,
                        }}
                        comboboxProps={{ zIndex: 1000 }}
                        styles={{
                            input: {
                                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                borderColor: 'rgba(148, 163, 184, 0.2)',
                                color: '#f8fafc',
                            },
                            dropdown: {
                                backgroundColor: '#0f172a',
                                borderColor: 'rgba(168, 85, 247, 0.3)',
                            },
                        }}
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
                        style={{ width: 140 }}
                        comboboxProps={{ zIndex: 1000 }}
                        styles={{
                            input: {
                                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                borderColor: 'rgba(148, 163, 184, 0.2)',
                                color: '#f8fafc',
                            },
                            dropdown: {
                                backgroundColor: '#0f172a',
                                borderColor: 'rgba(168, 85, 247, 0.3)',
                            },
                        }}
                    />
                    <Checkbox
                        label="Core Only"
                        checked={onlyCoreFilter}
                        onChange={(e) =>
                            onOnlyCoreFilterChange(e.currentTarget.checked)
                        }
                        size="xs"
                        styles={{
                            label: { color: '#cbd5e1', fontWeight: 600 },
                        }}
                    />
                </Group>

                <Box
                    p="xs"
                    style={{
                        background: 'rgba(10, 15, 29, 0.55)',
                        borderRadius: 12,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                >
                    <ScrollArea
                        h="calc(75vh - 120px)"
                        type="auto"
                        offsetScrollbars
                    >
                        <SimpleGrid
                            cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }}
                            spacing="sm"
                        >
                            {visibleCards.map((card) => {
                                const cardId = card.id || card.$id;
                                const currentQty =
                                    activeDeckCardsMap.get(card.id) ||
                                    activeDeckCardsMap.get(card.$id) ||
                                    0;

                                return (
                                    <LorcanaCardTile
                                        key={cardId}
                                        card={card}
                                        aspectRatio="3/4"
                                        style={{
                                            backgroundImage:
                                                currentQty > 0
                                                    ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.18) 0%, rgba(15, 23, 42, 0.9) 100%)'
                                                    : 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.75) 100%)',
                                            borderColor:
                                                currentQty > 0
                                                    ? 'rgba(168, 85, 247, 0.6)'
                                                    : 'rgba(148, 163, 184, 0.15)',
                                            boxShadow:
                                                currentQty > 0
                                                    ? '0 0 14px rgba(168, 85, 247, 0.25)'
                                                    : 'none',
                                        }}
                                        headerOverlay={
                                            currentQty > 0 ? (
                                                <Badge
                                                    size="xs"
                                                    variant="filled"
                                                    color="violet"
                                                    style={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        boxShadow:
                                                            '0 2px 8px rgba(0,0,0,0.7)',
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    {currentQty} in Deck
                                                </Badge>
                                            ) : null
                                        }
                                    >
                                        {/* Info & Quantity Stepper */}
                                        <Stack
                                            gap="xs"
                                            p="xs"
                                            style={{
                                                flex: 1,
                                                justify: 'space-between',
                                            }}
                                        >
                                            <Box>
                                                <Text
                                                    fw={800}
                                                    size="xs"
                                                    c="gray.1"
                                                    lineClamp={1}
                                                >
                                                    {card.name}
                                                </Text>
                                                <Text
                                                    size="10px"
                                                    c="gray.5"
                                                    lineClamp={1}
                                                    mt={2}
                                                >
                                                    {card.set && card.number
                                                        ? `${card.set} • #${card.number}`
                                                        : card.set || ''}
                                                </Text>
                                            </Box>

                                            <Group
                                                gap={4}
                                                justify="space-between"
                                                align="center"
                                                style={{
                                                    background:
                                                        currentQty > 0
                                                            ? 'rgba(168, 85, 247, 0.18)'
                                                            : 'rgba(15, 23, 42, 0.8)',
                                                    padding: '4px 8px',
                                                    borderRadius: '20px',
                                                    border:
                                                        currentQty > 0
                                                            ? '1px solid rgba(168, 85, 247, 0.4)'
                                                            : '1px solid rgba(148, 163, 184, 0.12)',
                                                }}
                                            >
                                                <ActionIcon
                                                    size="xs"
                                                    radius="xl"
                                                    variant="subtle"
                                                    color="violet"
                                                    aria-label={`Decrease ${card.name}`}
                                                    disabled={currentQty <= 0}
                                                    onClick={() =>
                                                        onUpdateCardQty(
                                                            card.id || card.$id,
                                                            -1,
                                                        )
                                                    }
                                                >
                                                    <IconMinus size={10} />
                                                </ActionIcon>
                                                <Text
                                                    size="xs"
                                                    fw={800}
                                                    c={
                                                        currentQty > 0
                                                            ? 'violet.2'
                                                            : 'gray.5'
                                                    }
                                                    style={{
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {currentQty}
                                                </Text>
                                                <ActionIcon
                                                    size="xs"
                                                    radius="xl"
                                                    variant="subtle"
                                                    color="violet"
                                                    aria-label={`Increase ${card.name}`}
                                                    disabled={currentQty >= 4}
                                                    onClick={() =>
                                                        onUpdateCardQty(
                                                            card.id || card.$id,
                                                            1,
                                                        )
                                                    }
                                                >
                                                    <IconPlus size={10} />
                                                </ActionIcon>
                                            </Group>
                                        </Stack>
                                    </LorcanaCardTile>
                                );
                            })}
                        </SimpleGrid>

                        {hasMoreCards && (
                            <Group justify="center" my="md">
                                <Button
                                    size="xs"
                                    variant="outline"
                                    color="violet"
                                    onClick={() =>
                                        setDisplayLimit((prev) => prev + 60)
                                    }
                                >
                                    Load More Cards (
                                    {filteredCards.length - displayLimit}{' '}
                                    remaining)
                                </Button>
                            </Group>
                        )}
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
