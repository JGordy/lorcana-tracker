import {
    Paper,
    Group,
    TextInput,
    ActionIcon,
    Select,
    Button,
    Badge,
    SegmentedControl,
    Stack,
    Text,
} from '@mantine/core';
import {
    IconSearch,
    IconX,
    IconArrowsSort,
    IconUpload,
    IconFilter,
} from '@tabler/icons-react';
import type { NavigateFunction } from 'react-router';
import type { CompletionFilter } from '../utils/deckHelpers';

interface DecksToolbarProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    sort: string;
    completion: CompletionFilter;
    onCompletionChange: (val: CompletionFilter) => void;
    completionCounts?: {
        all: number;
        ready: number;
        near: number;
        in_progress: number;
    };
    navigate: NavigateFunction;
    activeCount: number;
    user?: { $id: string } | null;
    onOpenImportModal: () => void;
}

export function DecksToolbar({
    searchQuery,
    onSearchChange,
    sort,
    completion,
    onCompletionChange,
    completionCounts,
    navigate,
    activeCount,
    user,
    onOpenImportModal,
}: DecksToolbarProps) {
    const handleSortChange = (newSort: string | null) => {
        if (!newSort) return;
        const params = new URLSearchParams();
        params.set('sort', newSort);
        if (completion && completion !== 'all') {
            params.set('completion', completion);
        }
        navigate(`/decks?${params.toString()}`);
    };

    return (
        <Paper
            p={{ base: 6, md: 'sm' }}
            radius="lg"
            withBorder
            mb={{ base: 'xs', md: 'md' }}
            style={{
                position: 'sticky',
                top: 76,
                zIndex: 30,
                background:
                    'linear-gradient(135deg, rgba(24, 20, 52, 0.88) 0%, rgba(12, 16, 33, 0.92) 100%)',
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(168, 85, 247, 0.25)',
                boxShadow:
                    '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 15px rgba(168, 85, 247, 0.08)',
            }}
        >
            <Stack gap="xs">
                <Group
                    justify="space-between"
                    wrap="wrap"
                    gap="xs"
                    align="center"
                >
                    {/* Search Input */}
                    <TextInput
                        placeholder="Search meta decks..."
                        leftSection={<IconSearch size={14} color="#c084fc" />}
                        rightSection={
                            searchQuery ? (
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => onSearchChange('')}
                                    title="Clear search"
                                >
                                    <IconX size={12} />
                                </ActionIcon>
                            ) : null
                        }
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.currentTarget.value)}
                        style={{ flex: '1 1 200px', minWidth: 160 }}
                        styles={{
                            input: {
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                borderColor: 'rgba(168, 85, 247, 0.2)',
                                color: '#f8fafc',
                                height: 32,
                                fontSize: 12,
                            },
                        }}
                        radius="md"
                    />

                    {/* Controls: Sort Dropdown, Active Counter & Import Button */}
                    <Group
                        gap={6}
                        align="center"
                        wrap="nowrap"
                        style={{ flexShrink: 0 }}
                    >
                        <Select
                            leftSection={
                                <IconArrowsSort size={13} color="#c084fc" />
                            }
                            data={[
                                {
                                    value: 'progress',
                                    label: 'Highest Match %',
                                },
                                {
                                    value: 'missing_cost',
                                    label: 'Fewest Missing',
                                },
                                { value: 'name', label: 'Alphabetical (A-Z)' },
                            ]}
                            value={sort}
                            onChange={handleSortChange}
                            styles={{
                                input: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderColor: 'rgba(168, 85, 247, 0.2)',
                                    color: '#f8fafc',
                                    height: 28,
                                    fontSize: 10.5,
                                    paddingLeft: 24,
                                    paddingRight: 16,
                                },
                            }}
                            radius="md"
                            style={{ width: 155 }}
                        />

                        <Badge
                            size="sm"
                            variant="light"
                            color="violet"
                            style={{
                                height: 28,
                                padding: '0 8px',
                                borderRadius: 6,
                                fontWeight: 600,
                                fontSize: 11,
                            }}
                        >
                            {activeCount} {activeCount === 1 ? 'Deck' : 'Decks'}
                        </Badge>

                        {user && (
                            <Button
                                variant="light"
                                color="violet"
                                radius="md"
                                size="xs"
                                leftSection={<IconUpload size={13} />}
                                onClick={onOpenImportModal}
                                styles={{
                                    root: {
                                        height: 28,
                                        fontSize: 11,
                                        paddingLeft: 8,
                                        paddingRight: 8,
                                    },
                                }}
                            >
                                <Text component="span" visibleFrom="xs">
                                    Import Deck
                                </Text>
                                <Text component="span" hiddenFrom="xs">
                                    Import
                                </Text>
                            </Button>
                        )}
                    </Group>
                </Group>

                {/* Buildability / Completion Filter Segmented Control */}
                <Group
                    justify="flex-start"
                    align="center"
                    wrap="nowrap"
                    gap={6}
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    <IconFilter
                        size={13}
                        color="#a855f7"
                        style={{ flexShrink: 0 }}
                    />
                    <SegmentedControl
                        size="xs"
                        radius="md"
                        value={completion}
                        onChange={(val) =>
                            onCompletionChange(val as CompletionFilter)
                        }
                        data={[
                            {
                                value: 'all',
                                label: (
                                    <>
                                        <Text component="span" visibleFrom="xs">
                                            All Decks (
                                            {completionCounts?.all ??
                                                activeCount}
                                            )
                                        </Text>
                                        <Text component="span" hiddenFrom="xs">
                                            All (
                                            {completionCounts?.all ??
                                                activeCount}
                                            )
                                        </Text>
                                    </>
                                ),
                            },
                            {
                                value: 'ready',
                                label: (
                                    <>
                                        <Text component="span" visibleFrom="xs">
                                            Ready to Play (
                                            {completionCounts?.ready ?? 0})
                                        </Text>
                                        <Text component="span" hiddenFrom="xs">
                                            Ready (
                                            {completionCounts?.ready ?? 0})
                                        </Text>
                                    </>
                                ),
                            },
                            {
                                value: 'near',
                                label: (
                                    <>
                                        <Text component="span" visibleFrom="xs">
                                            Near Complete (
                                            {completionCounts?.near ?? 0})
                                        </Text>
                                        <Text component="span" hiddenFrom="xs">
                                            Near ({completionCounts?.near ?? 0})
                                        </Text>
                                    </>
                                ),
                            },
                            {
                                value: 'in_progress',
                                label: (
                                    <>
                                        <Text component="span" visibleFrom="xs">
                                            In Progress (
                                            {completionCounts?.in_progress ?? 0}
                                            )
                                        </Text>
                                        <Text component="span" hiddenFrom="xs">
                                            Progress (
                                            {completionCounts?.in_progress ?? 0}
                                            )
                                        </Text>
                                    </>
                                ),
                            },
                        ]}
                        styles={{
                            root: {
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                padding: 2,
                                width: '100%',
                            },
                            indicator: {
                                backgroundColor: 'rgba(168, 85, 247, 0.35)',
                                border: '1px solid rgba(168, 85, 247, 0.5)',
                            },
                            label: {
                                color: '#cbd5e1',
                                fontWeight: 600,
                                fontSize: 10.5,
                                padding: '3px 6px',
                            },
                        }}
                    />
                </Group>
            </Stack>
        </Paper>
    );
}
