import { Tabs, SimpleGrid, Paper, Text } from '@mantine/core';
import { IconCards, IconInfinity } from '@tabler/icons-react';
import type { useFetcher } from 'react-router';
import type { ProcessedDeck } from '../utils/deckHelpers';
import { DeckCardItem } from './DeckCardItem';

interface DeckGridProps {
    coreDecks: ProcessedDeck[];
    infinityDecks: ProcessedDeck[];
    cloneFetcher: ReturnType<typeof useFetcher>;
    copyFeedback: string | null;
    onOpenViewModal: (deckId: string) => void;
    onCloneDeck: (deck: ProcessedDeck) => void;
    onExportDeck: (deck: ProcessedDeck) => void;
    onOpenPlaytest?: (deck: ProcessedDeck) => void;
}

export function DeckGrid({
    coreDecks,
    infinityDecks,
    cloneFetcher,
    copyFeedback,
    onOpenViewModal,
    onCloneDeck,
    onExportDeck,
    onOpenPlaytest,
}: DeckGridProps) {
    const renderList = (decksToRender: ProcessedDeck[]) => {
        if (decksToRender.length === 0) {
            return (
                <Paper
                    p="xl"
                    radius="md"
                    withBorder
                    style={{
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        borderColor: 'rgba(168, 85, 247, 0.25)',
                        background: 'rgba(15, 23, 42, 0.4)',
                    }}
                >
                    <Text c="gray.5" size="sm">
                        No decks found matching your filters in this format.
                    </Text>
                </Paper>
            );
        }

        return (
            <SimpleGrid
                cols={{
                    base: 1,
                    sm: 2,
                    md: 3,
                    lg: 4,
                }}
                spacing="lg"
            >
                {decksToRender.map((deck) => (
                    <DeckCardItem
                        key={deck.$id}
                        deck={deck}
                        cloneFetcher={cloneFetcher}
                        copyFeedback={copyFeedback}
                        onOpenViewModal={onOpenViewModal}
                        onCloneDeck={onCloneDeck}
                        onExportDeck={onExportDeck}
                        onOpenPlaytest={onOpenPlaytest}
                    />
                ))}
            </SimpleGrid>
        );
    };

    return (
        <Tabs
            defaultValue="core"
            color="violet"
            className="deck-format-tabs"
            mt="md"
            mb="xl"
        >
            <Tabs.List>
                <Tabs.Tab value="core" leftSection={<IconCards size={18} />}>
                    Core Constructed ({coreDecks.length})
                </Tabs.Tab>
                <Tabs.Tab
                    value="infinity"
                    leftSection={<IconInfinity size={18} />}
                >
                    Infinity Constructed ({infinityDecks.length})
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="core">{renderList(coreDecks)}</Tabs.Panel>
            <Tabs.Panel value="infinity">
                {renderList(infinityDecks)}
            </Tabs.Panel>
        </Tabs>
    );
}
