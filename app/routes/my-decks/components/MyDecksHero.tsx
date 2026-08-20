import {
    Paper,
    Group,
    Box,
    Title,
    Text,
    Button,
    SimpleGrid,
    Card,
} from '@mantine/core';
import {
    IconFolder,
    IconPlus,
    IconUpload,
    IconArrowRight,
} from '@tabler/icons-react';
import { Link } from 'react-router';

interface MyDecksHeroProps {
    totalDecksCount: number;
    readyToPlayCount: number;
    inProgressCount: number;
    onOpenCreateModal: () => void;
    onOpenImportModal: () => void;
}

export function MyDecksHero({
    totalDecksCount,
    readyToPlayCount,
    inProgressCount,
    onOpenCreateModal,
    onOpenImportModal,
}: MyDecksHeroProps) {
    return (
        <Paper
            p={{ base: 'lg', md: 'xl' }}
            radius="lg"
            mb="xl"
            style={{
                background:
                    'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
            }}
        >
            <Group
                justify="space-between"
                align="flex-start"
                wrap="wrap"
                gap="lg"
            >
                <Box style={{ maxWidth: 640 }}>
                    <Group gap="xs" mb="xs">
                        <IconFolder size={28} color="#a855f7" />
                        <Title
                            order={1}
                            style={{
                                fontFamily: "'Cinzel Decorative', serif",
                                letterSpacing: '0.5px',
                                fontSize: 28,
                                background:
                                    'linear-gradient(to right, #c084fc, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            My Decks
                        </Title>
                    </Group>
                    <Text size="sm" c="gray.4" lh={1.6}>
                        Build, customize, and manage your personal Lorcana
                        decks. Real-time inventory tracking automatically
                        computes missing cards, required quantities (1–4 copies
                        max), and total collection completion.
                    </Text>
                </Box>

                {/* Top Action CTAs */}
                <Group gap="sm">
                    <Button
                        variant="light"
                        color="violet"
                        radius="md"
                        leftSection={<IconPlus size={16} />}
                        onClick={onOpenCreateModal}
                    >
                        New Deck
                    </Button>
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet.6', to: 'indigo.6' }}
                        radius="md"
                        leftSection={<IconUpload size={16} />}
                        onClick={onOpenImportModal}
                    >
                        Import Decklist
                    </Button>
                    <Button
                        component={Link}
                        to="/decks"
                        variant="subtle"
                        color="gray"
                        radius="md"
                        rightSection={<IconArrowRight size={16} />}
                    >
                        Directory
                    </Button>
                </Group>
            </Group>

            {/* Metric Quick Stats */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="xl">
                <Card
                    padding="md"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.6)"
                    withBorder
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <Text size="xs" c="gray.5" fw={600} tt="uppercase">
                        Total Personal Decks
                    </Text>
                    <Text size="xl" fw={800} c="gray.1" mt={4}>
                        {totalDecksCount}
                    </Text>
                </Card>
                <Card
                    padding="md"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.6)"
                    withBorder
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <Text size="xs" c="teal.4" fw={600} tt="uppercase">
                        Ready to Play (100% Owned)
                    </Text>
                    <Text size="xl" fw={800} c="teal.3" mt={4}>
                        {readyToPlayCount}
                    </Text>
                </Card>
                <Card
                    padding="md"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.6)"
                    withBorder
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <Text size="xs" c="amber.4" fw={600} tt="uppercase">
                        Decks In-Progress
                    </Text>
                    <Text size="xl" fw={800} c="amber.3" mt={4}>
                        {inProgressCount}
                    </Text>
                </Card>
            </SimpleGrid>
        </Paper>
    );
}
