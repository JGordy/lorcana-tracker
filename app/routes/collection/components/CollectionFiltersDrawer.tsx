import { Drawer, Group, Text, Button, Box, ScrollArea } from '@mantine/core';
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
    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="min(88vw, 380px)"
            title={
                <Group
                    justify="space-between"
                    align="center"
                    style={{ width: '100%' }}
                >
                    <Group gap={8} align="center">
                        <IconFilter size={18} color="#c084fc" />
                        <Text
                            size="sm"
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
                            leftSection={<IconRefresh size={11} />}
                            onClick={handleResetFilters}
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                height: 22,
                                paddingLeft: 6,
                                paddingRight: 6,
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
                    borderLeft: '1px solid rgba(168, 85, 247, 0.25)',
                    color: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                },
                header: {
                    background: 'rgba(24, 20, 52, 0.95)',
                    borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
                    padding: '14px 18px',
                },
                body: {
                    padding: '16px',
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
                    backgroundColor: 'rgba(15, 17, 38, 0.95)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10,
                }}
            >
                <Button
                    fullWidth
                    size="sm"
                    radius="md"
                    color="violet"
                    onClick={onClose}
                    style={{
                        backgroundColor: '#7c3aed',
                        backgroundImage:
                            'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        boxShadow: '0 4px 14px rgba(109, 40, 217, 0.4)',
                        fontWeight: 600,
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
