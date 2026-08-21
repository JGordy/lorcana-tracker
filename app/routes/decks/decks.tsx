import { useNavigate, useFetcher, useSubmit } from 'react-router';
import { useState, useMemo } from 'react';
import { Container } from '@mantine/core';

import { useDeckImport } from './hooks/useDeckImport';
import { useDeckActions } from './hooks/useDeckActions';
import {
    filterDecks,
    getCompletionCounts,
    type CompletionFilter,
    type ProcessedDeck,
} from './utils/deckHelpers';
import { buildCardsLookup } from '../../utils/deck';

import { DecksHeader } from './components/DecksHeader';
import { DecksToolbar } from './components/DecksToolbar';
import { DeckGrid } from './components/DeckGrid';
import { ImportDeckModal } from './components/ImportDeckModal';
import { ViewDeckModal } from './components/ViewDeckModal';
import { ShoppingListModal } from '../../components/ShoppingListModal';

import type { Route } from './+types/decks';

export { loader } from './loader';
export { action } from './action';

export default function Decks({ loaderData }: Route.ComponentProps) {
    const { decks, cards, user, sort, completion = 'all' } = loaderData;
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const cloneFetcher = useFetcher();
    const submit = useSubmit();

    const [searchQuery, setSearchQuery] = useState('');
    const [completionFilter, setCompletionFilter] =
        useState<CompletionFilter>(completion);
    const [viewDeckModalOpen, setViewDeckModalOpen] = useState(false);
    const [viewDeckId, setViewDeckId] = useState<string | null>(null);
    const [deckModalSearch, setDeckModalSearch] = useState('');
    const [deckModalInkFilter, setDeckModalInkFilter] = useState('all');

    const [shoppingListModalOpen, setShoppingListModalOpen] = useState(false);
    const [shoppingListDeck, setShoppingListDeck] =
        useState<ProcessedDeck | null>(null);

    const handleCompletionChange = (val: CompletionFilter) => {
        setCompletionFilter(val);
        const params = new URLSearchParams();
        if (sort && sort !== 'progress') {
            params.set('sort', sort);
        }
        if (val && val !== 'all') {
            params.set('completion', val);
        }
        navigate(`/decks${params.toString() ? `?${params.toString()}` : ''}`);
    };

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

    // Lookups & Processed Decks
    const cardsLookup = useMemo(() => buildCardsLookup(cards), [cards]);

    const completionCounts = useMemo(() => getCompletionCounts(decks), [decks]);

    const processedDecks = useMemo(
        () => filterDecks(decks, searchQuery, cardsLookup, completionFilter),
        [decks, searchQuery, cardsLookup, completionFilter],
    );

    const allCoreDecks = useMemo(
        () =>
            filterDecks(decks, '', cardsLookup, 'all').filter(
                (deck) => deck.isCoreLegal,
            ),
        [decks, cardsLookup],
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
        let list = activeDeckForView.cards;
        const q = deckModalSearch.trim().toLowerCase();
        if (q) {
            list = list.filter((dc) => {
                const nameMatch = dc.card.name.toLowerCase().includes(q);
                const classMatch = (dc.card.classifications || []).some((cl) =>
                    cl.toLowerCase().includes(q),
                );
                const typeMatch = (dc.card.type || []).some((t) =>
                    t.toLowerCase().includes(q),
                );
                return nameMatch || classMatch || typeMatch;
            });
        }
        if (deckModalInkFilter !== 'all') {
            list = list.filter(
                (dc) =>
                    dc.card.ink_color?.toLowerCase().trim() ===
                    deckModalInkFilter,
            );
        }
        return list;
    }, [activeDeckForView, deckModalSearch, deckModalInkFilter]);

    const handleOpenViewModal = (deckId: string) => {
        setViewDeckId(deckId);
        setDeckModalSearch('');
        setDeckModalInkFilter('all');
        setViewDeckModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewDeckModalOpen(false);
        setViewDeckId(null);
    };

    return (
        <Container size="xl" py="lg">
            <DecksHeader
                totalDecksCount={decks.length}
                coreDecksCount={allCoreDecks.length}
                infinityDecksCount={decks.length}
            />

            <DecksToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sort={sort}
                completion={completionFilter}
                onCompletionChange={handleCompletionChange}
                completionCounts={completionCounts}
                navigate={navigate}
                activeCount={processedDecks.length}
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
                inkFilter={deckModalInkFilter}
                onInkFilterChange={setDeckModalInkFilter}
                filteredCards={filteredDeckCardsForView}
                cloneFetcher={cloneFetcher}
                copyFeedback={copyFeedback}
                user={user}
                onCloneDeck={handleCloneDeck}
                onExportDeck={handleExportDeck}
                onQuickAdd={handleQuickAdd}
                onOpenShoppingList={(deck) => {
                    setShoppingListDeck(deck);
                    setShoppingListModalOpen(true);
                }}
            />

            <ShoppingListModal
                opened={shoppingListModalOpen}
                onClose={() => {
                    setShoppingListModalOpen(false);
                    setShoppingListDeck(null);
                }}
                deck={shoppingListDeck}
                user={user}
                onQuickAdd={handleQuickAdd}
            />
        </Container>
    );
}
