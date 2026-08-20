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

export interface CollectionHeaderProps {
    totals: {
        totalCardsOwned: number;
        uniqueCardsCount: number;
    };
    totalCatalogCards: number;
}

export function CollectionHeader({
    totals,
    totalCatalogCards,
}: CollectionHeaderProps) {
    const completionPercentage =
        totalCatalogCards > 0
            ? Math.round((totals.uniqueCardsCount / totalCatalogCards) * 100)
            : 0;

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
                        <IconCards size={28} color="#a855f7" />
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
                            My Collection
                        </Title>
                    </Group>
                    <Text size="sm" c="gray.4" lh={1.6}>
                        Track your Lorcana cards (foil & non-foil counts) here.
                        Changes save instantly and automatically update deck
                        percentages.
                    </Text>
                </Box>
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
                        Total Cards Owned
                    </Text>
                    <Text size="xl" fw={800} c="gray.1" mt={4}>
                        {totals.totalCardsOwned}
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
                        Unique Cards Owned
                    </Text>
                    <Text size="xl" fw={800} c="teal.3" mt={4}>
                        {totals.uniqueCardsCount}
                    </Text>
                </Card>
                <Card
                    padding="md"
                    radius="md"
                    bg="rgba(15, 23, 42, 0.6)"
                    withBorder
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <Text size="xs" c="violet.4" fw={600} tt="uppercase">
                        Catalog Completion
                    </Text>
                    <Text size="xl" fw={800} c="violet.3" mt={4}>
                        {`${completionPercentage}%`}
                        <Text
                            component="span"
                            size="xs"
                            c="dimmed"
                            fw={500}
                            ml={6}
                        >
                            ({totals.uniqueCardsCount} / {totalCatalogCards})
                        </Text>
                    </Text>
                </Card>
            </SimpleGrid>
        </Paper>
    );
}
