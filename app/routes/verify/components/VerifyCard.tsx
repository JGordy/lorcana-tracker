import { Link } from 'react-router';
import {
    Paper,
    Stack,
    ThemeIcon,
    Title,
    Text,
    Button,
} from '@mantine/core';
import { IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';

interface VerifyCardProps {
    success: boolean;
    message: string;
}

export function VerifyCard({ success, message }: VerifyCardProps) {
    return (
        <Paper
            p="xl"
            radius="md"
            withBorder
            style={{
                backgroundColor: 'var(--mantine-color-dark-8)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
            }}
        >
            <Stack align="center" gap="md">
                <ThemeIcon
                    size={64}
                    radius="xl"
                    variant="light"
                    color={success ? 'teal' : 'red'}
                >
                    {success ? (
                        <IconCircleCheck size={36} />
                    ) : (
                        <IconAlertCircle size={36} />
                    )}
                </ThemeIcon>

                <Title order={2} size="h3" c="gray.1">
                    {success ? 'Email Verified!' : 'Verification Failed'}
                </Title>

                <Text size="sm" c="gray.4" style={{ lineHeight: 1.6 }}>
                    {message}
                </Text>

                <Button
                    component={Link}
                    to="/collection"
                    mt="md"
                    variant="gradient"
                    gradient={{ from: 'violet.6', to: 'indigo.6' }}
                >
                    Go to My Collection
                </Button>
            </Stack>
        </Paper>
    );
}
