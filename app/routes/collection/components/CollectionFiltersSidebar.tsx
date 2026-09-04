import {
    Paper,
    Group,
    Text,
    Stack,
    Box,
    Select,
    Badge,
    Progress,
} from '@mantine/core';
import type { SetProgressStats } from '../../../utils/setCompletion';

export interface CollectionFiltersSidebarProps {
    selectedOwnership: string;
    setSelectedOwnership: (val: string) => void;
    selectedSet: string;
    setSelectedSet: (val: string) => void;
    sets: string[];
    setProgressMap?: Map<string, SetProgressStats>;
    selectedRarity: string;
    setSelectedRarity: (val: string) => void;
    selectedCost: string;
    setSelectedCost: (val: string) => void;
    selectedInkable: string;
    setSelectedInkable: (val: string) => void;
    selectedFormat: string;
    setSelectedFormat: (val: string) => void;
    selectedType: string;
    setSelectedType: (val: string) => void;
    selectedClassification: string;
    setSelectedClassification: (val: string) => void;
    allClassifications: string[];
    selectedFranchise: string;
    setSelectedFranchise: (val: string) => void;
    allFranchises: string[];
    selectedAttack: string;
    setSelectedAttack: (val: string) => void;
    selectedDefense: string;
    setSelectedDefense: (val: string) => void;
    selectedLore: string;
    setSelectedLore: (val: string) => void;
    selectedSort?: string;
    setSelectedSort?: (val: string) => void;
    selectedPriceRange?: string;
    setSelectedPriceRange?: (val: string) => void;
    hasActiveFilters: boolean;
    handleResetFilters: () => void;
}

