import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import {
    TextInput,
    PasswordInput,
    Button,
    Stack,
    Text,
    Anchor,
    Alert,
    Group,
} from '@mantine/core';
import { ResponsiveModal } from './ResponsiveModal';
import {
    IconAlertCircle,
    IconCheck,
    IconMail,
    IconLock,
    IconUser,
    IconSparkles,
} from '@tabler/icons-react';

interface AuthModalProps {
    opened: boolean;
    onClose: () => void;
}

export function AuthModal({ opened, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const fetcher = useFetcher();

    const isSubmitting = fetcher.state === 'submitting';
    const actionData: any = fetcher.data;
    const isRegisteredSuccess = mode === 'register' && actionData?.success;

    useEffect(() => {
        if (mode === 'login' && actionData?.success) {
            onClose();
        }
    }, [actionData, mode, onClose]);

    const inputStyles = {
        label: {
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '13px',
            marginBottom: '4px',
        },
        input: {
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            borderColor: 'rgba(168, 85, 247, 0.25)',
            color: '#f8fafc',
            height: '42px',
            fontSize: '14px',
        },
    };

    return (
        <ResponsiveModal
            opened={opened}
            onClose={onClose}
            icon={<IconSparkles size={20} color="#c084fc" />}
            title={
                mode === 'login'
                    ? 'Sign In to GlimmerForge'
                    : 'Create GlimmerForge Account'
            }
            subtitle={
                mode === 'login'
                    ? 'Access your cloud collection and custom decks'
                    : 'Create an account to sync across devices'
            }
            mobileDrawerSize="auto"
            size="md"
            centered
            radius="lg"
            overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
        >
            {isRegisteredSuccess ? (
                <Stack gap="md" py="xs">
                    <Alert
                        icon={<IconCheck size={18} />}
                        title="Account Created!"
                        color="teal"
                        radius="md"
                    >
                        We&apos;ve sent a verification link to your email
                        address. Please click the link to verify your account!
                    </Alert>
                    <Button
                        fullWidth
                        onClick={onClose}
                        variant="light"
                        color="violet"
                        radius="md"
                        h={44}
                    >
                        Done
                    </Button>
                </Stack>
            ) : (
                <fetcher.Form method="post" action="/?index">
                    <input
                        type="hidden"
                        name="intent"
                        value={
                            mode === 'login' ? 'auth-login' : 'auth-register'
                        }
                    />

                    <Stack gap="md" py="xs">
                        {actionData?.error && (
                            <Alert
                                icon={<IconAlertCircle size={16} />}
                                color="red"
                                radius="md"
                                variant="light"
                            >
                                {actionData.error}
                            </Alert>
                        )}

                        {mode === 'register' && (
                            <TextInput
                                label="Full Name"
                                name="name"
                                placeholder="Illumineer Mickey"
                                required
                                radius="md"
                                leftSection={
                                    <IconUser size={16} color="#a855f7" />
                                }
                                styles={inputStyles}
                            />
                        )}

                        <TextInput
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            radius="md"
                            leftSection={<IconMail size={16} color="#a855f7" />}
                            styles={inputStyles}
                        />

                        <PasswordInput
                            label="Password"
                            name="password"
                            placeholder="Minimum 8 characters"
                            required
                            radius="md"
                            leftSection={<IconLock size={16} color="#a855f7" />}
                            styles={inputStyles}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            mt="xs"
                            h={44}
                            radius="md"
                            loading={isSubmitting}
                            variant="gradient"
                            gradient={{
                                from: 'violet.7',
                                to: 'indigo.6',
                                deg: 90,
                            }}
                            style={{
                                fontWeight: 800,
                                letterSpacing: '0.3px',
                                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)',
                            }}
                        >
                            {mode === 'login'
                                ? 'Sign In'
                                : 'Create Account & Send Verification'}
                        </Button>

                        <Group justify="center" gap="xs" mt={4}>
                            <Text size="xs" c="gray.4">
                                {mode === 'login'
                                    ? "Don't have an account?"
                                    : 'Already have an account?'}
                            </Text>
                            <Anchor
                                component="button"
                                type="button"
                                size="xs"
                                c="violet.4"
                                fw={700}
                                onClick={() =>
                                    setMode(
                                        mode === 'login' ? 'register' : 'login',
                                    )
                                }
                            >
                                {mode === 'login'
                                    ? 'Create Account'
                                    : 'Sign In'}
                            </Anchor>
                        </Group>
                    </Stack>
                </fetcher.Form>
            )}
        </ResponsiveModal>
    );
}
