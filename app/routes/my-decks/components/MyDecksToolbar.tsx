import {
    Paper,
    Group,
    TextInput,
    ActionIcon,
    Select,
    Badge,
} from '@mantine/core';
import { IconSearch, IconX, IconArrowsSort } from '@tabler/icons-react';
import type { NavigateFunction } from 'react-router';

interface MyDecksToolbarProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    sort: string;
    navigate: NavigateFunction;
    activeCount: number;
}

export function MyDecksToolbar({
    searchQuery,
    onSearchChange,
    sort,
    navigate,
    activeCount,
}: MyDecksToolbarProps) {
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

                {/* Right Controls: Sort & Active Counter */}
                <Group gap="sm" align="center">
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
                                label: 'Fewest Missing Cards',
                            },
                            { value: 'name', label: 'Deck Name (A-Z)' },
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
