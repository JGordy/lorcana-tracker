import { Tabs, SimpleGrid, Card, Text } from '@mantine/core';
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
}

export function DeckGrid({
    coreDecks,
    infinityDecks,
    cloneFetcher,
    copyFeedback,
    onOpenViewModal,
    onCloneDeck,
    onExportDeck,
}: DeckGridProps) {
    const renderList = (decksToRender: ProcessedDeck[]) => {
        if (decksToRender.length === 0) {
            return (
                <Card
                    padding="xl"
                    radius="md"
                    withBorder
                    bg="dark.8"
                    style={{ textAlign: 'center', borderStyle: 'dashed' }}
                >
                    <Text c="gray.5" size="sm">
                        No decks found matching your filters in this format.
                    </Text>
                </Card>
            );
        }

        return (
            <SimpleGrid
                cols={{
                    base: 1,
                    xs: 1,
                    sm: 2,
                    md: 3,
                    lg: 4,
                    xl: 4,
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
                    />
                ))}
            </SimpleGrid>
        );
    };

    return (
        <Tabs
            defaultValue="core"
            color="violet"
            variant="outline"
            mt="md"
            mb="xl"
        >
            <Tabs.List
                style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                mb="md"
            >
                <Tabs.Tab
                    value="core"
                    leftSection={<IconCards size={16} />}
                    style={{ fontWeight: 600 }}
                >
                    Core Constructed ({coreDecks.length})
                </Tabs.Tab>
                <Tabs.Tab
                    value="infinity"
                    leftSection={<IconInfinity size={16} />}
                    style={{ fontWeight: 600 }}
                >
                    Infinity Constructed ({infinityDecks.length})
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="core">{renderList(coreDecks)}</Tabs.Panel>
            <Tabs.Panel value="infinity">{renderList(infinityDecks)}</Tabs.Panel>
        </Tabs>
    );
}
