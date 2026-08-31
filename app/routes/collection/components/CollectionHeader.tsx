import { useState } from 'react';
import {
    Paper,
    Group,
    Box,
    Title,
    Text,
    SimpleGrid,
    Card,
    Badge,
    Tooltip,
} from '@mantine/core';
import { IconCards } from '@tabler/icons-react';
import type { CollectionValuationResult } from '../../../utils/valuation';
import { formatCurrency } from '../../../utils/valuation';
import { CrownJewelsDrawer } from './CrownJewelsDrawer';

export interface CollectionHeaderProps {
    totals: {
        totalCardsOwned: number;
        uniqueCardsCount: number;
    };
    valuation?: CollectionValuationResult;
    totalCatalogCards: number;
}

export function CollectionHeader({
    totals,
    valuation,
    totalCatalogCards,
}: CollectionHeaderProps) {
    const [crownJewelsOpened, setCrownJewelsOpened] = useState(false);

    const completionPercentage =
        totalCatalogCards > 0
            ? Math.round((totals.uniqueCardsCount / totalCatalogCards) * 100)
            : 0;

    const totalVal = valuation?.totalValue ?? 0;
    const stdVal = valuation?.standardValue ?? 0;
    const foilVal = valuation?.foilValue ?? 0;
    const topGems = valuation?.topGems ?? [];

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
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text
                                size="10px"
                                c="violet.4"
                                fw={600}
                                tt="uppercase"
                            >
                                Completion
                            </Text>
                            <Text size="lg" fw={800} c="violet.3" mt={2}>
                                {`${completionPercentage}%`}
                                <Text
                                    component="span"
                                    size="10px"
                                    c="dimmed"
                                    fw={500}
                                    ml={4}
                                >
                                    ({totals.uniqueCardsCount} /{' '}
                                    {totalCatalogCards})
                                </Text>
                            </Text>
                        </Card>

                        {/* Portfolio Valuation Card */}
                        <Card
                            padding="xs"
                            radius="md"
                            bg="linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)"
                            withBorder
                            style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}
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
                                        <Badge
                                            size="xs"
                                            variant="gradient"
                                            gradient={{
                                                from: 'yellow.6',
                                                to: 'amber.7',
                                                deg: 90,
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '0 5px',
                                            }}
                                            onClick={() =>
                                                setCrownJewelsOpened(true)
                                            }
                                        >
                                            💎 Gems
                                        </Badge>
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
        </>
    );
}
