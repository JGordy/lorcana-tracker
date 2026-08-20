import { Card, Group, ThemeIcon, Text, Button } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';

interface HomeDemoCalloutProps {
    onTriggerDemoLogin: () => void;
}

export function HomeDemoCallout({ onTriggerDemoLogin }: HomeDemoCalloutProps) {
    return (
        <Card
            padding="xl"
            radius="lg"
            withBorder
            mt={80}
            mx="auto"
            maw={720}
            style={{
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                borderColor: 'rgba(168, 85, 247, 0.25)',
                textAlign: 'center',
            }}
        >
            <Group justify="center" gap="xs" mb="xs">
                <ThemeIcon variant="transparent" color="violet.4">
                    <IconSparkles size={22} />
                </ThemeIcon>
                <Text fw={800} size="md" c="violet.3">
                    Ready to test it in action?
                </Text>
            </Group>
            <Text size="xs" c="gray.4" mb="lg" style={{ lineHeight: 1.6 }}>
                Try GlimmerForge instantly without creating an account. Launch
                an anonymous mock-user session pre-populated with sample cards
                to explore real-time recommendation calculations!
            </Text>
            <Button
                onClick={onTriggerDemoLogin}
                variant="gradient"
                gradient={{ from: 'violet.6', to: 'indigo.6' }}
                size="sm"
                fw={700}
            >
                Sign In & Seed Mock Collection
            </Button>
        </Card>
    );
}
