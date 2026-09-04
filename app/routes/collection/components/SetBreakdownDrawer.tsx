import { useState, useMemo } from 'react';
import {
    Modal,
    Group,
    Box,
    Text,
    Badge,
    Card,
    Button,
    ScrollArea,
    Progress,
    TextInput,
    ActionIcon,
    SimpleGrid,
    Select,
} from '@mantine/core';
import {
    IconCards,
    IconSearch,
    IconX,
    IconFilter,
    IconCheck,
    IconChartBar,
} from '@tabler/icons-react';
import type { SetProgressStats } from '../../../utils/setCompletion';
import { formatCurrency } from '../../../utils/valuation';

export interface SetBreakdownModalProps {
    opened: boolean;
    onClose: () => void;
    setProgressStats: SetProgressStats[];
    selectedSet?: string;
    onSelectSet: (setName: string) => void;
}

export type SetBreakdownDrawerProps = SetBreakdownModalProps;

export function SetBreakdownModal({
    opened,
    onClose,
    setProgressStats,
    selectedSet = 'All',
    onSelectSet,
}: SetBreakdownModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('chronological');

    const totalSets = setProgressStats.length;
    const completedSetsCount = useMemo(
        () =>
            setProgressStats.filter((s) => s.completionPercentage === 100)
                .length,
        [setProgressStats],
    );

    const totalCardsCatalog = useMemo(
        () => setProgressStats.reduce((acc, s) => acc + s.totalCardsInSet, 0),
        [setProgressStats],
    );

    const totalUniqueOwned = useMemo(
        () => setProgressStats.reduce((acc, s) => acc + s.uniqueCardsOwned, 0),
        [setProgressStats],
    );

    const overallAvgCompletion =
        totalCardsCatalog > 0
            ? Math.round((totalUniqueOwned / totalCardsCatalog) * 100)
            : 0;

    const filteredAndSortedSets = useMemo(() => {
        let result = setProgressStats;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((s) =>
                s.setName.toLowerCase().includes(query),
            );
        }

        const sorted = [...result];
        if (sortBy === 'completion_desc') {
            sorted.sort(
                (a, b) => b.completionPercentage - a.completionPercentage,
            );
        } else if (sortBy === 'completion_asc') {
            sorted.sort(
                (a, b) => a.completionPercentage - b.completionPercentage,
            );
        } else if (sortBy === 'value_desc') {
            sorted.sort((a, b) => b.marketValue - a.marketValue);
        } else if (sortBy === 'name_asc') {
            sorted.sort((a, b) => a.setName.localeCompare(b.setName));
        }

        return sorted;
    }, [setProgressStats, searchQuery, sortBy]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            zIndex={300}
            size="960px"
            centered
            radius="lg"
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #16122e 0%, #0d0a1a 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    boxShadow:
                        '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 45px rgba(168, 85, 247, 0.15)',
                },
                header: {
                    background: 'rgba(18, 14, 38, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px 22px',
                },
                body: {
                    padding: '20px 22px',
                },
            }}
            title={
                <Group
                    justify="space-between"
                    align="center"
                    style={{ width: '100%' }}
                >
                    <Group gap="sm" align="center">
                        <Box
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '10px',
                                background:
                                    'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.2) 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconChartBar size={22} color="#c084fc" />
                        </Box>
                        <Box>
                            <Text
                                fw={900}
                                size="md"
                                style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    letterSpacing: '0.5px',
                                    background:
                                        'linear-gradient(to right, #c084fc, #f472b6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Set Progress Breakdown
                            </Text>
                            <Text size="xs" c="dimmed">
                                Completion tracking, unique card ratios, and
                                market valuation per set.
                            </Text>
                        </Box>
                    </Group>
                    <Badge
                        size="md"
                        variant="gradient"
                        gradient={{ from: 'violet.7', to: 'purple.8', deg: 90 }}
                        radius="sm"
                        style={{ fontWeight: 800 }}
                    >
                        {totalSets} Sets
                    </Badge>
                </Group>
            }
        >
            {/* Quick Overall Summary Metrics */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="md">
                <Card
                    p="sm"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.6)"
                    withBorder
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <Text size="10px" c="gray.5" fw={600} tt="uppercase">
                        Overall Catalog Progress
                    </Text>
                    <Text size="lg" fw={800} c="violet.3" mt={2}>
                        {overallAvgCompletion}%
                    </Text>
                    <Text size="xs" c="dimmed" mt={1}>
                        {totalUniqueOwned} / {totalCardsCatalog} Unique Cards
                    </Text>
                </Card>

                <Card
                    p="sm"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.6)"
                    withBorder
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <Text size="10px" c="teal.4" fw={600} tt="uppercase">
                        Mastered Sets (100%)
                    </Text>
                    <Text size="lg" fw={800} c="teal.3" mt={2}>
                        {completedSetsCount} / {totalSets}
                    </Text>
                    <Text size="xs" c="dimmed" mt={1}>
                        Sets fully completed
                    </Text>
                </Card>

                <Card
                    p="sm"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.6)"
                    withBorder
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <Text size="10px" c="yellow.4" fw={600} tt="uppercase">
                        Total Valuation
                    </Text>
                    <Text size="lg" fw={800} c="yellow.3" mt={2}>
                        {formatCurrency(
                            setProgressStats.reduce(
                                (acc, s) => acc + s.marketValue,
                                0,
                            ),
                        )}
                    </Text>
                    <Text size="xs" c="dimmed" mt={1}>
                        Combined collection value
                    </Text>
                </Card>
            </SimpleGrid>

            {/* Filter and Sort Toolbar */}
            <Group gap="sm" mb="md" wrap="wrap">
                <TextInput
                    placeholder="Search sets..."
                    leftSection={<IconSearch size={15} color="#a855f7" />}
                    rightSection={
                        searchQuery ? (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                            >
                                <IconX size={13} />
                            </ActionIcon>
                        ) : null
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="xs"
                    style={{ flex: 1, minWidth: 220 }}
                    styles={{
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            borderColor: 'rgba(168, 85, 247, 0.25)',
                            color: '#f8fafc',
                            height: 36,
                        },
                    }}
                />

                <Select
                    size="xs"
                    value={sortBy}
                    onChange={(val) => setSortBy(val || 'chronological')}
                    data={[
                        {
                            value: 'chronological',
                            label: 'Release Order (1–13+)',
                        },
                        {
                            value: 'completion_desc',
                            label: 'Completion: High to Low',
                        },
                        {
                            value: 'completion_asc',
                            label: 'Completion: Low to High',
                        },
                        {
                            value: 'value_desc',
                            label: 'Market Value: Highest',
                        },
                        { value: 'name_asc', label: 'Alphabetical (A–Z)' },
                    ]}
                    allowDeselect={false}
                    styles={{
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            borderColor: 'rgba(168, 85, 247, 0.25)',
                            color: '#f8fafc',
                            height: 36,
                            width: 195,
                        },
                    }}
                />
            </Group>

            {/* Scrollable Sets Grid */}
            <ScrollArea.Autosize mah="58vh" offsetScrollbars>
                {filteredAndSortedSets.length === 0 ? (
                    <Card
                        p="xl"
                        radius="md"
                        bg="rgba(15, 23, 42, 0.4)"
                        style={{ textAlign: 'center' }}
                    >
                        <IconCards
                            size={32}
                            color="#64748b"
                            style={{ margin: '0 auto 8px' }}
                        />
                        <Text size="sm" fw={600} c="gray.4">
                            No sets match your search
                        </Text>
                        <Text size="xs" c="dimmed">
                            Try modifying your search query.
                        </Text>
                    </Card>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        {filteredAndSortedSets.map((set) => {
                            const isComplete = set.completionPercentage === 100;
                            const isFiltered = selectedSet === set.setName;

                            return (
                                <Card
                                    key={set.setName}
                                    p="md"
                                    radius="md"
                                    bg="rgba(15, 23, 42, 0.7)"
                                    withBorder
                                    style={{
                                        borderColor: isFiltered
                                            ? '#a855f7'
                                            : isComplete
                                              ? 'rgba(46, 204, 113, 0.4)'
                                              : 'rgba(255, 255, 255, 0.08)',
                                        borderWidth: isFiltered ? 1.5 : 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        {/* Set Title Row */}
                                        <Group
                                            justify="space-between"
                                            align="center"
                                            mb="xs"
                                            wrap="nowrap"
                                        >
                                            <Group
                                                gap="xs"
                                                wrap="nowrap"
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <Badge
                                                    size="xs"
                                                    variant="outline"
                                                    color={
                                                        set.setIndex !==
                                                        undefined
                                                            ? 'violet'
                                                            : 'pink'
                                                    }
                                                    style={{ flexShrink: 0 }}
                                                >
                                                    {set.setIndex !== undefined
                                                        ? `Set ${set.setIndex}`
                                                        : 'Promo'}
                                                </Badge>
                                                <Text
                                                    fw={700}
                                                    size="sm"
                                                    c="gray.1"
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                    }}
                                                    title={set.setName}
                                                >
                                                    {set.setName}
                                                </Text>
                                            </Group>

                                            <Badge
                                                size="sm"
                                                variant={
                                                    isComplete
                                                        ? 'filled'
                                                        : set.completionPercentage >
                                                            0
                                                          ? 'light'
                                                          : 'outline'
                                                }
                                                color={
                                                    isComplete
                                                        ? 'teal'
                                                        : set.completionPercentage >
                                                            0
                                                          ? 'violet'
                                                          : 'gray'
                                                }
                                                leftSection={
                                                    isComplete ? (
                                                        <IconCheck size={12} />
                                                    ) : undefined
                                                }
                                                style={{ flexShrink: 0 }}
                                            >
                                                {set.completionPercentage}%
                                            </Badge>
                                        </Group>

                                        {/* Progress Bar */}
                                        <Box mb="sm">
                                            <Progress
                                                value={set.completionPercentage}
                                                size="sm"
                                                radius="xl"
                                                color={
                                                    isComplete
                                                        ? 'teal'
                                                        : set.completionPercentage >=
                                                            50
                                                          ? 'violet'
                                                          : 'indigo'
                                                }
                                                styles={{
                                                    root: {
                                                        backgroundColor:
                                                            'rgba(255, 255, 255, 0.08)',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </div>

                                    {/* Stats & Action Row */}
                                    <Group
                                        justify="space-between"
                                        align="center"
                                        wrap="wrap"
                                        gap="xs"
                                        mt="xs"
                                    >
                                        <Group gap="xs" wrap="nowrap">
                                            <Text size="11px" c="gray.4">
                                                <Text
                                                    component="span"
                                                    fw={700}
                                                    c={
                                                        set.uniqueCardsOwned > 0
                                                            ? 'gray.2'
                                                            : 'gray.5'
                                                    }
                                                >
                                                    {set.uniqueCardsOwned}
                                                </Text>
                                                {' / '}
                                                {set.totalCardsInSet} Unique
                                            </Text>
                                            <Text size="11px" c="gray.5">
                                                •
                                            </Text>
                                            <Text size="11px" c="pink.3">
                                                {set.foilCardsOwned} Foil
                                                {set.foilCardsOwned === 1
                                                    ? ''
                                                    : 's'}
                                            </Text>
                                            <Text size="11px" c="gray.5">
                                                •
                                            </Text>
                                            <Text
                                                size="11px"
                                                fw={700}
                                                c="yellow.3"
                                            >
                                                {formatCurrency(
                                                    set.marketValue,
                                                )}
                                            </Text>
                                        </Group>

                                        <Button
                                            size="xs"
                                            variant={
                                                isFiltered ? 'filled' : 'light'
                                            }
                                            color={
                                                isFiltered ? 'violet' : 'gray'
                                            }
                                            leftSection={
                                                <IconFilter size={12} />
                                            }
                                            onClick={() => {
                                                onSelectSet(set.setName);
                                                onClose();
                                            }}
                                            style={{
                                                height: 26,
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {isFiltered
                                                ? 'Active Filter'
                                                : 'Filter Set'}
                                        </Button>
                                    </Group>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                )}
            </ScrollArea.Autosize>
        </Modal>
    );
}

export const SetBreakdownDrawer = SetBreakdownModal;
