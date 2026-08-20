import {
    Card,
    Title,
    Text,
    Group,
    TextInput,
    Button,
    Select,
    Box,
    Stack,
} from '@mantine/core';
import { IconSearch, IconUpload } from '@tabler/icons-react';
import type { useNavigate } from 'react-router';

interface DecksHeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sort: string;
    navigate: ReturnType<typeof useNavigate>;
    user?: { $id: string } | null;
    onOpenImportModal: () => void;
}

export function DecksHeader({
    searchQuery,
    setSearchQuery,
    sort,
    navigate,
    user,
    onOpenImportModal,
}: DecksHeaderProps) {
    return (
        <>
            {/* Banner Hero */}
            <Card
                padding="xl"
                radius="lg"
                withBorder
                mb="xl"
                bg="dark.8"
                style={(theme) => ({
                    borderColor: theme.colors.dark[7],
                    position: 'relative',
                    overflow: 'hidden',
                })}
            >
                {/* Accent blurs */}
                <Box
                    style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '200px',
                        height: '200px',
                        backgroundColor: 'rgba(124, 58, 237, 0.05)',
                        filter: 'blur(50px)',
                        borderRadius: '100%',
                    }}
                />
                <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
                    <Title order={1} size="xl" fw={900}>
                        Disney Lorcana Metagame Deck Matcher
                    </Title>
                    <Text
                        size="sm"
                        c="gray.4"
                        maw={800}
                        style={{ lineHeight: 1.6 }}
                    >
                        Upload or manage your card collection inventory. Our
                        recommendation engine automatically scans meta
                        decks, displays the percentage of cards you own, and
                        calculates the exact missing card counts to optimize
                        your next buy list.
                    </Text>
                </Stack>
            </Card>

            {/* Filter Controls Row */}
            <Group justify="space-between" mb="lg" gap="md">
                <Group
                    gap="md"
                    style={{ flex: 1, maxWidth: 600 }}
                    align="end"
                >
                    <TextInput
                        placeholder="Search meta decks..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    {user && (
                        <Button
                            variant="light"
                            color="violet"
                            leftSection={<IconUpload size={16} />}
                            onClick={onOpenImportModal}
                        >
                            Import Deck
                        </Button>
                    )}
                </Group>

                <Select
                    label="Sort by:"
                    value={sort}
                    onChange={(val) => {
                        if (val) {
                            navigate(`/decks?sort=${val}`);
                        }
                    }}
                    data={[
                        { value: 'progress', label: 'Highest Match %' },
                        {
                            value: 'missing_cost',
                            label: 'Lowest Missing Count',
                        },
                        { value: 'name', label: 'Alphabetical (A-Z)' },
                    ]}
                    style={{ width: 220 }}
                />
            </Group>
        </>
    );
}
