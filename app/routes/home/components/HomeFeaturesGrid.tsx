import {
    SimpleGrid,
    Card,
    ThemeIcon,
    Text,
    Group,
    Badge,
    Box,
    Progress,
} from '@mantine/core';
import { IconCards, IconDatabase, IconFilter } from '@tabler/icons-react';

export function HomeFeaturesGrid() {
    return (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mt={70}>
            {/* Feature 1 */}
            <Card
                padding="xl"
                radius="lg"
                withBorder
                style={{
                    backgroundColor: 'var(--mantine-color-dark-8)',
                    backgroundImage:
                        'linear-gradient(180deg, rgba(30, 27, 75, 0.35) 0%, rgba(15, 23, 42, 0.75) 100%)',
                    borderColor: 'rgba(168, 85, 247, 0.25)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                }}
            >
                <Box mb="md">
                    <Group justify="space-between" align="flex-start" mb="md">
                        <ThemeIcon
                            size="xl"
                            radius="md"
                            variant="light"
                            color="violet"
                        >
                            <IconCards size={24} />
                        </ThemeIcon>
                        <Group gap={4}>
                            <Badge size="xs" variant="filled" color="violet">
                                Normal
                            </Badge>
                            <Badge
                                size="xs"
                                variant="gradient"
                                gradient={{ from: 'indigo.4', to: 'violet.4' }}
                            >
                                ✨ Foil
                            </Badge>
                        </Group>
                    </Group>

                    <Text fw={800} size="lg" mb="xs" c="gray.1">
                        Catalog Collection
                    </Text>
                    <Text size="xs" c="gray.4" style={{ lineHeight: 1.6 }}>
                        Log both normal and foil card copies from physical
                        Lorcana booster packs. Everything syncs instantly to
                        your secure inventory.
                    </Text>
                </Box>

                {/* Decorative Visual Accent */}
                <Box
                    p="xs"
                    style={{
                        background: 'rgba(10, 15, 29, 0.6)',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Text size="11px" c="dimmed" fw={600}>
                            Sample: Elsa - Spirit of Winter
                        </Text>
                        <Badge size="xs" color="violet" variant="light">
                            4 Owned (1 Foil)
                        </Badge>
                    </Group>
                </Box>
            </Card>

            {/* Feature 2 */}
            <Card
                padding="xl"
                radius="lg"
                withBorder
                style={{
                    backgroundColor: 'var(--mantine-color-dark-8)',
                    backgroundImage:
                        'linear-gradient(180deg, rgba(30, 27, 75, 0.35) 0%, rgba(15, 23, 42, 0.75) 100%)',
                    borderColor: 'rgba(168, 85, 247, 0.25)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                }}
            >
                <Box mb="md">
                    <Group justify="space-between" align="flex-start" mb="md">
                        <ThemeIcon
                            size="xl"
                            radius="md"
                            variant="light"
                            color="indigo"
                        >
                            <IconDatabase size={24} />
                        </ThemeIcon>
                        <Badge size="xs" color="teal" variant="light">
                            Auto Matching
                        </Badge>
                    </Group>

                    <Text fw={800} size="lg" mb="xs" c="gray.1">
                        Progress Matcher
                    </Text>
                    <Text size="xs" c="gray.4" style={{ lineHeight: 1.6 }}>
                        Our matching loop maps inventory card counts directly
                        against competitive metagame deck recipes to compute
                        real-time completion scores.
                    </Text>
                </Box>

                {/* Decorative Visual Accent */}
                <Box
                    p="xs"
                    style={{
                        background: 'rgba(10, 15, 29, 0.6)',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <Group justify="space-between" mb={4}>
                        <Text size="11px" c="gray.3" fw={700}>
                            Amber Ruby Aggro
                        </Text>
                        <Text size="11px" c="teal.4" fw={700}>
                            54 / 60 (90%)
                        </Text>
                    </Group>
                    <Progress value={90} color="teal" size="xs" radius="xl" />
                </Box>
            </Card>

            {/* Feature 3 */}
            <Card
                padding="xl"
                radius="lg"
                withBorder
                style={{
                    backgroundColor: 'var(--mantine-color-dark-8)',
                    backgroundImage:
                        'linear-gradient(180deg, rgba(30, 27, 75, 0.35) 0%, rgba(15, 23, 42, 0.75) 100%)',
                    borderColor: 'rgba(168, 85, 247, 0.25)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                }}
            >
                <Box mb="md">
                    <Group justify="space-between" align="flex-start" mb="md">
                        <ThemeIcon
                            size="xl"
                            radius="md"
                            variant="light"
                            color="grape"
                        >
                            <IconFilter size={24} />
                        </ThemeIcon>
                        <Badge size="xs" color="grape" variant="light">
                            Buy List Engine
                        </Badge>
                    </Group>

                    <Text fw={800} size="lg" mb="xs" c="gray.1">
                        Smart Sort & Buy List
                    </Text>
                    <Text size="xs" c="gray.4" style={{ lineHeight: 1.6 }}>
                        Filter decks by highest completion percentage or lowest
                        missing card count. Generate exact missing card lists
                        instantly for your next buy.
                    </Text>
                </Box>

                {/* Decorative Visual Accent */}
                <Box
                    p="xs"
                    style={{
                        background: 'rgba(10, 15, 29, 0.6)',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Text size="11px" c="dimmed" fw={600}>
                            Missing Cards Summary
                        </Text>
                        <Badge size="xs" color="red" variant="light">
                            Need 6 Cards to Play
                        </Badge>
                    </Group>
                </Box>
            </Card>
        </SimpleGrid>
    );
}
