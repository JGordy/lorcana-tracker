import {
    Paper,
    Group,
    Text,
    Stack,
    Box,
    Select,
    Badge,
    Progress,
    Button,
    type SelectProps,
} from '@mantine/core';
import { IconFilter, IconRefresh } from '@tabler/icons-react';
import type { SetProgressStats } from '../../../utils/setCompletion';

const getSelectStyles = (variant: 'card' | 'drawer' = 'card') => ({
    input: {
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        borderColor: 'rgba(168, 85, 247, 0.25)',
        color: '#f8fafc',
        height: variant === 'drawer' ? 44 : 36,
        fontSize: variant === 'drawer' ? 14 : 11,
        fontWeight: 500,
        borderRadius: 8,
    },
    dropdown: {
        background:
            'linear-gradient(145deg, rgba(30, 24, 60, 0.99) 0%, rgba(15, 17, 38, 0.99) 100%)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(192, 132, 252, 0.45)',
        boxShadow:
            '0 20px 40px -8px rgba(0, 0, 0, 0.9), 0 0 22px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        borderRadius: 10,
        padding: 6,
    },
    option: {
        fontSize: variant === 'drawer' ? 13.5 : 11.5,
        fontWeight: 500,
        borderRadius: 6,
        color: '#f1f5f9',
        padding: variant === 'drawer' ? '10px 12px' : '7px 10px',
        minHeight: variant === 'drawer' ? 40 : 32,
    },
});

export const SORT_OPTIONS = [
    { value: 'default', label: 'Default (Set & Number)' },
    { value: 'price_desc', label: 'Price: High to Low ($$$)' },
    { value: 'price_asc', label: 'Price: Low to High ($)' },
    { value: 'cost_asc', label: 'Ink Cost: Low to High' },
    { value: 'cost_desc', label: 'Ink Cost: High to Low' },
    { value: 'name_asc', label: 'Alphabetical (A-Z)' },
];

export const PRICE_RANGE_OPTIONS = [
    { value: 'All', label: 'All Prices' },
    { value: 'under_1', label: 'Under $1.00' },
    { value: '1_to_5', label: '$1.00 – $5.00' },
    { value: '5_to_20', label: '$5.00 – $20.00' },
    { value: '20_plus', label: '$20.00+' },
    { value: '50_plus', label: '$50.00+' },
    { value: '100_plus', label: '$100.00+' },
];

export const OWNERSHIP_OPTIONS = [
    { value: 'all', label: 'All Cards (Catalog)' },
    { value: 'owned', label: 'Owned Cards (> 0)' },
    { value: 'missing', label: 'Missing / Unowned (0)' },
    { value: 'foil', label: 'Foil Cards Owned' },
    { value: 'non_foil', label: 'Normal Cards Owned' },
];

export const RARITY_OPTIONS = [
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
];

export const COST_OPTIONS = [
    { value: 'All', label: 'All Costs' },
    ...Array.from({ length: 8 }, (_, i) => ({
        value: String(i),
        label: String(i),
    })),
    { value: '8+', label: '8+' },
];

export const INKABLE_OPTIONS = [
    { value: 'All', label: 'All Types' },
    { value: 'Inkable', label: 'Inkable' },
    { value: 'Non-Inkable', label: 'Non-Inkable' },
];

export const FORMAT_OPTIONS = [
    { value: 'All', label: 'All Formats' },
    { value: 'Core', label: 'Core Legal' },
    { value: 'Infinity', label: 'Infinity Legal' },
];

export const CARD_TYPE_OPTIONS = [
    { value: 'All', label: 'All Types' },
    { value: 'Character', label: 'Character' },
    { value: 'Action', label: 'Action' },
    { value: 'Item', label: 'Item' },
    { value: 'Location', label: 'Location' },
];

export const ATTACK_OPTIONS = [
    { value: 'All', label: 'All Strength' },
    ...Array.from({ length: 7 }, (_, i) => ({
        value: String(i),
        label: String(i),
    })),
    { value: '7+', label: '7+' },
];

