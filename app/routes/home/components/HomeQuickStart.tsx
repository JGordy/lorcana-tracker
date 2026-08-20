import {
    Stack,
    Title,
    Text,
    SimpleGrid,
    Card,
    ThemeIcon,
    Group,
    Box,
} from '@mantine/core';
import { IconPlus, IconSparkles, IconShoppingCart } from '@tabler/icons-react';

export function HomeQuickStart() {
    return (
        <Stack gap="xl" mt={90}>
            <Box style={{ textAlign: 'center' }}>
                <Text size="xs" fw={700} c="violet.4" tt="uppercase" lts={1}>
                    How It Works
                </Text>
                <Title order={2} size="h2" c="gray.1" fw={800} mt={4}>
                    From Booster Pack to Tournament Ready
                </Title>
                <Text size="xs" c="gray.4" max-width={550} mx="auto" mt={6}>
                    Get up and running in under three minutes with GlimmerForge&apos;s streamlined recommendation workflow.
                </Text>
            </Box>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                {/* Step 1 */}
                <Card
                    padding="lg"
                    radius="md"
                    bg="dark.8"
                    style={{
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                >
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon color="violet" variant="light" size="lg" radius="md">
                            <IconPlus size={20} />
                        </ThemeIcon>
                        <Text size="xs" fw={900} c="violet.4">
                            STEP 01
                        </Text>
                    </Group>
                    <Text fw={700} size="sm" c="gray.2" mb={4}>
                        1. Add Physical Cards
                    </Text>
                    <Text size="xs" c="gray.5" style={{ lineHeight: 1.5 }}>
                        Search card names or set numbers to log normal and foil quantities into your collection tracker.
                    </Text>
                </Card>

                {/* Step 2 */}
                <Card
                    padding="lg"
                    radius="md"
                    bg="dark.8"
                    style={{
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                >
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon color="indigo" variant="light" size="lg" radius="md">
                            <IconSparkles size={20} />
                        </ThemeIcon>
                        <Text size="xs" fw={900} c="indigo.4">
                            STEP 02
                        </Text>
                    </Group>
                    <Text fw={700} size="sm" c="gray.2" mb={4}>
                        2. Scan Meta Decks
                    </Text>
                    <Text size="xs" c="gray.5" style={{ lineHeight: 1.5 }}>
                        The recommendation engine automatically scans meta decks, showing your ownership percentage in real time.
                    </Text>
                </Card>

                {/* Step 3 */}
                <Card
                    padding="lg"
                    radius="md"
                    bg="dark.8"
                    style={{
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                >
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon color="teal" variant="light" size="lg" radius="md">
                            <IconShoppingCart size={20} />
                        </ThemeIcon>
                        <Text size="xs" fw={900} c="teal.4">
                            STEP 03
                        </Text>
                    </Group>
                    <Text fw={700} size="sm" c="gray.2" mb={4}>
                        3. Export Buy Lists
                    </Text>
                    <Text size="xs" c="gray.5" style={{ lineHeight: 1.5 }}>
                        See the exact missing cards needed to finish your next deck and copy formatted list exports for single card purchases.
                    </Text>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
