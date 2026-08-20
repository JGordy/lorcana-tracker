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
    IconUpload,
} from '@tabler/icons-react';
import type { NavigateFunction } from 'react-router';

interface DecksToolbarProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    sort: string;
    navigate: NavigateFunction;
    activeCount: number;
    user?: { $id: string } | null;
    onOpenImportModal: () => void;
}

export function DecksToolbar({
    searchQuery,
    onSearchChange,
    sort,
    navigate,
    activeCount,
    user,
    onOpenImportModal,
}: DecksToolbarProps) {
    return (
        <Paper
            p="sm"
            radius="lg"
            withBorder
            mb="xl"
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
            <Group justify="space-between" wrap="wrap" gap="md" align="center">
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
                    style={{ flex: 1, minWidth: 260 }}
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
                <Group gap="sm" align="center">
                    {user && (
                        <Button
                            variant="light"
                            color="violet"
                            radius="md"
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
                                label: 'Lowest Missing Count',
                            },
                            { value: 'name', label: 'Alphabetical (A-Z)' },
                        ]}
                        value={sort}
                        onChange={(val) => {
                            if (val) {
                                navigate(`/decks?sort=${val}`);
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
                        style={{ width: 220 }}
                    />

                    <Badge
                        size="md"
                        variant="light"
                        color="violet"
                        style={{
                            height: 36,
                            padding: '0 12px',
                            borderRadius: 8,
                            fontWeight: 600,
                        }}
                    >
                        {activeCount} {activeCount === 1 ? 'Deck' : 'Decks'}
                    </Badge>
                </Group>
            </Group>
        </Paper>
    );
}
