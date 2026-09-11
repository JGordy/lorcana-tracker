import { Drawer, Group, Text, Button, Box, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconFilter, IconRefresh } from '@tabler/icons-react';
import {
    CollectionFiltersSidebar,
    type CollectionFiltersSidebarProps,
} from './CollectionFiltersSidebar';

export interface CollectionFiltersDrawerProps extends Omit<
    CollectionFiltersSidebarProps,
    'variant'
> {
    opened: boolean;
    onClose: () => void;
    totalFilteredCards?: number;
}

export function CollectionFiltersDrawer({
    opened,
    onClose,
    hasActiveFilters,
    handleResetFilters,
    totalFilteredCards,
    ...sidebarProps
}: CollectionFiltersDrawerProps) {
    const isMobile = useMediaQuery('(max-width: 48em)', false, {
        getInitialValueInEffect: false,
    });

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position={isMobile ? 'bottom' : 'right'}
            size={isMobile ? '90%' : 'min(88vw, 380px)'}
            radius={0}
            title={
                <Group
                    justify="space-between"
                    align="center"
                    style={{ width: '100%' }}
                >
                    <Group gap={8} align="center">
                        <IconFilter size={isMobile ? 20 : 18} color="#c084fc" />
                        <Text
                            size={isMobile ? 'md' : 'sm'}
                            fw={700}
                            c="gray.1"
                            style={{
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                            }}
                        >
                            Filters
                        </Text>
                    </Group>
                    {hasActiveFilters && (
                        <Button
                            size="compact-xs"
                            variant="subtle"
                            color="red"
                            leftSection={<IconRefresh size={12} />}
                            onClick={handleResetFilters}
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                height: 26,
                                paddingLeft: 8,
                                paddingRight: 8,
                            }}
                        >
                            Reset All
                        </Button>
                    )}
                </Group>
            }
            scrollAreaComponent={ScrollArea.Autosize}
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, rgba(24, 20, 52, 0.98) 0%, rgba(12, 16, 33, 0.99) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderLeft: isMobile
                        ? 'none'
                        : '1px solid rgba(168, 85, 247, 0.25)',
                    borderRight: 'none',
                    borderBottom: 'none',
                    borderTop: isMobile
                        ? '1px solid rgba(168, 85, 247, 0.35)'
                        : 'none',
                    borderTopLeftRadius: isMobile ? '16px' : 0,
                    borderTopRightRadius: isMobile ? '16px' : 0,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    boxShadow: isMobile
                        ? '0 -10px 40px rgba(0, 0, 0, 0.8)'
                        : undefined,
                    color: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                },
                header: {
                    background: 'rgba(24, 20, 52, 0.95)',
                    borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
                    padding: isMobile ? '14px 18px' : '14px 18px',
                },
                body: {
                    padding: isMobile ? '16px 18px' : '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                },
                close: {
                    color: '#c084fc',
                },
            }}
        >
            <Box style={{ flex: 1 }}>
                <CollectionFiltersSidebar
                    {...sidebarProps}
                    hasActiveFilters={hasActiveFilters}
                    handleResetFilters={handleResetFilters}
                    variant="drawer"
                />
            </Box>

            <Box
                pt="md"
                mt="md"
                style={{
                    borderTop: '1px solid rgba(168, 85, 247, 0.15)',
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'rgba(15, 17, 38, 0.98)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 10,
                    paddingBottom:
                        'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                }}
            >
                <Button
                    fullWidth
                    size={isMobile ? 'md' : 'sm'}
                    h={isMobile ? 48 : 40}
                    radius="md"
                    color="violet"
                    onClick={onClose}
                    style={{
                        backgroundColor: '#7c3aed',
                        backgroundImage:
                            'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        boxShadow: '0 4px 14px rgba(109, 40, 217, 0.4)',
                        fontWeight: 600,
                        fontSize: isMobile ? 15 : 13,
                    }}
                >
                    {totalFilteredCards !== undefined
                        ? `Apply Filters (${totalFilteredCards} cards)`
                        : 'Apply Filters'}
                </Button>
            </Box>
        </Drawer>
    );
}
