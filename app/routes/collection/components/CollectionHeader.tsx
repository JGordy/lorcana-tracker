import { useState } from 'react';
import {
    Paper,
    Group,
    Box,
    Title,
    Text,
    SimpleGrid,
    Card,
    Tooltip,
    Button,
    ActionIcon,
} from '@mantine/core';
import { IconCards, IconChartBar, IconDiamond } from '@tabler/icons-react';
import type { CollectionValuationResult } from '../../../utils/valuation';
import { formatCurrency } from '../../../utils/valuation';
import type { SetProgressStats } from '../../../utils/setCompletion';
import { CrownJewelsDrawer } from './CrownJewelsDrawer';
import { SetBreakdownDrawer } from './SetBreakdownDrawer';

export interface CollectionHeaderProps {
    totals: {
        totalCardsOwned: number;
        uniqueCardsCount: number;
    };
    valuation?: CollectionValuationResult;
    totalCatalogCards: number;
    selectedSet?: string;
    selectedSetStats?: SetProgressStats | null;
    setProgressStats?: SetProgressStats[];
    onSelectSet?: (setName: string) => void;
    setBreakdownOpened?: boolean;
    onOpenSetBreakdown?: () => void;
    onCloseSetBreakdown?: () => void;
}

export function CollectionHeader({
    totals,
    valuation,
    totalCatalogCards,
    selectedSet = 'All',
    selectedSetStats,
    setProgressStats = [],
    onSelectSet,
    setBreakdownOpened: controlledSetBreakdownOpened,
    onOpenSetBreakdown,
    onCloseSetBreakdown,
}: CollectionHeaderProps) {
    const [crownJewelsOpened, setCrownJewelsOpened] = useState(false);
    const [internalSetBreakdownOpened, setInternalSetBreakdownOpened] =
        useState(false);

    const isSetBreakdownOpen =
        controlledSetBreakdownOpened !== undefined
            ? controlledSetBreakdownOpened
            : internalSetBreakdownOpened;

    const handleOpenSetBreakdown =
        onOpenSetBreakdown || (() => setInternalSetBreakdownOpened(true));
    const handleCloseSetBreakdown =
        onCloseSetBreakdown || (() => setInternalSetBreakdownOpened(false));

    const completionPercentage =
        totalCatalogCards > 0
            ? Math.round((totals.uniqueCardsCount / totalCatalogCards) * 100)
            : 0;

    const totalVal = valuation?.totalValue ?? 0;
    const stdVal = valuation?.standardValue ?? 0;
    const foilVal = valuation?.foilValue ?? 0;
    const topGems = valuation?.topGems ?? [];

    const isSetFiltered = Boolean(selectedSet && selectedSet !== 'All');
    const setCompletionPercent = selectedSetStats
        ? selectedSetStats.completionPercentage
        : 0;

    return (
        <>
            <Paper
                p={{ base: 'md', md: 'lg' }}
                radius="lg"
                mb="md"
                style={{
                    background:
                        'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.15)',
                }}
            >
                <Group
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap="md"
                >
                    <Box style={{ maxWidth: 460 }}>
                        <Group gap="xs" mb={4}>
                            <IconCards size={24} color="#a855f7" />
                            <Title
                                order={1}
                                style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    letterSpacing: '0.5px',
                                    fontSize: 24,
                                    background:
                                        'linear-gradient(to right, #c084fc, #f472b6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                My Collection
                            </Title>
                        </Group>
                        <Text size="xs" c="gray.4" lh={1.5}>
                            Track your Lorcana cards (foil & non-foil counts)
                            and live market valuation. Changes save instantly
                            and automatically update deck percentages.
                        </Text>
                        <Group gap="xs" mt="xs">
                            <Button
                                size="xs"
                                variant="light"
                                color="violet"
                                leftSection={<IconChartBar size={14} />}
                                onClick={handleOpenSetBreakdown}
                                styles={{
                                    root: {
                                        backgroundColor:
                                            'rgba(168, 85, 247, 0.12)',
                                        border: '1px solid rgba(168, 85, 247, 0.3)',
                                    },
                                }}
                            >
                                Set Progress
                            </Button>
                            {topGems.length > 0 && (
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="yellow"
                                    leftSection={<IconDiamond size={14} />}
                                    onClick={() => setCrownJewelsOpened(true)}
                                    styles={{
                                        root: {
                                            backgroundColor:
                                                'rgba(234, 179, 8, 0.12)',
                                            border: '1px solid rgba(234, 179, 8, 0.3)',
                                        },
                                    }}
                                >
                                    Crown Jewels ({topGems.length})
                                </Button>
                            )}
                        </Group>
                    </Box>

                    {/* Metric Quick Stats */}
                    <SimpleGrid
                        cols={{ base: 2, sm: 4 }}
                        spacing="xs"
                        style={{
                            minWidth: 320,
                            flex: '1 1 480px',
                            maxWidth: 640,
                        }}
                    >
                        <Card
                            padding="xs"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text
                                size="10px"
                                c="gray.5"
                                fw={600}
                                tt="uppercase"
                            >
                                Total Cards
                            </Text>
                            <Text size="lg" fw={800} c="gray.1" mt={2}>
                                {totals.totalCardsOwned}
                            </Text>
                        </Card>

                        <Card
                            padding="xs"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text
                                size="10px"
                                c="teal.4"
                                fw={600}
                                tt="uppercase"
                            >
                                Unique
                            </Text>
                            <Text size="lg" fw={800} c="teal.3" mt={2}>
                                {totals.uniqueCardsCount}
                            </Text>
                        </Card>

                        <Card
                            padding="xs"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{
                                borderColor: 'rgba(255,255,255,0.06)',
                                cursor: 'pointer',
                            }}
                            onClick={handleOpenSetBreakdown}
                        >
                            <Group
                                justify="space-between"
                                align="center"
                                wrap="nowrap"
                            >
                                <Text
                                    size="10px"
                                    c="violet.4"
                                    fw={600}
                                    tt="uppercase"
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {isSetFiltered
                                        ? `${selectedSet} Completion`
                                        : 'Completion'}
                                </Text>
                                <Tooltip
                                    label="View Set Progress Breakdown"
                                    withArrow
                                >
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="violet"
                                        aria-label="View Set Progress Breakdown"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenSetBreakdown();
                                        }}
                                    >
                                        <IconChartBar size={13} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                            <Text size="lg" fw={800} c="violet.3" mt={2}>
                                {isSetFiltered
                                    ? `${setCompletionPercent}%`
                                    : `${completionPercentage}%`}
                                <Text
                                    component="span"
                                    size="10px"
                                    c="dimmed"
                                    fw={500}
                                    ml={4}
                                >
                                    {isSetFiltered
                                        ? `(${selectedSetStats?.uniqueCardsOwned ?? 0} / ${selectedSetStats?.totalCardsInSet ?? 0})`
                                        : `(${totals.uniqueCardsCount} / ${totalCatalogCards})`}
                                </Text>
                            </Text>
                        </Card>

                        {/* Portfolio Valuation Card */}
                        <Card
                            padding="xs"
                            radius="md"
                            bg="linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)"
                            withBorder
                            style={{
                                borderColor: 'rgba(234, 179, 8, 0.3)',
                                cursor:
                                    topGems.length > 0 ? 'pointer' : 'default',
                            }}
                            onClick={() => {
                                if (topGems.length > 0)
                                    setCrownJewelsOpened(true);
                            }}
                        >
                            <Group
                                justify="space-between"
                                align="center"
                                wrap="nowrap"
                            >
                                <Text
                                    size="10px"
                                    c="yellow.4"
                                    fw={700}
                                    tt="uppercase"
                                >
                                    Est. Value
                                </Text>
                                {topGems.length > 0 && (
                                    <Tooltip
                                        label="View Crown Jewels (Top Gems)"
                                        withArrow
                                    >
                                        <ActionIcon
                                            size="xs"
                                            variant="subtle"
                                            color="yellow"
                                            aria-label="View Crown Jewels"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCrownJewelsOpened(true);
                                            }}
                                        >
                                            <IconDiamond size={13} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </Group>
                            <Text size="lg" fw={900} c="yellow.3" mt={2}>
                                {formatCurrency(totalVal)}
                            </Text>
                            <Group gap={4} mt={3}>
                                <Text size="9px" c="dimmed">
                                    Reg:{' '}
                                    <span style={{ color: '#e2e8f0' }}>
                                        {formatCurrency(stdVal)}
                                    </span>
                                </Text>
                                <Text size="9px" c="dimmed">
                                    • Foil:{' '}
                                    <span style={{ color: '#f472b6' }}>
                                        {formatCurrency(foilVal)}
                                    </span>
                                </Text>
                            </Group>
                        </Card>
                    </SimpleGrid>
                </Group>
            </Paper>

            <CrownJewelsDrawer
                opened={crownJewelsOpened}
                onClose={() => setCrownJewelsOpened(false)}
                topGems={topGems}
                totalCollectionValue={totalVal}
            />

            <SetBreakdownDrawer
                opened={isSetBreakdownOpen}
                onClose={handleCloseSetBreakdown}
                setProgressStats={setProgressStats}
                selectedSet={selectedSet}
                onSelectSet={(set) => onSelectSet?.(set)}
            />
        </>
    );
}
