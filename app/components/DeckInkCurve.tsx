import { useMemo } from 'react';
import {
    Box,
    Group,
    Text,
    Badge,
    Tooltip,
    Stack,
    Paper,
    Grid,
    Progress,
} from '@mantine/core';
import { IconDroplet, IconFlame, IconChartBar } from '@tabler/icons-react';
import { calculateDeckStats } from '../utils/deck';

export interface DeckInkCurveProps {
    cards: Array<{
        card: any;
        requiredQty?: number;
        quantity?: number;
    }>;
    title?: string;
    showSummaryRow?: boolean;
}

export function DeckInkCurve({
    cards,
    title = 'Deck Ink Curve & Cost Distribution',
}: DeckInkCurveProps) {
    const stats = useMemo(() => calculateDeckStats(cards), [cards]);

    const costTiers = useMemo(() => {
        const hasZero = Boolean(stats.costDistribution['0']?.count);
        return hasZero
            ? ['0', '1', '2', '3', '4', '5', '6', '7+']
            : ['1', '2', '3', '4', '5', '6', '7+'];
    }, [stats]);

    const maxTierCount = useMemo(() => {
        let max = 1;
        costTiers.forEach((tier) => {
            const count = stats.costDistribution[tier]?.count || 0;
            if (count > max) max = count;
        });
        return max;
    }, [costTiers, stats]);

    if (!cards || cards.length === 0) {
        return (
            <Paper
                p="md"
                radius="md"
                withBorder
                style={{
                    background: 'rgba(10, 15, 29, 0.65)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                }}
            >
                <Text size="sm" c="gray.5">
                    No cards in deck to calculate ink curve.
                </Text>
            </Paper>
        );
    }

    return (
        <Paper
            p="md"
            radius="md"
            withBorder
            style={{
                background:
                    'linear-gradient(180deg, rgba(20, 16, 43, 0.95) 0%, rgba(13, 18, 36, 0.95) 100%)',
                borderColor: 'rgba(168, 85, 247, 0.35)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
        >
            {/* Header with Title & Quick Badge */}
            <Group
                justify="space-between"
                align="center"
                mb="md"
                wrap="wrap"
                gap="xs"
            >
                <Group gap="xs" align="center">
                    <Box
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background:
                                'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <IconChartBar size={18} color="#c084fc" />
                    </Box>
                    <Box>
                        <Text fw={900} size="sm" c="gray.1">
                            {title}
                        </Text>
                        <Text size="11px" c="gray.4">
                            Mana curve histogram & deck composition analysis
                        </Text>
                    </Box>
                </Group>

                <Badge
                    size="sm"
                    variant="light"
                    color="violet"
                    style={{ fontWeight: 800 }}
                >
                    {stats.totalCards} Cards Total
                </Badge>
            </Group>

            {/* 2-Column Responsive Dashboard Layout */}
            <Grid gap="md" align="stretch">
                {/* Left Column: Compact Bar Chart Histogram (~60% width) */}
                <Grid.Col span={{ base: 12, md: 7, lg: 7.5 }}>
                    <Paper
                        p="sm"
                        radius="md"
                        style={{
                            background: 'rgba(10, 14, 26, 0.65)',
                            borderRadius: 12,
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <Group
                            justify="center"
                            align="flex-end"
                            gap="lg"
                            py="xs"
                        >
                            {costTiers.map((tier) => {
                                const detail = stats.costDistribution[tier] || {
                                    count: 0,
                                    inkable: 0,
                                    uninkable: 0,
                                    cards: [],
                                };
                                const tierCount = detail.count;
                                const inkableRatio =
                                    tierCount > 0
                                        ? (detail.inkable / tierCount) * 100
                                        : 0;
                                const uninkableRatio =
                                    tierCount > 0
                                        ? (detail.uninkable / tierCount) * 100
                                        : 0;

                                // Calculate visual bar height (max 85px, min 6px)
                                const barHeight =
                                    tierCount > 0
                                        ? Math.max(
                                              Math.round(
                                                  (tierCount / maxTierCount) *
                                                      85,
                                              ),
                                              20,
                                          )
                                        : 6;

                                return (
                                    <Tooltip
                                        key={tier}
                                        multiline
                                        w={240}
                                        withArrow
                                        label={
                                            <Stack gap={4}>
                                                <Text
                                                    fw={800}
                                                    size="xs"
                                                    c="purple.2"
                                                >
                                                    Cost {tier} Tier (
                                                    {tierCount} Cards)
                                                </Text>
                                                <Text size="10px" c="gray.3">
                                                    {detail.inkable} Inkable •{' '}
                                                    {detail.uninkable} Uninkable
                                                </Text>
                                                <Box mt={2}>
                                                    {detail.cards.length > 0 ? (
                                                        detail.cards.map(
                                                            (c, i) => (
                                                                <Text
                                                                    key={i}
                                                                    size="10px"
                                                                    c={
                                                                        c.card
                                                                            .inkwell
                                                                            ? 'teal.3'
                                                                            : 'red.3'
                                                                    }
                                                                >
                                                                    •{' '}
                                                                    {c.quantity}
                                                                    x{' '}
                                                                    {
                                                                        c.card
                                                                            .name
                                                                    }{' '}
                                                                    (
                                                                    {c.card
                                                                        .inkwell
                                                                        ? 'Inkable'
                                                                        : 'Uninkable'}
                                                                    )
                                                                </Text>
                                                            ),
                                                        )
                                                    ) : (
                                                        <Text
                                                            size="10px"
                                                            c="gray.5"
                                                        >
                                                            No {tier}-cost cards
                                                            in deck
                                                        </Text>
                                                    )}
                                                </Box>
                                            </Stack>
                                        }
                                    >
                                        <Box
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                width: 32,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {/* Card Count Number */}
                                            <Text
                                                size="xs"
                                                fw={800}
                                                c={
                                                    tierCount > 0
                                                        ? 'white'
                                                        : 'gray.6'
                                                }
                                                mb={4}
                                            >
                                                {tierCount > 0
                                                    ? tierCount
                                                    : '-'}
                                            </Text>

                                            {/* Vertical Stacked Bar Column */}
                                            <Box
                                                style={{
                                                    width: 24,
                                                    height: 85,
                                                    display: 'flex',
                                                    alignItems: 'flex-end',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Box
                                                    style={{
                                                        width: '100%',
                                                        height: barHeight,
                                                        borderRadius: 5,
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent:
                                                            'flex-end',
                                                        background:
                                                            tierCount === 0
                                                                ? 'rgba(255, 255, 255, 0.08)'
                                                                : undefined,
                                                        boxShadow:
                                                            tierCount > 0
                                                                ? '0 0 12px rgba(168, 85, 247, 0.35)'
                                                                : undefined,
                                                        transition:
                                                            'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                    }}
                                                >
                                                    {detail.uninkable > 0 && (
                                                        <Box
                                                            style={{
                                                                width: '100%',
                                                                height: `${uninkableRatio}%`,
                                                                background:
                                                                    'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                                                            }}
                                                        />
                                                    )}
                                                    {detail.inkable > 0 && (
                                                        <Box
                                                            style={{
                                                                width: '100%',
                                                                height: `${inkableRatio}%`,
                                                                background:
                                                                    'linear-gradient(180deg, #14b8a6 0%, #0d9488 100%)',
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Cost Orb Pill */}
                                            <Box
                                                mt={6}
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: '50%',
                                                    background:
                                                        tierCount > 0
                                                            ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                                                            : 'rgba(255, 255, 255, 0.08)',
                                                    border:
                                                        tierCount > 0
                                                            ? '1px solid rgba(216, 180, 254, 0.6)'
                                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow:
                                                        tierCount > 0
                                                            ? '0 2px 8px rgba(0,0,0,0.5)'
                                                            : undefined,
                                                }}
                                            >
                                                <Text
                                                    size="10px"
                                                    fw={900}
                                                    c={
                                                        tierCount > 0
                                                            ? 'white'
                                                            : 'gray.5'
                                                    }
                                                >
                                                    {tier}
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </Group>
                    </Paper>
                </Grid.Col>

                {/* Right Column: Deck Breakdown Panel (~40% width) */}
                <Grid.Col span={{ base: 12, md: 5, lg: 4.5 }}>
                    <Stack
                        gap="xs"
                        justify="space-between"
                        style={{ height: '100%' }}
                    >
                        {/* 1. Inkwell Balance Bar */}
                        <Paper
                            p="xs"
                            radius="md"
                            style={{
                                background: 'rgba(10, 14, 26, 0.65)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                        >
                            <Group justify="space-between" mb={4}>
                                <Group gap={4} align="center">
                                    <IconDroplet size={13} color="#14b8a6" />
                                    <Text
                                        size="11px"
                                        fw={800}
                                        c="gray.3"
                                        tt="uppercase"
                                    >
                                        Inkwell Balance
                                    </Text>
                                </Group>
                                <Text size="11px" fw={800} c="teal.3">
                                    {stats.inkablePercentage}% Inkable
                                </Text>
                            </Group>
                            <Progress.Root size="sm" radius="xl">
                                <Progress.Section
                                    value={stats.inkablePercentage}
                                    color="teal.6"
                                />
                                <Progress.Section
                                    value={100 - stats.inkablePercentage}
                                    color="red.6"
                                />
                            </Progress.Root>
                            <Group justify="space-between" mt={4}>
                                <Text size="10px" c="teal.3" fw={700}>
                                    {stats.inkableCount} Inkable
                                </Text>
                                {stats.uninkableCount > 0 ? (
                                    <Text size="10px" c="red.4" fw={700}>
                                        {stats.uninkableCount} Uninkable
                                    </Text>
                                ) : (
                                    <Text size="10px" c="gray.5" fw={700}>
                                        0 Uninkable
                                    </Text>
                                )}
                            </Group>
                        </Paper>

                        {/* 2. Key Metrics Summary */}
                        <Paper
                            p="xs"
                            radius="md"
                            style={{
                                background: 'rgba(10, 14, 26, 0.65)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                        >
                            <Group justify="space-around">
                                <Box style={{ textAlign: 'center' }}>
                                    <Text
                                        size="10px"
                                        c="gray.5"
                                        tt="uppercase"
                                        fw={800}
                                    >
                                        Avg Cost
                                    </Text>
                                    <Text size="sm" fw={900} c="purple.2">
                                        {stats.averageCost}⬡
                                    </Text>
                                </Box>

                                <Box style={{ textAlign: 'center' }}>
                                    <Group gap={3} justify="center">
                                        <IconFlame size={12} color="#38bdf8" />
                                        <Text
                                            size="10px"
                                            c="gray.5"
                                            tt="uppercase"
                                            fw={800}
                                        >
                                            Early Curve (1-2)
                                        </Text>
                                    </Group>
                                    <Text size="sm" fw={900} c="cyan.3">
                                        {stats.earlyCurveCount} Cards (
                                        {stats.totalCards > 0
                                            ? Math.round(
                                                  (stats.earlyCurveCount /
                                                      stats.totalCards) *
                                                      100,
                                              )
                                            : 0}
                                        %)
                                    </Text>
                                </Box>
                            </Group>
                        </Paper>

                        {/* 3. Card Types Breakdown */}
                        {Object.keys(stats.typeDistribution).length > 0 && (
                            <Paper
                                p="xs"
                                radius="md"
                                style={{
                                    background: 'rgba(10, 14, 26, 0.65)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                }}
                            >
                                <Text
                                    size="11px"
                                    fw={800}
                                    c="gray.4"
                                    tt="uppercase"
                                    mb={6}
                                >
                                    Card Types
                                </Text>
                                <Group gap={6} wrap="wrap">
                                    {Object.entries(stats.typeDistribution).map(
                                        ([type, count]) => (
                                            <Badge
                                                key={type}
                                                size="xs"
                                                variant="light"
                                                color={
                                                    type === 'character'
                                                        ? 'violet'
                                                        : type === 'action'
                                                          ? 'blue'
                                                          : type === 'item'
                                                            ? 'amber'
                                                            : type ===
                                                                'location'
                                                              ? 'emerald'
                                                              : 'gray'
                                                }
                                                style={{
                                                    textTransform: 'capitalize',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {type}: {count}
                                            </Badge>
                                        ),
                                    )}
                                </Group>
                            </Paper>
                        )}
                    </Stack>
                </Grid.Col>
            </Grid>
        </Paper>
    );
}
