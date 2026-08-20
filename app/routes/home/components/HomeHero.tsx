import { Link } from 'react-router';
import {
    Stack,
    Box,
    Badge,
    Title,
    Text,
    Group,
    Button,
} from '@mantine/core';
import { IconArrowRight, IconCards, IconTrophy, IconChartBar } from '@tabler/icons-react';

export function HomeHero() {
    return (
        <Stack
            align="center"
            gap="lg"
            style={{ textAlign: 'center', position: 'relative' }}
        >
            {/* Subtle violet highlight blur background */}
            <Box
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '380px',
                    height: '380px',
                    backgroundColor: 'rgba(124, 58, 237, 0.12)',
                    filter: 'blur(90px)',
                    borderRadius: '100%',
                    zIndex: 0,
                }}
            />

            <Badge variant="filled" color="violet" size="lg" radius="xl">
                Lorcana Recommendation Engine
            </Badge>

            <Title
                order={1}
                size="h1"
                style={(theme) => ({
                    fontWeight: 900,
                    fontSize: '3.25rem',
                    lineHeight: 1.15,
                    background: `linear-gradient(135deg, ${theme.colors.violet[2]} 0%, ${theme.colors.pink[2]} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    zIndex: 1,
                })}
            >
                GlimmerForge
            </Title>

            <Text
                size="md"
                c="gray.4"
                maw={640}
                mx="auto"
                style={{ zIndex: 1, lineHeight: 1.65 }}
            >
                Stop guessing which decks you can build. Manage your physical collection card-by-card, and let GlimmerForge calculate ownership scores across meta decks instantly.
            </Text>

            {/* Feature Pills */}
            <Group justify="center" gap="sm" style={{ zIndex: 1 }} mt="xs">
                <Badge
                    size="sm"
                    variant="outline"
                    color="violet"
                    leftSection={<IconCards size={12} />}
                >
                    Full Catalog Support
                </Badge>
                <Badge
                    size="sm"
                    variant="outline"
                    color="teal"
                    leftSection={<IconTrophy size={12} />}
                >
                    Core & Infinity Legalities
                </Badge>
                <Badge
                    size="sm"
                    variant="outline"
                    color="indigo"
                    leftSection={<IconChartBar size={12} />}
                >
                    Real-Time Deck Matcher
                </Badge>
            </Group>

            <Group gap="md" mt="md" style={{ zIndex: 1 }}>
                <Button
                    component={Link}
                    to="/collection"
                    size="md"
                    variant="gradient"
                    gradient={{ from: 'violet.6', to: 'indigo.6' }}
                    rightSection={<IconArrowRight size={16} />}
                >
                    Manage My Collection
                </Button>
                <Button
                    component={Link}
                    to="/decks"
                    size="md"
                    variant="outline"
                    color="gray"
                >
                    Browse Public Decks
                </Button>
            </Group>
        </Stack>
    );
}
