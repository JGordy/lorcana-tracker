import {
    useLoaderData,
    useNavigate,
    useFetcher,
    useSubmit,
} from 'react-router';
import { useState, useMemo } from 'react';
import { Container } from '@mantine/core';

import { useDeckImport } from './hooks/useDeckImport';
import { useDeckActions } from './hooks/useDeckActions';
import { filterDecks } from './utils/deckHelpers';

import { DecksHeader } from './components/DecksHeader';
import { DeckGrid } from './components/DeckGrid';
import { ImportDeckModal } from './components/ImportDeckModal';
import { ViewDeckModal } from './components/ViewDeckModal';

import { loader } from './loader';

export { loader };
export { action } from './action';

export default function Decks() {
    const { decks, cards, user, sort } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const cloneFetcher = useFetcher();
    const submit = useSubmit();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewDeckModalOpen, setViewDeckModalOpen] = useState(false);
    const [viewDeckId, setViewDeckId] = useState<string | null>(null);
    const [deckModalSearch, setDeckModalSearch] = useState('');

    const {
        importModalOpen,
        setImportModalOpen,
        importTitle,
        setImportTitle,
        importText,
        setImportText,
        importError,
        parsedResults,
        handleValidateImport,
        handleSubmitImport,
    } = useDeckImport({
        cards,
        submit,
        userId: user?.$id,
    });

    const { copyFeedback, handleCloneDeck, handleExportDeck, handleQuickAdd } =
        useDeckActions({
            user,
            fetcher,
            cloneFetcher,
        });

    // Process and filter decks
    const processedDecks = useMemo(
        () => filterDecks(decks, searchQuery),
        [decks, searchQuery],
    );

    const coreDecks = useMemo(
        () => processedDecks.filter((deck) => deck.isCoreLegal),
        [processedDecks],
    );
    const infinityDecks = processedDecks;

    const activeDeckForView = useMemo(() => {
        if (!viewDeckId) return null;
        return processedDecks.find((d) => d.$id === viewDeckId) || null;
    }, [viewDeckId, processedDecks]);

    const filteredDeckCardsForView = useMemo(() => {
        if (!activeDeckForView) return [];
        const q = deckModalSearch.trim().toLowerCase();
        return activeDeckForView.cards.filter((dc) => {
            if (q) {
                const nameMatch = dc.card.name.toLowerCase().includes(q);
                const classMatch = (dc.card.classifications || []).some((cl) =>
                    cl.toLowerCase().includes(q),
                );
                const typeMatch = (dc.card.type || []).some((t) =>
                    t.toLowerCase().includes(q),
                );
                if (!nameMatch && !classMatch && !typeMatch) return false;
            }
            return true;
        });
    }, [activeDeckForView, deckModalSearch]);

    const handleOpenViewModal = (deckId: string) => {
        setViewDeckId(deckId);
        setDeckModalSearch('');
        setViewDeckModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewDeckModalOpen(false);
        setViewDeckId(null);
    };

    return (
        <Container size="lg" py="xl">
            <DecksHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sort={sort}
                navigate={navigate}
                user={user}
                onOpenImportModal={() => setImportModalOpen(true)}
            />

            <DeckGrid
                coreDecks={coreDecks}
                infinityDecks={infinityDecks}
                cloneFetcher={cloneFetcher}
                copyFeedback={copyFeedback}
                onOpenViewModal={handleOpenViewModal}
                onCloneDeck={handleCloneDeck}
                onExportDeck={handleExportDeck}
            />

            <ImportDeckModal
                opened={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                importTitle={importTitle}
                setImportTitle={setImportTitle}
                importText={importText}
                setImportText={setImportText}
                importError={importError}
                parsedResults={parsedResults}
                onValidate={handleValidateImport}
                onSubmit={handleSubmitImport}
            />

            <ViewDeckModal
                opened={viewDeckModalOpen}
                onClose={handleCloseViewModal}
                activeDeck={activeDeckForView}
                searchQuery={deckModalSearch}
                setSearchQuery={setDeckModalSearch}
                filteredCards={filteredDeckCardsForView}
                cloneFetcher={cloneFetcher}
                copyFeedback={copyFeedback}
                user={user}
                onCloneDeck={handleCloneDeck}
                onExportDeck={handleExportDeck}
                onQuickAdd={handleQuickAdd}
            />
        </Container>
    );
}
