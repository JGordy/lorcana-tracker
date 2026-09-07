import {
    Paper,
    Group,
    Box,
    Title,
    Text,
    SimpleGrid,
    Card,
} from '@mantine/core';
import { IconFolder } from '@tabler/icons-react';

interface MyDecksHeroProps {
    totalDecksCount: number;
    readyToPlayCount: number;
    inProgressCount: number;
}

export function MyDecksHero({
    totalDecksCount,
    readyToPlayCount,
    inProgressCount,
}: MyDecksHeroProps) {
    return (
        <Paper
            p={{ base: 8, md: 'lg' }}
            radius="lg"
            mb={{ base: 8, md: 'md' }}
            style={{
                background:
                    'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
            }}
        >
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Box style={{ maxWidth: 540 }}>
                    <Group gap="xs" mb={{ base: 0, md: 4 }}>
                        <IconFolder size={22} color="#a855f7" />
                        <Title
                            order={1}
                            style={{
                                fontFamily: "'Cinzel Decorative', serif",
                                letterSpacing: '0.5px',
                                fontSize: 'clamp(18px, 4vw, 24px)',
                                background:
                                    'linear-gradient(to right, #c084fc, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            My Decks
                        </Title>
                    </Group>
                    <Text size="xs" c="gray.4" lh={1.4} visibleFrom="md">
                        Build, customize, and manage your personal Lorcana
                        decks. Real-time inventory tracking computes missing
                        cards and deck completion.
                    </Text>
                </Box>

                {/* Metric Quick Stats */}
                <SimpleGrid
                    cols={{ base: 3 }}
                    spacing={{ base: 6, sm: 'xs' }}
                    style={{ minWidth: 260, flex: '1 1 260px', maxWidth: 540 }}
                >
                    <Card
                        p={{ base: 6, md: 'xs' }}
                        radius="md"
                        bg="rgba(15, 23, 42, 0.6)"
                        withBorder
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                        <Text
                            c="gray.5"
                            fw={600}
                            tt="uppercase"
                            style={{ fontSize: 'clamp(9px, 2.5vw, 10px)' }}
                        >
                            Total Decks
                        </Text>
                        <Text
                            fz={{ base: 'sm', sm: 'lg' }}
                            fw={800}
                            c="gray.1"
                            mt={2}
                        >
                            {totalDecksCount}
                        </Text>
                    </Card>
                    <Card
                        p={{ base: 6, md: 'xs' }}
                        radius="md"
                        bg="rgba(15, 23, 42, 0.6)"
                        withBorder
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                        <Text
                            c="teal.4"
                            fw={600}
                            tt="uppercase"
                            style={{ fontSize: 'clamp(9px, 2.5vw, 10px)' }}
                        >
                            Ready (100%)
                        </Text>
                        <Text
                            fz={{ base: 'sm', sm: 'lg' }}
                            fw={800}
                            c="teal.3"
                            mt={2}
                        >
                            {readyToPlayCount}
                        </Text>
                    </Card>
                    <Card
                        p={{ base: 6, md: 'xs' }}
                        radius="md"
                        bg="rgba(15, 23, 42, 0.6)"
                        withBorder
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                        <Text
                            c="amber.4"
                            fw={600}
                            tt="uppercase"
                            style={{ fontSize: 'clamp(9px, 2.5vw, 10px)' }}
                        >
                            In-Progress
                        </Text>
                        <Text
                            fz={{ base: 'sm', sm: 'lg' }}
                            fw={800}
                            c="amber.3"
                            mt={2}
                        >
                            {inProgressCount}
                        </Text>
                    </Card>
                </SimpleGrid>
            </Group>
        </Paper>
    );
}
