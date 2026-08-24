import {
    Paper,
    Group,
    TextInput,
    ActionIcon,
    Select,
    Button,
    Badge,
} from '@mantine/core';
import {
    IconSearch,
    IconX,
    IconArrowsSort,
    IconPlus,
    IconUpload,
    IconLayersIntersect,
    IconCheck,
} from '@tabler/icons-react';
import type { NavigateFunction } from 'react-router';

interface MyDecksToolbarProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    sort: string;
    navigate: NavigateFunction;
    activeCount: number;
    user?: { $id: string } | null;
    onOpenCreateModal: () => void;
    onOpenImportModal: () => void;
    onOpenAuditModal?: () => void;
    conflictCount?: number;
    physicallyBuiltCount?: number;
}

export function MyDecksToolbar({
    searchQuery,
    onSearchChange,
    sort,
    navigate,
    activeCount: _activeCount,
    user,
    onOpenCreateModal,
    onOpenImportModal,
    onOpenAuditModal,
    conflictCount = 0,
    physicallyBuiltCount = 0,
}: MyDecksToolbarProps) {
    return (
        <Paper
            p="sm"
            radius="lg"
            withBorder
            mb="lg"
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
            <Group justify="space-between" wrap="wrap" gap="sm" align="center">
                {/* Search Input */}
                <TextInput
                    placeholder="Search personal decks by name or notes..."
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

                {/* Actions, Sort & Active Counter */}
                <Group gap="xs" align="center" wrap="wrap">
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet.6', to: 'indigo.6' }}
                        radius="md"
                        size="sm"
                        leftSection={<IconPlus size={16} />}
                        onClick={onOpenCreateModal}
                        disabled={!user}
                    >
                        New Deck
                    </Button>
                    <Button
                        variant="light"
                        color="violet"
                        radius="md"
                        size="sm"
                        leftSection={<IconUpload size={16} />}
                        onClick={onOpenImportModal}
                    >
                        Import
                    </Button>

                    {onOpenAuditModal && (
                        <Button
                            variant="light"
                            color={conflictCount > 0 ? 'amber' : 'blue'}
                            radius="md"
                            size="sm"
                            leftSection={<IconLayersIntersect size={16} />}
                            rightSection={
                                physicallyBuiltCount > 0 ? (
                                    <Badge
                                        size="xs"
                                        variant="filled"
                                        color={
                                            conflictCount > 0
                                                ? 'amber.8'
                                                : 'teal.8'
                                        }
                                    >
                                        {conflictCount > 0 ? (
                                            `${conflictCount} Conflict${conflictCount === 1 ? '' : 's'}`
                                        ) : (
                                            <IconCheck size={10} />
                                        )}
                                    </Badge>
                                ) : undefined
                            }
                            onClick={onOpenAuditModal}
                        >
                            Deck Audit
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
                        onChange={(val) => {
                            if (val) {
                                navigate(`/my-decks?sort=${val}`);
                            }
                        }}
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
                </Group>
            </Group>
        </Paper>
    );
}