export const DEFENSE_OPTIONS = [
    { value: 'All', label: 'All Willpower' },
    ...Array.from({ length: 8 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
    })),
    { value: '8+', label: '8+' },
];

export const LORE_OPTIONS = [
    { value: 'All', label: 'All Lore' },
    ...Array.from({ length: 4 }, (_, i) => ({
        value: String(i),
        label: String(i),
    })),
    { value: '4+', label: '4+' },
];

export interface FilterSelectProps {
    label: string;
    placeholder?: string;
    data: Array<{ value: string; label: string }> | string[];
    value: string;
    onChange: (val: string) => void;
    searchable?: boolean;
    defaultValue?: string;
    renderOption?: SelectProps['renderOption'];
    variant?: 'card' | 'drawer';
}

export function FilterSelect({
    label,
    placeholder,
    data,
    value,
    onChange,
    searchable,
    defaultValue = 'All',
    renderOption,
    variant = 'card',
}: FilterSelectProps) {
    const styles = getSelectStyles(variant);
    const labelSize = variant === 'drawer' ? '13px' : '11px';
    const labelColor = variant === 'drawer' ? 'gray.3' : 'gray.4';
    const labelMargin = variant === 'drawer' ? 6 : 4;
    const selectSize = variant === 'drawer' ? 'sm' : 'xs';

    return (
        <Box>
            <Text size={labelSize} fw={600} c={labelColor} mb={labelMargin}>
                {label}
            </Text>
            <Select
                placeholder={placeholder || label}
                data={data}
                value={value}
                onChange={(val) => onChange(val || defaultValue)}
                searchable={searchable}
                allowDeselect={false}
                size={selectSize}
                styles={styles}
                renderOption={renderOption}
            />
        </Box>
    );
}

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
    variant?: 'card' | 'drawer';
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
    variant = 'card',
}: CollectionFiltersSidebarProps) {
    const filterFields = (
        <Stack
            gap={variant === 'drawer' ? 'md' : 'sm'}
            mt={variant === 'card' ? 'xs' : undefined}
        >
            {/* Sort Order */}
            {setSelectedSort && (
                <FilterSelect
                    label="Sort Order"
                    placeholder="Default (Set #)"
                    data={SORT_OPTIONS}
                    value={selectedSort}
                    defaultValue="default"
                    onChange={setSelectedSort}
                    variant={variant}
                />
            )}

            {/* Market Price Range */}
            {setSelectedPriceRange && (
                <FilterSelect
                    label="Market Price Range"
                    placeholder="All Prices"
                    data={PRICE_RANGE_OPTIONS}
                    value={selectedPriceRange}
                    onChange={setSelectedPriceRange}
                    variant={variant}
                />
            )}

            {/* Ownership */}
            <FilterSelect
                label="Ownership"
                placeholder="All Cards"
                data={OWNERSHIP_OPTIONS}
                value={selectedOwnership}
                defaultValue="all"
                onChange={setSelectedOwnership}
                variant={variant}
            />

            {/* Card Set */}
            <FilterSelect
                label="Card Set"
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
                onChange={setSelectedSet}
                searchable
                variant={variant}
                renderOption={({ option }) => {
                    if (option.value === 'All') {
                        return (
                            <Text size={variant === 'drawer' ? 'sm' : 'xs'}>
                                All Sets
                            </Text>
                        );
                    }
                    const stats = setProgressMap?.get(option.value);
                    const percent = stats?.completionPercentage ?? 0;
                    const isComplete = percent === 100;
                    return (
                        <Box
                            style={{ width: '100%' }}
                            py={variant === 'drawer' ? 4 : 2}
                        >
                            <Group
                                justify="space-between"
                                align="center"
                                wrap="nowrap"
                                mb={variant === 'drawer' ? 4 : 3}
                            >
                                <Group
                                    gap={6}
                                    wrap="nowrap"
                                    style={{ overflow: 'hidden' }}
                                >
                                    {stats?.setIndex !== undefined && (
                                        <Badge
                                            size={
                                                variant === 'drawer'
                                                    ? 'sm'
                                                    : 'xs'
                                            }
                                            variant="outline"
                                            color="violet"
                                        >
                                            Set {stats.setIndex}
                                        </Badge>
                                    )}
                                    <Text
                                        size={
                                            variant === 'drawer' ? 'sm' : 'xs'
                                        }
                                        fw={500}
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {option.value}
                                    </Text>
                                </Group>
                                <Badge
                                    size={variant === 'drawer' ? 'sm' : 'xs'}
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
                                size={variant === 'drawer' ? 4 : 3}
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

            {/* Rarity */}
            <FilterSelect
                label="Rarity"
                placeholder="All Rarities"
                data={RARITY_OPTIONS}
                value={selectedRarity}
                onChange={setSelectedRarity}
                variant={variant}
            />

            {/* Ink Cost */}
            <FilterSelect
                label="Ink Cost"
                placeholder="All Costs"
                data={COST_OPTIONS}
                value={selectedCost}
                onChange={setSelectedCost}
                variant={variant}
            />

            {/* Inkwell Type */}
            <FilterSelect
                label="Inkwell Type"
                placeholder="All Types"
                data={INKABLE_OPTIONS}
                value={selectedInkable}
                onChange={setSelectedInkable}
                variant={variant}
            />

            {/* Format Legality */}
            <FilterSelect
                label="Format Legality"
                placeholder="All Formats"
                data={FORMAT_OPTIONS}
                value={selectedFormat}
                onChange={setSelectedFormat}
                variant={variant}
            />

            {/* Card Type */}
            <FilterSelect
                label="Card Type"
                placeholder="All Types"
                data={CARD_TYPE_OPTIONS}
                value={selectedType}
                onChange={setSelectedType}
                variant={variant}
            />

            {/* Classifications */}
            <FilterSelect
                label="Classification"
                placeholder="All Classifications"
                data={['All', ...allClassifications]}
                value={selectedClassification}
                onChange={setSelectedClassification}
                searchable
                variant={variant}
            />

            {/* Franchise */}
            <FilterSelect
                label="Franchise"
                placeholder="All Franchises"
                data={['All', ...allFranchises]}
                value={selectedFranchise}
                onChange={setSelectedFranchise}
                searchable
                variant={variant}
            />

            {/* Attack */}
            <FilterSelect
                label="Attack (Strength)"
                placeholder="All Strength"
                data={ATTACK_OPTIONS}
                value={selectedAttack}
                onChange={setSelectedAttack}
                variant={variant}
            />

            {/* Defense */}
            <FilterSelect
                label="Defense (Willpower)"
                placeholder="All Willpower"
                data={DEFENSE_OPTIONS}
                value={selectedDefense}
                onChange={setSelectedDefense}
                variant={variant}
            />

            {/* Lore */}
            <FilterSelect
                label="Lore Value"
                placeholder="All Lore"
                data={LORE_OPTIONS}
                value={selectedLore}
                onChange={setSelectedLore}
                variant={variant}
            />
        </Stack>
    );

    if (variant === 'drawer') {
        return filterFields;
    }

    return (
        <Stack gap="md" className="filters-sidebar">
            <Paper
                p="md"
                radius="lg"
                withBorder
                className="filters-sidebar-card"
                style={{
                    background:
                        'linear-gradient(135deg, rgba(24, 20, 52, 0.9) 0%, rgba(12, 16, 33, 0.94) 100%)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(168, 85, 247, 0.25)',
                    boxShadow:
                        '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 15px rgba(168, 85, 247, 0.08)',
                }}
            >
                <Group justify="space-between" align="center" mb="xs">
                    <Group gap={6} align="center">
                        <IconFilter size={14} color="#c084fc" />
                        <Text
                            size="xs"
                            fw={700}
                            c="gray.3"
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

                {filterFields}
            </Paper>
        </Stack>
    );
}
