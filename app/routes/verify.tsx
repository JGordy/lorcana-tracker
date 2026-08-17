import type { Route } from './+types/verify';
import { Link, useLoaderData } from 'react-router';
import {
    Container,
    Title,
    Text,
    Button,
    Paper,
    Stack,
    ThemeIcon,
} from '@mantine/core';
import { IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import { authService } from '../services/auth.server';
import { Navbar } from '../components/Navbar';

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const userId = url.searchParams.get('userId');

    const user = await authService.getSessionUser(request);

    if (!secret || !userId) {
        return {
            success: false,
            message: 'Missing verification parameters in verification link.',
            user,
        };
    }

    try {
        await authService.verifyEmail({ userId, secret });
        return {
            success: true,
            message:
                'Your email address has been successfully verified! You now have full access.',
            user,
        };
    } catch (error: any) {
        console.error('Verification error:', error);
        return {
            success: false,
            message:
                error?.message ||
                'Failed to verify email. The link may have expired.',
            user,
        };
    }
}

export function meta() {
    return [{ title: 'Email Verification | GlimmerForge' }];
}

export default function Verify() {
    const { success, message, user } = useLoaderData<typeof loader>();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0b0c0e' }}>
            <Navbar user={user} />

            <Container size="xs" py={80}>
                <Paper
                    p="xl"
                    radius="md"
                    withBorder
                    style={{
                        backgroundColor: '#141517',
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
                            {success
                                ? 'Email Verified!'
                                : 'Verification Failed'}
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
            </Container>
        </div>
    );
}
