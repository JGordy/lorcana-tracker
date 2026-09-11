import { Box, Text, Group, Badge, Progress } from '@mantine/core';
import { formatCurrency } from '../utils/valuation';

export interface DeckCostSummaryProps {
    totalDeckCost?: number;
    costToFinish?: number;
}

export function DeckCostSummary({
    totalDeckCost = 0,
    costToFinish = 0,
}: DeckCostSummaryProps) {
    if (totalDeckCost <= 0) return null;

    return (
        <Box style={{ textAlign: 'right' }}>
            <Text size="10px" fw={800} c="yellow.4" tt="uppercase">
                Est. Value: {formatCurrency(totalDeckCost)}
            </Text>
            {costToFinish > 0 && (
                <Text size="10px" fw={700} c="red.4">
                    Need: {formatCurrency(costToFinish)}
                </Text>
            )}
        </Box>
    );
}

export interface DeckCompletionProgressProps {
    ownedCount: number;
    totalCount: number;
    percentage: number;
    width?: number | string;
}

export function DeckCompletionProgress({
    ownedCount,
    totalCount,
    percentage,
    width = 180,
}: DeckCompletionProgressProps) {
    const color =
        percentage >= 80 ? 'teal' : percentage >= 50 ? 'yellow' : 'red';

    return (
        <Box style={{ width }}>
            <Group justify="space-between" align="center" mb={4}>
                <Text size="10px" fw={800} c="gray.4" tt="uppercase">
                    Completion
                </Text>
                <Badge
                    size="xs"
                    variant="light"
                    color={color}
                    radius="sm"
                    style={{ fontWeight: 800 }}
                >
                    {ownedCount}/{totalCount} ({percentage}%)
                </Badge>
            </Group>
            <Progress
                value={percentage}
                color={color}
                size="xs"
                radius="xl"
                striped
            />
        </Box>
    );
}

export interface DeckHeaderMetricsProps {
    totalDeckCost?: number;
    costToFinish?: number;
    progress?: {
        ownedCount: number;
        totalCount: number;
        percentage: number;
    };
}

export function DeckHeaderMetrics({
    totalDeckCost = 0,
    costToFinish = 0,
    progress,
}: DeckHeaderMetricsProps) {
    return (
        <Group gap="md" align="center" style={{ marginLeft: 'auto' }}>
            <DeckCostSummary
                totalDeckCost={totalDeckCost}
                costToFinish={costToFinish}
            />
            {progress && (
                <DeckCompletionProgress
                    ownedCount={progress.ownedCount}
                    totalCount={progress.totalCount}
                    percentage={progress.percentage}
                />
            )}
        </Group>
    );
}
