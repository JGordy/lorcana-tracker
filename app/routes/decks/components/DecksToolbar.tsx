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
            p="sm"
            radius="lg"
            withBorder
            mb="md"
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
                    gap="sm"
                    align="center"
                >
                    {/* Search Input */}
                    <TextInput
                        placeholder="Search meta decks..."
                        leftSection={<IconSearch size={16} color="#c084fc" />}
                        rightSection={
                            searchQuery ? (
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => onSearchChange('')}
                                    title="Clear search"
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            ) : null
                        }
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.currentTarget.value)}
                        style={{ flex: '1 1 220px', minWidth: 200 }}
                        styles={{
                            input: {
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                borderColor: 'rgba(168, 85, 247, 0.2)',
                                color: '#f8fafc',
                            },
                        }}
                        radius="md"
                    />

                    {/* Right Controls: Import Button, Sort Dropdown & Active Counter */}
                    <Group gap="xs" align="center" wrap="wrap">
                        {user && (
                            <Button
                                variant="light"
                                color="violet"
                                radius="md"
                                size="sm"
                                leftSection={<IconUpload size={16} />}
                                onClick={onOpenImportModal}
                            >
                                Import Deck
                            </Button>
                        )}

                        <Select
                            leftSection={
                                <IconArrowsSort size={15} color="#c084fc" />
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
                                },
                            }}
                            radius="md"
                            style={{ width: 175 }}
                        />

                        <Badge
                            size="md"
                            variant="light"
                            color="violet"
                            style={{
                                height: 36,
                                padding: '0 10px',
                                borderRadius: 8,
                                fontWeight: 600,
                            }}
                        >
                            {activeCount} {activeCount === 1 ? 'Deck' : 'Decks'}
                        </Badge>
                    </Group>
                </Group>

                {/* Buildability / Completion Filter Segmented Control */}
                <Group
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap="xs"
                >
                    <Group gap={6} align="center">
                        <IconFilter size={14} color="#a855f7" />
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
                                    label: `All Decks (${completionCounts?.all ?? activeCount})`,
                                },
                                {
                                    value: 'ready',
                                    label: `Ready to Play (${completionCounts?.ready ?? 0})`,
                                },
                                {
                                    value: 'near',
                                    label: `Near Complete (${completionCounts?.near ?? 0})`,
                                },
                                {
                                    value: 'in_progress',
                                    label: `In Progress (${completionCounts?.in_progress ?? 0})`,
                                },
                            ]}
                            styles={{
                                root: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                },
                                indicator: {
                                    backgroundColor: 'rgba(168, 85, 247, 0.35)',
                                    border: '1px solid rgba(168, 85, 247, 0.5)',
                                },
                                label: {
                                    color: '#cbd5e1',
                                    fontWeight: 600,
                                    fontSize: 11,
                                    padding: '4px 8px',
                                },
                            }}
                        />
                    </Group>
                </Group>
            </Stack>
        </Paper>
    );
}
