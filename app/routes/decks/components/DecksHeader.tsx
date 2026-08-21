import {
    Paper,
    Group,
    Box,
    Title,
    Text,
    SimpleGrid,
    Card,
} from '@mantine/core';
import { IconCards } from '@tabler/icons-react';

export interface DecksHeaderProps {
    totalDecksCount: number;
    coreDecksCount: number;
    infinityDecksCount: number;
}

export function DecksHeader({
    totalDecksCount,
    coreDecksCount,
    infinityDecksCount,
}: DecksHeaderProps) {
    return (
        <Paper
            p={{ base: 'md', md: 'lg' }}
            radius="lg"
            mb="md"
            style={{
                background:
                    'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
            }}
        >
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <Box style={{ maxWidth: 540 }}>
                    <Group gap="xs" mb={4}>
                        <IconCards size={24} color="#a855f7" />
                        <Title
                            order={1}
                            style={{
                                fontFamily: "'Cinzel Decorative', serif",
                                letterSpacing: '0.5px',
                                fontSize: 24,
                                background:
                                    'linear-gradient(to right, #c084fc, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Disney Lorcana Metagame Deck Matcher
                        </Title>
                    </Group>
                    <Text size="xs" c="gray.4" lh={1.5}>
                        Scan and match tournament meta decks against your
                        collection. Computes owned percentage and missing card
                        counts in real time.
                    </Text>
                </Box>

                {/* Metric Quick Stats */}
                <SimpleGrid
                    cols={{ base: 3 }}
                    spacing="xs"
                    style={{ minWidth: 320, flex: '1 1 320px', maxWidth: 540 }}
                >
                    <Card
                        padding="xs"
                        radius="md"
                        bg="rgba(15, 23, 42, 0.6)"
                        withBorder
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                        <Text size="10px" c="gray.5" fw={600} tt="uppercase">
                            Total Decks
                        </Text>
                        <Text size="lg" fw={800} c="gray.1" mt={2}>
                            {totalDecksCount}
                        </Text>
                    </Card>
                    <Card
                        padding="xs"
                        radius="md"
                        bg="rgba(15, 23, 42, 0.6)"
                        withBorder
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                        <Text size="10px" c="teal.4" fw={600} tt="uppercase">
                            Core
                        </Text>
                        <Text size="lg" fw={800} c="teal.3" mt={2}>
                            {coreDecksCount}
                        </Text>
                    </Card>
                    <Card
                        padding="xs"
                        radius="md"
                        bg="rgba(15, 23, 42, 0.6)"
                        withBorder
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                        <Text size="10px" c="violet.4" fw={600} tt="uppercase">
                            Infinity
                        </Text>
                        <Text size="lg" fw={800} c="violet.3" mt={2}>
                            {infinityDecksCount}
                        </Text>
                    </Card>
                </SimpleGrid>
            </Group>
        </Paper>
    );
}
