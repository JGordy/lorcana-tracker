import { useRef, useState, useCallback, useEffect } from 'react';
import {
    Paper,
    Group,
    Stack,
    SegmentedControl,
    TextInput,
    ActionIcon,
    Tooltip,
    Box,
    Select,
    Badge,
    Button,
} from '@mantine/core';
import {
    IconSearch,
    IconX,
    IconArrowsSort,
    IconChartBar,
    IconChevronLeft,
    IconChevronRight,
    IconRefresh,
    IconFilter,
} from '@tabler/icons-react';
import type { SetProgressStats } from '../../../utils/setCompletion';
import { CollectionMobileInkBar, INK_LIST } from './CollectionMobileInkBar';

export interface CollectionTopFilterBarProps {
    selectedOwnership: string;
    setSelectedOwnership: (val: string) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    selectedInks: string[];
    setSelectedInks: React.Dispatch<React.SetStateAction<string[]>>;
    selectedSort?: string;
    setSelectedSort?: (val: string) => void;
    selectedSet?: string;
    setSelectedSet?: (val: string) => void;
    selectedSetStats?: SetProgressStats | null;
    onClearSet?: () => void;
    onOpenSetBreakdown?: () => void;
    onOpenMobileFilters?: () => void;
    activeFilterCount?: number;

    // Filter synchronization
    selectedRarity?: string;
    setSelectedRarity?: (val: string) => void;
    selectedCost?: string;
    setSelectedCost?: (val: string) => void;
    selectedInkable?: string;
    setSelectedInkable?: (val: string) => void;
    selectedFormat?: string;
    setSelectedFormat?: (val: string) => void;
    selectedType?: string;
    setSelectedType?: (val: string) => void;
    selectedClassification?: string;
    setSelectedClassification?: (val: string) => void;
    selectedFranchise?: string;
    setSelectedFranchise?: (val: string) => void;
    selectedAttack?: string;
    setSelectedAttack?: (val: string) => void;
    selectedDefense?: string;
    setSelectedDefense?: (val: string) => void;
    selectedLore?: string;
    setSelectedLore?: (val: string) => void;
    selectedPriceRange?: string;
    setSelectedPriceRange?: (val: string) => void;
    onResetAll?: () => void;
}

interface ActiveChip {
    id: string;
    label: string;
    onRemove: () => void;
    icon?: React.ReactNode;
    color?: string;
    onClick?: () => void;
}

