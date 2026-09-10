import {
    Drawer,
    Modal,
    Group,
    Text,
    Box,
    type ModalProps,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';

export interface ModalHeaderProps {
    icon?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    badge?: ReactNode;
    rightSection?: ReactNode;
    iconBg?: string;
    iconBorder?: string;
}

export function ModalHeader({
    icon,
    title,
    subtitle,
    badge,
    rightSection,
    iconBg,
    iconBorder,
}: ModalHeaderProps) {
    return (
        <Group
            justify="space-between"
            align="center"
            style={{ width: '100%' }}
            wrap="nowrap"
        >
            <Group
                gap="sm"
                align="center"
                wrap="nowrap"
                style={{ minWidth: 0 }}
            >
                {icon && (
                    <Box
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background:
                                iconBg ||
                                'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
                            border:
                                iconBorder ||
                                '1px solid rgba(168, 85, 247, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Box>
                )}
                <Box style={{ minWidth: 0 }}>
                    <Group gap="xs" align="center" wrap="nowrap">
                        {typeof title === 'string' ? (
                            <Text
                                fw={900}
                                size="md"
                                style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    letterSpacing: '0.5px',
                                    background:
                                        'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {title}
                            </Text>
                        ) : (
                            title
                        )}
                        {badge}
                    </Group>
                    {subtitle &&
                        (typeof subtitle === 'string' ? (
                            <Text
                                size="xs"
                                c="dimmed"
                                style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {subtitle}
                            </Text>
                        ) : (
                            subtitle
                        ))}
                </Box>
            </Group>
            {rightSection && (
                <Box style={{ flexShrink: 0 }}>{rightSection}</Box>
            )}
        </Group>
    );
}

export interface ResponsiveModalProps extends Omit<
    ModalProps,
    'styles' | 'title'
> {
    opened: boolean;
    onClose: () => void;
    title?: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    badge?: ReactNode;
    headerRightSection?: ReactNode;
    iconBg?: string;
    iconBorder?: string;
    children: ReactNode;
    size?: string | number;
    mobileDrawerSize?: string | number;
    withCloseButton?: boolean;
    styles?: any;
    [key: string]: any;
}

/**
 * ResponsiveModal renders a centered Mantine Modal dialog on desktop screens (>= 768px)
 * and a full-width bottom-sheet Mantine Drawer on mobile devices (< 768px).
 */
export function ResponsiveModal({
    opened,
    onClose,
    title,
    subtitle,
    icon,
    badge,
    headerRightSection,
    iconBg,
    iconBorder,
    children,
    size = 'lg',
    mobileDrawerSize = '90%',
    withCloseButton = true,
    styles,
    centered = true,
    radius = 'lg',
    zIndex = 300,
    ...rest
}: ResponsiveModalProps) {
    const isMobile = useMediaQuery('(max-width: 48em)', false, {
        getInitialValueInEffect: false,
    });

    const resolvedTitle =
        icon || subtitle || badge || headerRightSection ? (
            <ModalHeader
                icon={icon}
                title={title}
                subtitle={subtitle}
                badge={badge}
                rightSection={headerRightSection}
                iconBg={iconBg}
                iconBorder={iconBorder}
            />
        ) : (
            title
        );

    if (isMobile) {
        const {
            centered: _ignoredCentered,
            radius: _ignoredRadius,
            size: _ignoredDesktopSize,
            ...drawerRest
        } = rest;

        return (
            <Drawer
                opened={opened}
                onClose={onClose}
                position="bottom"
                size={mobileDrawerSize}
                zIndex={zIndex}
                radius={0}
                withCloseButton={withCloseButton}
                title={resolvedTitle}
                styles={{
                    ...styles,
                    content: {
                        background:
                            styles?.content?.background ||
                            'linear-gradient(180deg, #16122e 0%, #0d0a1a 100%)',
                        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
                        borderTop:
                            styles?.content?.borderTop ||
                            styles?.content?.border ||
                            '1px solid rgba(168, 85, 247, 0.35)',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                        ...styles?.content,
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                    },
                    header: {
                        background:
                            styles?.header?.background ||
                            'rgba(24, 20, 52, 0.95)',
                        borderBottom:
                            styles?.header?.borderBottom ||
                            '1px solid rgba(168, 85, 247, 0.2)',
                        padding: '12px 16px',
                        alignItems: 'flex-start',
                        ...styles?.header,
                    },
                    close: {
                        alignSelf: 'flex-start',
                        marginTop: 4,
                        ...styles?.close,
                    },
                    body: {
                        padding: '14px 16px',
                        ...styles?.body,
                    },
                }}
                {...(drawerRest as any)}
            >
                {children}
            </Drawer>
        );
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={resolvedTitle}
            size={size}
            centered={centered}
            zIndex={zIndex}
            radius={radius}
            withCloseButton={withCloseButton}
            styles={styles}
            {...rest}
        >
            {children}
        </Modal>
    );
}