export function CollectionFiltersSidebar({
    selectedOwnership,
    setSelectedOwnership,
    selectedSet,
    setSelectedSet,
    sets,
    setProgressMap,
    selectedRarity,
    setSelectedRarity,
    selectedCost,
    setSelectedCost,
    selectedInkable,
    setSelectedInkable,
    selectedFormat,
    setSelectedFormat,
    selectedType,
    setSelectedType,
    selectedClassification,
    setSelectedClassification,
    allClassifications,
    selectedFranchise,
    setSelectedFranchise,
    allFranchises,
    selectedAttack,
    setSelectedAttack,
    selectedDefense,
    setSelectedDefense,
    selectedLore,
    setSelectedLore,
    selectedSort = 'default',
    setSelectedSort,
    selectedPriceRange = 'All',
    setSelectedPriceRange,
    hasActiveFilters,
    handleResetFilters,
}: CollectionFiltersSidebarProps) {
    return (
        <Stack gap="md" className="filters-sidebar">
            <Paper
                p="md"
                radius="lg"
                withBorder
                className="filters-sidebar-card"
                style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderColor: 'rgba(168, 85, 247, 0.15)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <Group justify="space-between" mb="xs">
                    <Text
                        size="xs"
                        fw={700}
                        c="dimmed"
                        style={{
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        Filters
                    </Text>
                    {hasActiveFilters && (
                        <Text
                            size="xs"
                            c="violet.4"
                            fw={700}
                            style={{ cursor: 'pointer' }}
                            onClick={handleResetFilters}
                        >
                            Reset All
                        </Text>
                    )}
                </Group>

                <Stack gap="sm" mt="xs">
                    {/* Sort Order */}
                    {setSelectedSort && (
                        <Box>
                            <Text size="11px" fw={600} c="gray.4" mb={4}>
                                Sort Order
                            </Text>
                            <Select
                                placeholder="Default (Set #)"
                                data={[
                                    {
                                        value: 'default',
                                        label: 'Default (Set & Number)',
                                    },
                                    {
                                        value: 'price_desc',
                                        label: 'Price: High to Low ($$$)',
                                    },
                                    {
                                        value: 'price_asc',
                                        label: 'Price: Low to High ($)',
                                    },
                                    {
                                        value: 'cost_asc',
                                        label: 'Ink Cost: Low to High',
                                    },
                                    {
                                        value: 'cost_desc',
                                        label: 'Ink Cost: High to Low',
                                    },
                                    {
                                        value: 'name_asc',
                                        label: 'Alphabetical (A-Z)',
                                    },
                                ]}
                                value={selectedSort}
                                onChange={(val) =>
                                    setSelectedSort(val || 'default')
                                }
                                allowDeselect={false}
                                size="xs"
                            />
                        </Box>
                    )}

                    {/* Market Price Range */}
                    {setSelectedPriceRange && (
                        <Box>
                            <Text size="11px" fw={600} c="gray.4" mb={4}>
                                Market Price Range
                            </Text>
                            <Select
                                placeholder="All Prices"
                                data={[
                                    { value: 'All', label: 'All Prices' },
                                    { value: 'under_1', label: 'Under $1.00' },
                                    { value: '1_to_5', label: '$1.00 – $5.00' },
                                    {
                                        value: '5_to_20',
                                        label: '$5.00 – $20.00',
                                    },
                                    { value: '20_plus', label: '$20.00+' },
                                    { value: '50_plus', label: '$50.00+' },
                                    { value: '100_plus', label: '$100.00+' },
                                ]}
                                value={selectedPriceRange}
                                onChange={(val) =>
                                    setSelectedPriceRange(val || 'All')
                                }
                                allowDeselect={false}
                                size="xs"
                            />
                        </Box>
                    )}

                    {/* 0. Ownership Status */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Ownership
                        </Text>
                        <Select
                            placeholder="All Cards"
                            data={[
                                {
                                    value: 'all',
                                    label: 'All Cards (Catalog)',
                                },
                                {
                                    value: 'owned',
                                    label: 'Owned Cards (> 0)',
                                },
                                {
                                    value: 'missing',
                                    label: 'Missing / Unowned (0)',
                                },
                                {
                                    value: 'foil',
                                    label: 'Foil Cards Owned',
                                },
                                {
                                    value: 'non_foil',
                                    label: 'Normal Cards Owned',
                                },
                            ]}
                            value={selectedOwnership}
                            onChange={(val) =>
                                setSelectedOwnership(val || 'all')
                            }
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 1. Set */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Card Set
                        </Text>
                        <Select
                            placeholder="All Sets"
                            data={sets.map((s) => {
                                if (s === 'All') {
                                    return { value: 'All', label: 'All Sets' };
                                }
                                const stats = setProgressMap?.get(s);
                                const label = stats
                                    ? `${s} (${stats.completionPercentage}%)`
                                    : s;
                                return { value: s, label };
                            })}
                            value={selectedSet}
                            onChange={(val) => setSelectedSet(val || 'All')}
                            searchable
                            allowDeselect={false}
                            size="xs"
                            renderOption={({ option }) => {
                                if (option.value === 'All') {
                                    return <Text size="xs">All Sets</Text>;
                                }
                                const stats = setProgressMap?.get(option.value);
                                const percent =
                                    stats?.completionPercentage ?? 0;
                                const isComplete = percent === 100;
                                return (
                                    <Box style={{ width: '100%' }} py={2}>
                                        <Group
                                            justify="space-between"
                                            align="center"
                                            wrap="nowrap"
                                            mb={3}
                                        >
                                            <Group
                                                gap={6}
                                                wrap="nowrap"
                                                style={{ overflow: 'hidden' }}
                                            >
                                                {stats?.setIndex !==
                                                    undefined && (
                                                    <Badge
                                                        size="xs"
                                                        variant="outline"
                                                        color="violet"
                                                    >
                                                        Set {stats.setIndex}
                                                    </Badge>
                                                )}
                                                <Text
                                                    size="xs"
                                                    fw={500}
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                    }}
                                                >
                                                    {option.value}
                                                </Text>
                                            </Group>
                                            <Badge
                                                size="xs"
                                                variant={
                                                    isComplete
                                                        ? 'filled'
                                                        : percent > 0
                                                          ? 'light'
                                                          : 'outline'
                                                }
                                                color={
                                                    isComplete
                                                        ? 'teal'
                                                        : percent > 0
                                                          ? 'violet'
                                                          : 'gray'
                                                }
                                            >
                                                {percent}%
                                            </Badge>
                                        </Group>
                                        <Progress
                                            value={percent}
                                            size={3}
                                            radius="xl"
                                            color={
                                                isComplete
                                                    ? 'teal'
                                                    : percent >= 50
                                                      ? 'violet'
                                                      : 'indigo'
                                            }
                                            styles={{
                                                root: {
                                                    backgroundColor:
                                                        'rgba(255, 255, 255, 0.08)',
                                                },
                                            }}
                                        />
                                    </Box>
                                );
                            }}
                        />
                    </Box>

                    {/* 2. Rarity */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Rarity
                        </Text>
                        <Select
                            placeholder="All Rarities"
                            data={[
                                { value: 'All', label: 'All Rarities' },
                                { value: 'Common', label: 'Common' },
                                { value: 'Uncommon', label: 'Uncommon' },
                                { value: 'Rare', label: 'Rare' },
                                { value: 'Super Rare', label: 'Super Rare' },
                                { value: 'Legendary', label: 'Legendary' },
                                { value: 'Epic', label: 'Epic' },
                                { value: 'Enchanted', label: 'Enchanted' },
                                { value: 'Iconic', label: 'Iconic' },
                                { value: 'Promo', label: 'Promo' },
                            ]}
                            value={selectedRarity}
                            onChange={(val) => setSelectedRarity(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 3. Cost */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Ink Cost
                        </Text>
                        <Select
                            placeholder="All Costs"
                            data={[
                                { value: 'All', label: 'All Costs' },
                                ...Array.from({ length: 8 }, (_, i) => ({
                                    value: String(i),
                                    label: String(i),
                                })),
                                { value: '8+', label: '8+' },
                            ]}
                            value={selectedCost}
                            onChange={(val) => setSelectedCost(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 4. Inkable */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Inkwell Type
                        </Text>
                        <Select
                            placeholder="All Types"
                            data={[
                                { value: 'All', label: 'All Types' },
                                { value: 'Inkable', label: 'Inkable' },
                                { value: 'Non-Inkable', label: 'Non-Inkable' },
                            ]}
                            value={selectedInkable}
                            onChange={(val) => setSelectedInkable(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 5. Legality */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Format Legality
                        </Text>
                        <Select
                            placeholder="All Formats"
                            data={[
                                { value: 'All', label: 'All Formats' },
                                { value: 'Core', label: 'Core Legal' },
                                { value: 'Infinity', label: 'Infinity Legal' },
                            ]}
                            value={selectedFormat}
                            onChange={(val) => setSelectedFormat(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 6. Card Type */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Card Type
                        </Text>
                        <Select
                            placeholder="All Types"
                            data={[
                                { value: 'All', label: 'All Types' },
                                { value: 'Character', label: 'Character' },
                                { value: 'Action', label: 'Action' },
                                { value: 'Item', label: 'Item' },
                                { value: 'Location', label: 'Location' },
                            ]}
                            value={selectedType}
                            onChange={(val) => setSelectedType(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 7. Classifications */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Classification
                        </Text>
                        <Select
                            placeholder="All Classifications"
                            data={['All', ...allClassifications].map((cl) => ({
                                value: cl,
                                label:
                                    cl === 'All' ? 'All Classifications' : cl,
                            }))}
                            value={selectedClassification}
                            onChange={(val) =>
                                setSelectedClassification(val || 'All')
                            }
                            searchable
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 8. Franchise */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Franchise
                        </Text>
                        <Select
                            placeholder="All Franchises"
                            data={['All', ...allFranchises].map((f) => ({
                                value: f,
                                label: f === 'All' ? 'All Franchises' : f,
                            }))}
                            value={selectedFranchise}
                            onChange={(val) =>
                                setSelectedFranchise(val || 'All')
                            }
                            searchable
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 9. Attack */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Attack (Strength)
                        </Text>
                        <Select
                            placeholder="All Strength"
                            data={[
                                { value: 'All', label: 'All Strength' },
                                ...Array.from({ length: 7 }, (_, i) => ({
                                    value: String(i),
                                    label: String(i),
                                })),
                                { value: '7+', label: '7+' },
                            ]}
                            value={selectedAttack}
                            onChange={(val) => setSelectedAttack(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 10. Defense */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Defense (Willpower)
                        </Text>
                        <Select
                            placeholder="All Willpower"
                            data={[
                                { value: 'All', label: 'All Willpower' },
                                ...Array.from({ length: 8 }, (_, i) => ({
                                    value: String(i + 1),
                                    label: String(i + 1),
                                })),
                                { value: '8+', label: '8+' },
                            ]}
                            value={selectedDefense}
                            onChange={(val) => setSelectedDefense(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>

                    {/* 11. Lore */}
                    <Box>
                        <Text size="11px" fw={600} c="gray.4" mb={4}>
                            Lore Value
                        </Text>
                        <Select
                            placeholder="All Lore"
                            data={[
                                { value: 'All', label: 'All Lore' },
                                ...Array.from({ length: 4 }, (_, i) => ({
                                    value: String(i),
                                    label: String(i),
                                })),
                                { value: '4+', label: '4+' },
                            ]}
                            value={selectedLore}
                            onChange={(val) => setSelectedLore(val || 'All')}
                            allowDeselect={false}
                            size="xs"
                        />
                    </Box>
                </Stack>
            </Paper>
        </Stack>
    );
}