export function CollectionTopFilterBar({
    selectedOwnership,
    setSelectedOwnership,
    searchQuery,
    setSearchQuery,
    selectedInks,
    setSelectedInks,
    selectedSort = 'default',
    setSelectedSort,
    selectedSet = 'All',
    setSelectedSet,
    selectedSetStats,
    onClearSet,
    onOpenSetBreakdown,
    onOpenMobileFilters,
    activeFilterCount,
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
    selectedFranchise,
    setSelectedFranchise,
    selectedAttack,
    setSelectedAttack,
    selectedDefense,
    setSelectedDefense,
    selectedLore,
    setSelectedLore,
    selectedPriceRange,
    setSelectedPriceRange,
    onResetAll,
}: CollectionTopFilterBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Build list of active filter chips
    const activeChips: ActiveChip[] = [];

    // 1. Search Query
    if (searchQuery.trim()) {
        activeChips.push({
            id: 'search',
            label: `"${searchQuery.trim()}"`,
            onRemove: () => setSearchQuery(''),
        });
    }

    // 2. Ownership
    if (selectedOwnership && selectedOwnership !== 'all') {
        activeChips.push({
            id: 'ownership',
            label:
                selectedOwnership === 'owned'
                    ? 'Status: Owned'
                    : selectedOwnership === 'missing'
                      ? 'Status: Missing'
                      : `Status: ${selectedOwnership}`,
            onRemove: () => setSelectedOwnership('all'),
        });
    }

    // 3. Set Filter
    if (selectedSet && selectedSet !== 'All') {
        const setLabel = selectedSetStats
            ? `${selectedSet} (${selectedSetStats.completionPercentage}%)`
            : selectedSet;
        activeChips.push({
            id: 'set',
            label: setLabel,
            icon: <IconChartBar size={12} color="#ffffff" />,
            onRemove: () => {
                if (setSelectedSet) setSelectedSet('All');
                else onClearSet?.();
            },
            onClick: onOpenSetBreakdown,
        });
    }

    // 4. Inks
    selectedInks.forEach((ink) => {
        const inkColor = INK_LIST.find((i) => i.name === ink)?.color;
        activeChips.push({
            id: `ink-${ink}`,
            label: `Ink: ${ink}`,
            color: inkColor,
            onRemove: () => {
                setSelectedInks((prev) => prev.filter((name) => name !== ink));
            },
        });
    });

    // 5. Rarity
    if (selectedRarity && selectedRarity !== 'All') {
        activeChips.push({
            id: 'rarity',
            label: `Rarity: ${selectedRarity}`,
            onRemove: () => setSelectedRarity?.('All'),
        });
    }

    // 6. Cost
    if (selectedCost && selectedCost !== 'All') {
        activeChips.push({
            id: 'cost',
            label: `Cost: ${selectedCost}`,
            onRemove: () => setSelectedCost?.('All'),
        });
    }

    // 7. Inkable
    if (selectedInkable && selectedInkable !== 'All') {
        activeChips.push({
            id: 'inkable',
            label: `Inkable: ${selectedInkable === 'true' ? 'Yes' : 'No'}`,
            onRemove: () => setSelectedInkable?.('All'),
        });
    }

    // 8. Format
    if (selectedFormat && selectedFormat !== 'All') {
        activeChips.push({
            id: 'format',
            label: `Format: ${selectedFormat}`,
            onRemove: () => setSelectedFormat?.('All'),
        });
    }

    // 9. Type
    if (selectedType && selectedType !== 'All') {
        activeChips.push({
            id: 'type',
            label: `Type: ${selectedType}`,
            onRemove: () => setSelectedType?.('All'),
        });
    }

    // 10. Classification
    if (selectedClassification && selectedClassification !== 'All') {
        activeChips.push({
            id: 'classification',
            label: `Class: ${selectedClassification}`,
            onRemove: () => setSelectedClassification?.('All'),
        });
    }

    // 11. Franchise
    if (selectedFranchise && selectedFranchise !== 'All') {
        activeChips.push({
            id: 'franchise',
            label: `Franchise: ${selectedFranchise}`,
            onRemove: () => setSelectedFranchise?.('All'),
        });
    }

    // 12. Strength
    if (selectedAttack && selectedAttack !== 'All') {
        activeChips.push({
            id: 'attack',
            label: `Strength: ${selectedAttack}`,
            onRemove: () => setSelectedAttack?.('All'),
        });
    }

    // 13. Willpower
    if (selectedDefense && selectedDefense !== 'All') {
        activeChips.push({
            id: 'defense',
            label: `Willpower: ${selectedDefense}`,
            onRemove: () => setSelectedDefense?.('All'),
        });
    }

    // 14. Lore
    if (selectedLore && selectedLore !== 'All') {
        activeChips.push({
            id: 'lore',
            label: `Lore: ${selectedLore}`,
            onRemove: () => setSelectedLore?.('All'),
        });
    }

    // 15. Price Range
    if (selectedPriceRange && selectedPriceRange !== 'All') {
        activeChips.push({
            id: 'price',
            label: `Price: ${selectedPriceRange}`,
            onRemove: () => setSelectedPriceRange?.('All'),
        });
    }

    const handleReset = () => {
        if (onResetAll) {
            onResetAll();
        } else {
            setSelectedOwnership('all');
            setSearchQuery('');
            setSelectedInks([]);
            if (setSelectedSet) setSelectedSet('All');
            else onClearSet?.();
            setSelectedRarity?.('All');
            setSelectedCost?.('All');
            setSelectedInkable?.('All');
            setSelectedFormat?.('All');
            setSelectedType?.('All');
            setSelectedClassification?.('All');
            setSelectedFranchise?.('All');
            setSelectedAttack?.('All');
            setSelectedDefense?.('All');
            setSelectedLore?.('All');
            setSelectedPriceRange?.('All');
        }
    };

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 2);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const distance = 160;
        el.scrollBy({
            left: direction === 'left' ? -distance : distance,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        updateScrollState();
        const el = scrollRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(() => {
                updateScrollState();
            });
            observer.observe(el);
        }

        return () => {
            el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
            if (observer) observer.disconnect();
        };
    }, [updateScrollState, activeChips.length]);

    useEffect(() => {
        const timer = setTimeout(updateScrollState, 50);
        return () => clearTimeout(timer);
    }, [activeChips.length, updateScrollState]);

    const currentActiveCount = activeFilterCount ?? activeChips.length;

    return (
        <Paper
            p={{ base: 6, md: 'xs' }}
            px={{ base: 8, sm: 'md' }}
            radius="lg"
            withBorder
            className="top-filter-bar"
            mb={{ base: 'xs', md: 'md' }}
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
            {/* Desktop Controls (Single Unified Row) */}
            <Box visibleFrom="md">
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
                                    aria-label="Clear search"
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
                            onChange={(val) =>
                                setSelectedSort(val || 'default')
                            }
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
                                {
                                    value: 'name_asc',
                                    label: 'Sort: Name (A-Z)',
                                },
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
                                    fontSize: 11.5,
                                    fontWeight: 500,
                                    borderRadius: 6,
                                    color: '#f1f5f9',
                                    padding: '7px 10px',
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
                            const isDimmed =
                                selectedInks.length > 0 && !isSelected;
                            const handleInkClick = () => {
                                if (isSelected) {
                                    setSelectedInks((prev) =>
                                        prev.filter(
                                            (name) => name !== ink.name,
                                        ),
                                    );
                                } else if (selectedInks.length < 3) {
                                    setSelectedInks((prev) => [
                                        ...prev,
                                        ink.name,
                                    ]);
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
                                aria-label="Clear ink filters"
                                ml={2}
                            >
                                <IconX size={15} />
                            </ActionIcon>
                        )}
                    </Group>
                </Group>
            </Box>

            {/* Mobile Controls (Responsive Multi-Row Layout) */}
            <Box hiddenFrom="md">
                <Stack gap={6}>
                    {/* Row 1: Search Input + Mobile Filters Drawer Button */}
                    <Group gap="xs" wrap="nowrap" align="center">
                        <TextInput
                            placeholder="Search cards..."
                            leftSection={
                                <IconSearch size={14} color="#c084fc" />
                            }
                            rightSection={
                                searchQuery ? (
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="gray"
                                        onClick={() => setSearchQuery('')}
                                        title="Clear search"
                                        aria-label="Clear search"
                                    >
                                        <IconX size={12} />
                                    </ActionIcon>
                                ) : null
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="xs"
                            style={{ flex: 1 }}
                            styles={{
                                input: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderColor: 'rgba(168, 85, 247, 0.2)',
                                    color: '#f8fafc',
                                    height: 32,
                                    fontSize: 12,
                                },
                            }}
                        />

                        {onOpenMobileFilters && (
                            <Button
                                size="xs"
                                variant="light"
                                color="violet"
                                leftSection={<IconFilter size={13} />}
                                onClick={onOpenMobileFilters}
                                styles={{
                                    root: {
                                        height: 32,
                                        paddingLeft: 8,
                                        paddingRight: 8,
                                        backgroundColor:
                                            'rgba(147, 51, 234, 0.25)',
                                        border: '1px solid rgba(168, 85, 247, 0.35)',
                                        flexShrink: 0,
                                        color: '#f1f5f9',
                                        fontWeight: 600,
                                        fontSize: 12,
                                    },
                                }}
                            >
                                Filters
                                {currentActiveCount > 0 && (
                                    <Badge
                                        size="xs"
                                        variant="filled"
                                        color="violet"
                                        ml={5}
                                        style={{
                                            backgroundColor: '#9333ea',
                                            height: 16,
                                            minWidth: 16,
                                            padding: '0 3px',
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {currentActiveCount}
                                    </Badge>
                                )}
                            </Button>
                        )}
                    </Group>

                    {/* Row 2: Ownership SegmentedControl + Sort Dropdown */}
                    <Group
                        justify="space-between"
                        align="center"
                        gap={6}
                        wrap="nowrap"
                    >
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
                            style={{ flex: 1 }}
                            styles={{
                                root: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                    padding: 2,
                                },
                                indicator: {
                                    boxShadow:
                                        '0 2px 8px rgba(168, 85, 247, 0.3)',
                                },
                                label: {
                                    padding: '3px 6px',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                },
                            }}
                        />

                        {setSelectedSort && (
                            <Select
                                size="xs"
                                value={selectedSort}
                                onChange={(val) =>
                                    setSelectedSort(val || 'default')
                                }
                                data={[
                                    {
                                        value: 'default',
                                        label: 'Sort: Default',
                                    },
                                    {
                                        value: 'price_desc',
                                        label: 'Sort: Price (High)',
                                    },
                                    {
                                        value: 'price_asc',
                                        label: 'Sort: Price (Low)',
                                    },
                                    {
                                        value: 'cost_asc',
                                        label: 'Sort: Cost (Low)',
                                    },
                                    {
                                        value: 'cost_desc',
                                        label: 'Sort: Cost (High)',
                                    },
                                    {
                                        value: 'name_asc',
                                        label: 'Sort: Name (A-Z)',
                                    },
                                ]}
                                allowDeselect={false}
                                leftSection={
                                    <IconArrowsSort size={12} color="#a855f7" />
                                }
                                styles={{
                                    input: {
                                        backgroundColor:
                                            'rgba(15, 23, 42, 0.6)',
                                        borderColor: 'rgba(168, 85, 247, 0.2)',
                                        color: '#f8fafc',
                                        height: 28,
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        paddingLeft: 24,
                                        paddingRight: 16,
                                    },
                                    dropdown: {
                                        background:
                                            'linear-gradient(145deg, rgba(30, 24, 60, 0.99) 0%, rgba(15, 17, 38, 0.99) 100%)',
                                        backdropFilter: 'blur(20px)',
                                        borderColor:
                                            'rgba(192, 132, 252, 0.45)',
                                        boxShadow:
                                            '0 20px 40px -8px rgba(0, 0, 0, 0.9), 0 0 22px rgba(168, 85, 247, 0.25)',
                                        borderRadius: 10,
                                        padding: 6,
                                    },
                                    option: {
                                        fontSize: 11,
                                        fontWeight: 500,
                                        borderRadius: 6,
                                        color: '#f1f5f9',
                                        padding: '6px 8px',
                                    },
                                }}
                                style={{ width: 135, flexShrink: 0 }}
                            />
                        )}
                    </Group>

                    {/* Row 3: Dedicated Mobile Ink Colors Filter Component (Compact) */}
                    <CollectionMobileInkBar
                        selectedInks={selectedInks}
                        setSelectedInks={setSelectedInks}
                        size="sm"
                    />
                </Stack>
            </Box>

            {/* Active Filter Strip (Sub-Row) */}
            {activeChips.length > 0 && (
                <Box
                    pt={{ base: 5, md: 8 }}
                    mt={{ base: 5, md: 8 }}
                    style={{
                        borderTop: '1px solid rgba(168, 85, 247, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minHeight: 28,
                    }}
                >
                    {/* Scroll Left Chevron */}
                    {canScrollLeft && (
                        <ActionIcon
                            size={22}
                            variant="light"
                            color="violet"
                            radius="xl"
                            onClick={() => scroll('left')}
                            title="Scroll filters left"
                            aria-label="Scroll filters left"
                            style={{
                                flexShrink: 0,
                                backgroundColor: 'rgba(147, 51, 234, 0.25)',
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                boxShadow: '0 0 8px rgba(168, 85, 247, 0.3)',
                            }}
                        >
                            <IconChevronLeft size={13} />
                        </ActionIcon>
                    )}

                    {/* Horizontally Scrollable Container */}
                    <Box
                        ref={scrollRef}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                            flex: 1,
                        }}
                    >
                        {activeChips.map((chip) => (
                            <Badge
                                key={chip.id}
                                size="sm"
                                variant="filled"
                                color="violet"
                                style={{
                                    flexShrink: 0,
                                    backgroundColor: '#7c3aed',
                                    backgroundImage:
                                        'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                    border: '1px solid rgba(216, 180, 254, 0.4)',
                                    color: '#ffffff',
                                    height: 26,
                                    paddingLeft:
                                        chip.icon || chip.color ? 8 : 10,
                                    paddingRight: 4,
                                    textTransform: 'none',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: chip.onClick
                                        ? 'pointer'
                                        : 'default',
                                    boxShadow:
                                        '0 2px 8px rgba(109, 40, 217, 0.45), 0 0 10px rgba(168, 85, 247, 0.2)',
                                    transition:
                                        'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
                                }}
                                leftSection={
                                    chip.color ? (
                                        <Box
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: chip.color,
                                                border: '1px solid rgba(255, 255, 255, 0.6)',
                                                boxShadow:
                                                    '0 0 4px rgba(0, 0, 0, 0.4)',
                                            }}
                                        />
                                    ) : chip.icon ? (
                                        chip.icon
                                    ) : null
                                }
                                rightSection={
                                    <ActionIcon
                                        size={16}
                                        color="violet"
                                        variant="transparent"
                                        radius="xl"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            chip.onRemove();
                                        }}
                                        title={`Remove ${chip.label} filter`}
                                        aria-label={`Remove ${chip.label} filter`}
                                        style={{
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color =
                                                '#ffffff';
                                            e.currentTarget.style.backgroundColor =
                                                'rgba(0, 0, 0, 0.25)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color =
                                                'rgba(255, 255, 255, 0.85)';
                                            e.currentTarget.style.backgroundColor =
                                                'transparent';
                                        }}
                                    >
                                        <IconX size={11} stroke={2.5} />
                                    </ActionIcon>
                                }
                                onClick={chip.onClick}
                            >
                                {chip.label}
                            </Badge>
                        ))}
                    </Box>

                    {/* Scroll Right Chevron */}
                    {canScrollRight && (
                        <ActionIcon
                            size={22}
                            variant="light"
                            color="violet"
                            radius="xl"
                            onClick={() => scroll('right')}
                            title="Scroll filters right"
                            aria-label="Scroll filters right"
                            style={{
                                flexShrink: 0,
                                backgroundColor: 'rgba(147, 51, 234, 0.25)',
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                boxShadow: '0 0 8px rgba(168, 85, 247, 0.3)',
                            }}
                        >
                            <IconChevronRight size={13} />
                        </ActionIcon>
                    )}

                    {/* Pinned Reset All Button */}
                    <Button
                        size="compact-xs"
                        variant="subtle"
                        color="red"
                        leftSection={<IconRefresh size={11} />}
                        onClick={handleReset}
                        style={{
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 600,
                            height: 24,
                            paddingLeft: 8,
                            paddingRight: 8,
                        }}
                    >
                        Reset All
                    </Button>
                </Box>
            )}
        </Paper>
    );
}
