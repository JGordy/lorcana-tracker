import { useState, useEffect } from 'react';
import { Link, useLocation, useSubmit } from 'react-router';
import {
    Container,
    Group,
    Button,
    Text,
    Box,
    Menu,
    Avatar,
    UnstyledButton,
} from '@mantine/core';
import {
    IconLogout,
    IconCards,
    IconDatabase,
    IconUser,
    IconLogin,
    IconFolder,
} from '@tabler/icons-react';
import { AuthModal } from './AuthModal';
import { MobileBottomNav } from './MobileBottomNav';

interface NavbarProps {
    user: {
        $id: string;
        email: string;
        name: string;
        emailVerification?: boolean;
    } | null;
}

export function Navbar({ user }: NavbarProps) {
    const location = useLocation();
    const submit = useSubmit();
    const [authModalOpened, setAuthModalOpened] = useState(false);

    useEffect(() => {
        if (user) {
            setAuthModalOpened(false);
        }
    }, [user]);

    const handleLogout = () => {
        submit(
            { intent: 'logout' },
            { method: 'post', action: '/logout', replace: true },
        );
    };

    return (
        <>
            <AuthModal
                opened={authModalOpened}
                onClose={() => setAuthModalOpened(false)}
            />
            <Box
                component="header"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.06)`,
                }}
            >
                <Container
                    fluid
                    px={{ base: 'sm', md: 'xl' }}
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Group
                        justify="space-between"
                        w="100%"
                        align="center"
                        wrap="nowrap"
                    >
                        {/* Logo */}
                        <Link
                            to="/"
                            style={{
                                textDecoration: 'none',
                                outline: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Group gap={8} align="center" wrap="nowrap">
                                <img
                                    src="/icon-transparent.png"
                                    alt="GlimmerForge"
                                    style={{
                                        height: 34,
                                        width: 'auto',
                                        display: 'block',
                                        border: 0,
                                        outline: 'none',
                                        flexShrink: 0,
                                    }}
                                />
                                <Text
                                    fw={800}
                                    style={{
                                        fontFamily:
                                            "'Cinzel Decorative', serif",
                                        letterSpacing: '0.8px',
                                        background:
                                            'linear-gradient(to right, #a78bfa, #ec4899, #f43f5e)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontSize: 'clamp(18px, 4vw, 22px)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    GlimmerForge
                                </Text>
                            </Group>
                        </Link>

                        {/* Desktop Navigation Links (Center / Spaced) */}
                        <Group gap="md" visibleFrom="md">
                            <Button
                                component={Link}
                                to="/decks"
                                variant={
                                    location.pathname === '/decks'
                                        ? 'light'
                                        : 'subtle'
                                }
                                color={
                                    location.pathname === '/decks'
                                        ? 'violet'
                                        : 'gray'
                                }
                                size="sm"
                                radius="md"
                                leftSection={<IconDatabase size={17} />}
                            >
                                Deck Directory
                            </Button>
                            <Button
                                component={Link}
                                to="/my-decks"
                                variant={
                                    location.pathname === '/my-decks'
                                        ? 'light'
                                        : 'subtle'
                                }
                                color={
                                    location.pathname === '/my-decks'
                                        ? 'violet'
                                        : 'gray'
                                }
                                size="sm"
                                radius="md"
                                leftSection={<IconFolder size={17} />}
                            >
                                My Decks
                            </Button>
                            <Button
                                component={Link}
                                to="/collection"
                                variant={
                                    location.pathname === '/collection'
                                        ? 'light'
                                        : 'subtle'
                                }
                                color={
                                    location.pathname === '/collection'
                                        ? 'violet'
                                        : 'gray'
                                }
                                size="sm"
                                radius="md"
                                leftSection={<IconCards size={17} />}
                            >
                                My Collection
                            </Button>
                        </Group>

                        {/* Right User Auth Section */}
                        <Group
                            gap="sm"
                            align="center"
                            wrap="nowrap"
                            style={{ flexShrink: 0 }}
                        >
                            {user ? (
                                <Group gap="sm" align="center" wrap="nowrap">
                                    <Box
                                        visibleFrom="sm"
                                        style={{ textAlign: 'right' }}
                                    >
                                        <Text size="xs" fw={700} c="gray.2">
                                            {user.name || user.email}
                                        </Text>
                                        <Text
                                            size="10px"
                                            c={
                                                user.emailVerification
                                                    ? 'teal.4'
                                                    : 'amber.4'
                                            }
                                        >
                                            {user.emailVerification
                                                ? '✓ Verified'
                                                : 'Pending Verification'}
                                        </Text>
                                    </Box>
                                    <Menu
                                        shadow="md"
                                        width={220}
                                        position="bottom-end"
                                        withinPortal
                                    >
                                        <Menu.Target>
                                            <UnstyledButton
                                                aria-label="User account menu"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    borderRadius: '9999px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <Avatar
                                                    color="violet"
                                                    radius="xl"
                                                    size="md"
                                                >
                                                    <IconUser size={18} />
                                                </Avatar>
                                            </UnstyledButton>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Label>
                                                Signed in as
                                            </Menu.Label>
                                            <Menu.Item disabled>
                                                <Text
                                                    size="xs"
                                                    fw={500}
                                                    truncate
                                                >
                                                    {user.email}
                                                </Text>
                                            </Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item
                                                color="red"
                                                leftSection={
                                                    <IconLogout size={14} />
                                                }
                                                onClick={handleLogout}
                                            >
                                                Sign Out
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            ) : (
                                <Button
                                    onClick={() => setAuthModalOpened(true)}
                                    variant="gradient"
                                    gradient={{
                                        from: 'violet.6',
                                        to: 'indigo.6',
                                    }}
                                    size="xs"
                                    radius="md"
                                    fw={700}
                                    leftSection={<IconLogin size={15} />}
                                    styles={{
                                        root: {
                                            paddingLeft: 12,
                                            paddingRight: 12,
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        },
                                    }}
                                >
                                    Sign In / Register
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Container>
            </Box>

            {/* Floating Mobile Bottom Navigation Bar */}
            <MobileBottomNav />
        </>
    );
}
