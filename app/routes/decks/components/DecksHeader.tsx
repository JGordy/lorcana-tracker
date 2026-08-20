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
import { IconCards, IconUpload, IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router';

export interface DecksHeaderProps {
    totalDecksCount: number;
    coreDecksCount: number;
    infinityDecksCount: number;
    user?: { $id: string } | null;
    onOpenImportModal: () => void;
}

export function DecksHeader({
    totalDecksCount,
    coreDecksCount,
    infinityDecksCount,
    user,
    onOpenImportModal,
}: DecksHeaderProps) {
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
                            Disney Lorcana Metagame Deck Matcher
                        </Title>
                    </Group>
                    <Text size="sm" c="gray.4" lh={1.6}>
                        Upload or manage your card collection inventory. Our
                        recommendation engine automatically scans meta decks,
                        displays the percentage of cards you own, and calculates
                        the exact missing card counts to optimize your next buy
                        list.
                    </Text>
                </Box>

                {/* Top Action CTAs */}
                <Group gap="sm">
                    {user && (
                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet.6', to: 'indigo.6' }}
                            radius="md"
                            leftSection={<IconUpload size={16} />}
                            onClick={onOpenImportModal}
                        >
                            Import Deck
                        </Button>
                    )}
                    <Button
                        component={Link}
                        to="/my-decks"
                        variant="subtle"
                        color="gray"
                        radius="md"
                        rightSection={<IconArrowRight size={16} />}
                    >
                        My Decks
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
                        Total Meta Decks
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
                        Core Constructed
                    </Text>
                    <Text size="xl" fw={800} c="teal.3" mt={4}>
                        {coreDecksCount}
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
                        Infinity Constructed
                    </Text>
                    <Text size="xl" fw={800} c="violet.3" mt={4}>
                        {infinityDecksCount}
                    </Text>
                </Card>
            </SimpleGrid>
        </Paper>
    );
}
