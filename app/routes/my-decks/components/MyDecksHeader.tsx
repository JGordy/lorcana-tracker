import {
    Card,
    Stack,
    Title,
    Text,
    Group,
    TextInput,
    Select,
    Button,
    Badge,
    SimpleGrid,
} from '@mantine/core';
import {
    IconSearch,
    IconPlus,
    IconUpload,
    IconFolder,
    IconCheck,
    IconCards,
} from '@tabler/icons-react';
import type { NavigateFunction } from 'react-router';

interface MyDecksHeaderProps {
    totalDecksCount: number;
    readyToPlayCount: number;
    inProgressCount: number;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    sort: string;
    navigate: NavigateFunction;
    user?: { $id: string } | null;
    onOpenCreateModal: () => void;
    onOpenImportModal: () => void;
}

export function MyDecksHeader({
    totalDecksCount,
    readyToPlayCount,
    inProgressCount,
    searchQuery,
    onSearchChange,
    sort,
    navigate,
    user,
    onOpenCreateModal,
    onOpenImportModal,
}: MyDecksHeaderProps) {
    return (
        <Stack gap="lg" mb="xl">
            {/* Header Hero Banner */}
            <Card
                padding="xl"
                radius="lg"
                withBorder
                style={{
                    backgroundColor: 'var(--mantine-color-dark-8)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
            >
                <Group
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap="md"
                >
                    <Stack gap={4}>
                        <Group gap="xs">
                            <IconFolder size={28} color="#a855f7" />
                            <Title order={1} size="h2" c="gray.1" fw={900}>
                                My Custom Decks
                            </Title>
                        </Group>
                        <Text size="xs" c="gray.4" max-width={600}>
                            Build, import, and optimize your personal Lorcana
                            decklists against your live card inventory.
                        </Text>
                    </Stack>

                    <Group gap="xs">
                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet.6', to: 'indigo.6' }}
                            leftSection={<IconPlus size={16} />}
                            onClick={onOpenCreateModal}
                            disabled={!user}
                        >
                            Create Deck
                        </Button>
                        <Button
                            variant="light"
                            color="violet"
                            leftSection={<IconUpload size={16} />}
                            onClick={onOpenImportModal}
                        >
                            Import List
                        </Button>
                    </Group>
                </Group>
            </Card>

            {/* Quick Metrics Bar */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <Card padding="md" radius="md" bg="dark.8" withBorder>
                    <Group justify="space-between" align="center">
                        <Stack gap={2}>
                            <Text
                                size="11px"
                                c="dimmed"
                                fw={700}
                                tt="uppercase"
                            >
                                Total Decks
                            </Text>
                            <Text size="xl" fw={900} c="gray.1">
                                {totalDecksCount}
                            </Text>
                        </Stack>
                        <Badge
                            size="lg"
                            variant="light"
                            color="violet"
                            leftSection={<IconCards size={14} />}
                        >
                            Saved Decks
                        </Badge>
                    </Group>
                </Card>

                <Card padding="md" radius="md" bg="dark.8" withBorder>
                    <Group justify="space-between" align="center">
                        <Stack gap={2}>
                            <Text
                                size="11px"
                                c="dimmed"
                                fw={700}
                                tt="uppercase"
                            >
                                Ready to Play
                            </Text>
                            <Text size="xl" fw={900} c="teal.4">
                                {readyToPlayCount}
                            </Text>
                        </Stack>
                        <Badge
                            size="lg"
                            variant="light"
                            color="teal"
                            leftSection={<IconCheck size={14} />}
                        >
                            100% Owned
                        </Badge>
                    </Group>
                </Card>

                <Card padding="md" radius="md" bg="dark.8" withBorder>
                    <Group justify="space-between" align="center">
                        <Stack gap={2}>
                            <Text
                                size="11px"
                                c="dimmed"
                                fw={700}
                                tt="uppercase"
                            >
                                In Progress
                            </Text>
                            <Text size="xl" fw={900} c="yellow.4">
                                {inProgressCount}
                            </Text>
                        </Stack>
                        <Badge size="lg" variant="light" color="yellow">
                            Building
                        </Badge>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Search & Sort Controls */}
            <Group justify="space-between" align="end" wrap="wrap">
                <TextInput
                    placeholder="Search my custom decks..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                    style={{ flex: 1, minWidth: 260 }}
                />

                <Select
                    label="Sort by:"
                    value={sort}
                    onChange={(val) => {
                        if (val) {
                            navigate(`/my-decks?sort=${val}`);
                        }
                    }}
                    data={[
                        { value: 'progress', label: 'Highest Progress First' },
                        {
                            value: 'missing_cost',
                            label: 'Lowest Missing Cards',
                        },
                        { value: 'name', label: 'Alphabetical (A-Z)' },
                    ]}
                    style={{ width: 220 }}
                />
            </Group>
        </Stack>
    );
}
