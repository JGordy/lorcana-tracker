import { SimpleGrid, Card, Stack, Text, Button } from '@mantine/core';
import { IconFolderPlus } from '@tabler/icons-react';
import { MyDeckCardItem } from './MyDeckCardItem';

interface MyDecksGridProps {
    decks: any[];
    searchQuery: string;
    copyFeedback: string | null;
    onOpenCreateModal: () => void;
    onOpenViewModal: (deckId: string) => void;
    onOpenEditModal: (deck: any) => void;
    onOpenDeleteModal: (deck: any) => void;
    onExportDeck: (deck: any) => void;
    onOpenAddCardsModal?: (deck: any) => void;
}

export function MyDecksGrid({
    decks,
    searchQuery,
    copyFeedback,
    onOpenCreateModal,
    onOpenViewModal,
    onOpenEditModal,
    onOpenDeleteModal,
    onExportDeck,
    onOpenAddCardsModal,
}: MyDecksGridProps) {
    if (decks.length === 0) {
        return (
            <Card
                padding="xl"
                radius="lg"
                style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderColor: 'rgba(168, 85, 247, 0.15)',
                    textAlign: 'center',
                }}
                withBorder
            >
                <Stack align="center" gap="md" py="xl">
                    <IconFolderPlus
                        size={48}
                        style={{ opacity: 0.4, color: '#a855f7' }}
                    />
                    <Text size="lg" fw={700} c="gray.2">
                        {searchQuery
                            ? 'No decks match your filter'
                            : 'No personal decks yet'}
                    </Text>
                    <Text size="sm" c="gray.4" style={{ maxWidth: 450 }}>
                        {searchQuery
                            ? `Try clearing your search query "${searchQuery}" to view all decks.`
                            : 'Create a new deck from scratch or import a decklist to start tracking completion against your card collection!'}
                    </Text>
                    {!searchQuery && (
                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet.6', to: 'indigo.6' }}
                            radius="md"
                            leftSection={<IconFolderPlus size={16} />}
                            onClick={onOpenCreateModal}
                            mt="xs"
                        >
                            Create Your First Deck
                        </Button>
                    )}
                </Stack>
            </Card>
        );
    }

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {decks.map((deck) => (
                <MyDeckCardItem
                    key={deck.$id}
                    deck={deck}
                    copyFeedback={copyFeedback}
                    onOpenViewModal={onOpenViewModal}
                    onOpenEditModal={onOpenEditModal}
                    onOpenDeleteModal={onOpenDeleteModal}
                    onExportDeck={onExportDeck}
                    onOpenAddCardsModal={onOpenAddCardsModal}
                />
            ))}
        </SimpleGrid>
    );
}
