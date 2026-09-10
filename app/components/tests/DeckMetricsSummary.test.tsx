import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import {
    DeckCostSummary,
    DeckCompletionProgress,
    DeckHeaderMetrics,
} from '../DeckMetricsSummary';

describe('DeckMetricsSummary', () => {
    describe('DeckCostSummary', () => {
        it('renders estimated value and cost to finish when values are positive', () => {
            render(
                <MantineProvider>
                    <DeckCostSummary
                        totalDeckCost={120.5}
                        costToFinish={45.0}
                    />
                </MantineProvider>,
            );

            expect(screen.getByText(/Est\. Value:/i)).toBeInTheDocument();
            expect(screen.getByText(/\$120\.50/i)).toBeInTheDocument();
            expect(screen.getByText(/Need:/i)).toBeInTheDocument();
            expect(screen.getByText(/\$45\.00/i)).toBeInTheDocument();
        });

        it('does not render if totalDeckCost is 0 or negative', () => {
            render(
                <MantineProvider>
                    <DeckCostSummary totalDeckCost={0} costToFinish={0} />
                </MantineProvider>,
            );

            expect(screen.queryByText(/Est\. Value/i)).toBeNull();
        });
    });

    describe('DeckCompletionProgress', () => {
        it('renders progress percentage and owned count correctly', () => {
            render(
                <MantineProvider>
                    <DeckCompletionProgress
                        ownedCount={45}
                        totalCount={60}
                        percentage={75}
                    />
                </MantineProvider>,
            );

            expect(screen.getByText('Completion')).toBeInTheDocument();
            expect(screen.getByText('45/60 (75%)')).toBeInTheDocument();
        });
    });

    describe('DeckHeaderMetrics', () => {
        it('renders combined cost and progress bar', () => {
            render(
                <MantineProvider>
                    <DeckHeaderMetrics
                        totalDeckCost={200}
                        costToFinish={50}
                        progress={{
                            ownedCount: 50,
                            totalCount: 60,
                            percentage: 83,
                        }}
                    />
                </MantineProvider>,
            );

            expect(screen.getByText(/Est\. Value:/i)).toBeInTheDocument();
            expect(screen.getByText('50/60 (83%)')).toBeInTheDocument();
        });
    });
});
