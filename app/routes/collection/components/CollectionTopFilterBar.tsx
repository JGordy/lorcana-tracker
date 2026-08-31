import {
    Paper,
    Group,
    SegmentedControl,
    TextInput,
    ActionIcon,
    Tooltip,
    Box,
    Select,
} from '@mantine/core';
import { IconSearch, IconX, IconArrowsSort } from '@tabler/icons-react';

export interface CollectionTopFilterBarProps {
    selectedOwnership: string;
    setSelectedOwnership: (val: string) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    selectedInks: string[];
    setSelectedInks: React.Dispatch<React.SetStateAction<string[]>>;
    selectedSort?: string;
    setSelectedSort?: (val: string) => void;
}

const INK_LIST = [
    { name: 'Amber', color: '#F5B041' },
    { name: 'Amethyst', color: '#AF7AC5' },
    { name: 'Emerald', color: '#2ECC71' },
    { name: 'Ruby', color: '#EC7063' },
    { name: 'Sapphire', color: '#5DADE2' },
    { name: 'Steel', color: '#A6ACAF' },
];

export function CollectionTopFilterBar({
    selectedOwnership,
    setSelectedOwnership,
    searchQuery,
    setSearchQuery,
    selectedInks,
    setSelectedInks,
    selectedSort = 'default',
    setSelectedSort,
}: CollectionTopFilterBarProps) {
    return (
        <Paper
            p="xs"
            px="md"
            radius="lg"
            withBorder
            className="top-filter-bar"
            mb="md"
            style={{
                position: 'sticky',
                top: 76,
                zIndex: 30,
                background:
                    'linear-gradient(135deg, rgba(24, 20, 52, 0.9) 0%, rgba(12, 16, 33, 0.94) 100%)',
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(168, 85, 247, 0.25)',
                boxShadow:
                    '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 15px rgba(168, 85, 247, 0.08)',
            }}
        >
            <Group
                justify="space-between"
                align="center"
                gap="sm"
                wrap="nowrap"
            >
                {/* Compact Ownership SegmentedControl */}
                <SegmentedControl
                    value={
                        selectedOwnership === 'owned' ||
                        selectedOwnership === 'missing'
                            ? selectedOwnership
                            : selectedOwnership === 'all'
                              ? 'all'
                              : ''
                    }
                    onChange={(val) => {
                        if (val) setSelectedOwnership(val);
                    }}
                    data={[
                        { value: 'all', label: 'All' },
                        { value: 'owned', label: 'Owned' },
                        { value: 'missing', label: 'Missing' },
                    ]}
                    size="xs"
                    radius="md"
                    color="violet"
                    style={{ flexShrink: 0 }}
                    styles={{
                        root: {
                            backgroundColor: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            padding: 3,
                        },
                        indicator: {
                            boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)',
                        },
                        label: {
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                        },
                    }}
                />

                {/* Fluid Search Input with Clear Button */}
                <TextInput
                    placeholder="Search cards catalog..."
                    leftSection={<IconSearch size={15} color="#c084fc" />}
                    rightSection={
                        searchQuery ? (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                            >
                                <IconX size={13} />
                            </ActionIcon>
                        ) : null
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="xs"
                    style={{ flex: 1, minWidth: 140 }}
                    styles={{
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            borderColor: 'rgba(168, 85, 247, 0.2)',
                            color: '#f8fafc',
                            height: 36,
                        },
                    }}
                />

                {/* Sort Order Selector */}
                {setSelectedSort && (
                    <Select
                        size="xs"
                        value={selectedSort}
                        onChange={(val) => setSelectedSort(val || 'default')}
                        data={[
                            {
                                value: 'default',
                                label: 'Sort: Default (Set #)',
                            },
                            {
                                value: 'price_desc',
                                label: 'Sort: Price (High to Low)',
                            },
                            {
                                value: 'price_asc',
                                label: 'Sort: Price (Low to High)',
                            },
                            {
                                value: 'cost_asc',
                                label: 'Sort: Ink Cost (Low to High)',
                            },
                            {
                                value: 'cost_desc',
                                label: 'Sort: Ink Cost (High to Low)',
                            },
                            { value: 'name_asc', label: 'Sort: Name (A-Z)' },
                        ]}
                        allowDeselect={false}
                        leftSection={
                            <IconArrowsSort size={14} color="#a855f7" />
                        }
                        styles={{
                            input: {
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                borderColor: 'rgba(168, 85, 247, 0.2)',
                                color: '#f8fafc',
                                height: 36,
                                fontSize: 11,
                                fontWeight: 600,
                            },
                        }}
                        style={{ width: 175, flexShrink: 0 }}
                    />
                )}

                {/* Ink Colors Filter */}
                <Group
                    gap={6}
                    align="center"
                    style={{ flexShrink: 0 }}
                    wrap="nowrap"
                >
                    {INK_LIST.map((ink) => {
                        const isSelected = selectedInks.includes(ink.name);
                        const isDimmed = selectedInks.length > 0 && !isSelected;
                        const handleInkClick = () => {
                            if (isSelected) {
                                setSelectedInks((prev) =>
                                    prev.filter((name) => name !== ink.name),
                                );
                            } else if (selectedInks.length < 3) {
                                setSelectedInks((prev) => [...prev, ink.name]);
                            }
                        };
                        return (
                            <Tooltip
                                key={ink.name}
                                label={`${ink.name}${isSelected ? ' (Selected)' : ''}`}
                                withArrow
                                position="top"
                            >
                                <Box
                                    onClick={handleInkClick}
                                    style={{
                                        cursor:
                                            selectedInks.length >= 3 &&
                                            !isSelected
                                                ? 'not-allowed'
                                                : 'pointer',
                                        opacity: isDimmed ? 0.35 : 1,
                                        filter: isDimmed
                                            ? 'grayscale(80%)'
                                            : 'none',
                                        transform: isSelected
                                            ? 'scale(1.15)'
                                            : 'scale(1)',
                                        transition: 'all 0.2s ease',
                                        borderRadius: '50%',
                                        padding: 3,
                                        border: isSelected
                                            ? `2px solid ${ink.color}`
                                            : '2px solid transparent',
                                        backgroundColor: isSelected
                                            ? 'rgba(255,255,255,0.04)'
                                            : 'transparent',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <img
                                        src={`/inks/${ink.name.toLowerCase()}.svg`}
                                        alt={ink.name}
                                        style={{
                                            width: 22,
                                            height: 22,
                                            display: 'block',
                                        }}
                                    />
                                </Box>
                            </Tooltip>
                        );
                    })}
                    {selectedInks.length > 0 && (
                        <ActionIcon
                            size="sm"
                            radius="xl"
                            variant="subtle"
                            color="violet"
                            onClick={() => setSelectedInks([])}
                            title="Clear ink filters"
                            ml={2}
                        >
                            <IconX size={15} />
                        </ActionIcon>
                    )}
                </Group>
            </Group>
        </Paper>
    );
}
