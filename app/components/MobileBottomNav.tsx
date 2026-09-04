import { Link, useLocation } from 'react-router';
import { Box, Group, Text, UnstyledButton } from '@mantine/core';
import { IconDatabase, IconFolder, IconCards } from '@tabler/icons-react';

export interface MobileNavItem {
    label: string;
    to: string;
    icon: React.ComponentType<{
        size?: number;
        color?: string;
        style?: React.CSSProperties;
    }>;
}

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
    {
        label: 'Decks',
        to: '/decks',
        icon: IconDatabase,
    },
    {
        label: 'My Decks',
        to: '/my-decks',
        icon: IconFolder,
    },
    {
        label: 'Collection',
        to: '/collection',
        icon: IconCards,
    },
];

export function MobileBottomNav() {
    const location = useLocation();

    return (
        <Box
            component="nav"
            aria-label="Mobile navigation"
            hiddenFrom="md"
            style={{
                position: 'fixed',
                bottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 90,
                width: 'calc(100% - 32px)',
                maxWidth: 380,
                background:
                    'linear-gradient(135deg, rgba(20, 16, 46, 0.94) 0%, rgba(10, 12, 28, 0.96) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 9999,
                padding: '5px 8px',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                boxShadow:
                    '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
        >
            <Group justify="space-around" align="center" gap={4} wrap="nowrap">
                {MOBILE_NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.to;
                    const Icon = item.icon;

                    return (
                        <UnstyledButton
                            key={item.to}
                            component={Link}
                            to={item.to}
                            aria-current={isActive ? 'page' : undefined}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '8px 10px',
                                borderRadius: 9999,
                                textDecoration: 'none',
                                background: isActive
                                    ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                                    : 'transparent',
                                color: isActive
                                    ? '#ffffff'
                                    : 'rgba(226, 232, 240, 0.75)',
                                boxShadow: isActive
                                    ? '0 2px 10px rgba(109, 40, 217, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : 'none',
                                transition:
                                    'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            <Icon
                                size={17}
                                color={isActive ? '#ffffff' : '#c084fc'}
                                style={{ flexShrink: 0 }}
                            />
                            <Text
                                size="xs"
                                fw={isActive ? 700 : 500}
                                style={{
                                    letterSpacing: '0.2px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.label}
                            </Text>
                        </UnstyledButton>
                    );
                })}
            </Group>
        </Box>
    );
}
