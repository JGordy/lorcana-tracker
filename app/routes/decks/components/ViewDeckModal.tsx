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
    SimpleGrid,
    Card,
    Tooltip,
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
    IconShoppingCart,
} from '@tabler/icons-react';
import type { useFetcher } from 'react-router';
import { parseDeckMetadata } from '../../../utils/deck';
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
    onOpenShoppingList?: (deck: ProcessedDeck) => void;
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
    onOpenShoppingList,
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
                            variant="gradient"
                            gradient={{
                                from: 'violet.6',
                                to: 'pink.6',
                                deg: 90,
                            }}
                            size="xs"
                            leftSection={<IconShoppingCart size={14} />}
                            onClick={() => onOpenShoppingList?.(activeDeck)}
                        >
                            Shopping List
                            {activeDeck.progress.ownedCount <
                                activeDeck.progress.totalCount && (
                                <Badge
                                    size="xs"
                                    color="red"
                                    variant="filled"
                                    ml={6}
                                    style={{ fontWeight: 800 }}
                                >
                                    {activeDeck.progress.totalCount -
                                        activeDeck.progress.ownedCount}
                                </Badge>
                            )}
                        </Button>

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

                {/* Cards Visual Grid Gallery */}
                <Box
                    p="sm"
                    style={{
                        background: 'rgba(10, 15, 29, 0.55)',
                        borderRadius: 12,
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
                        <ScrollArea h={520} type="auto" offsetScrollbars>
                            <SimpleGrid
                                cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 5 }}
                                spacing="md"
                            >
                                {filteredCards.map((dc) => {
                                    const isMissing =
                                        dc.ownedQty < dc.requiredQty;
                                    const missingCount =
                                        dc.requiredQty - dc.ownedQty;
                                    const inkStyle = getInkBadgeStyle(
                                        dc.card.ink_color || '',
                                    );

                                    return (
                                        <Card
                                            key={dc.card.id}
                                            padding={10}
                                            radius="md"
                                            withBorder
                                            style={{
                                                backgroundColor:
                                                    'rgba(18, 22, 34, 0.85)',
                                                borderColor: `${inkStyle.color}40`,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                transition:
                                                    'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                                            }}
                                        >
                                            {/* Top: Card Image with floating status badge */}
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
                                                {dc.card.image_url ? (
                                                    <img
                                                        src={dc.card.image_url}
                                                        alt={dc.card.name}
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
                                                            {dc.card.name}
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
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        fontWeight: 900,
                                                        boxShadow:
                                                            '0 2px 8px rgba(0, 0, 0, 0.75)',
                                                        pointerEvents: 'none',
                                                    }}
                                                >
                                                    {isMissing
                                                        ? `Need ${missingCount}`
                                                        : '✓ Owned'}
                                                </Badge>
                                            </Box>

                                            {/* Bottom: Card Name, Ownership, & Quick Actions */}
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
                                                    {dc.card.name}
                                                </Text>

                                                <Group
                                                    justify="space-between"
                                                    align="center"
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
                                                                    ? dc.ownedQty >
                                                                      0
                                                                        ? 'orange.4'
                                                                        : 'red.4'
                                                                    : 'teal.4'
                                                            }
                                                        >
                                                            {dc.ownedQty}
                                                        </Text>
                                                        /{dc.requiredQty}
                                                    </Text>

                                                    {user && isMissing && (
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
                                                                        dc.card
                                                                            .id,
                                                                        dc.ownedQty,
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
                                            </Stack>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        </ScrollArea>
                    )}
                </Box>
            </Stack>
        </Modal>
    );
}
