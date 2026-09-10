import { Drawer, Modal, type ModalProps } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';

export interface ResponsiveModalProps extends Omit<
    ModalProps,
    'styles' | 'title'
> {
    opened: boolean;
    onClose: () => void;
    title?: ReactNode;
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
                title={title}
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
            title={title}
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
