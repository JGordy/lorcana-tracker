import { useState, useMemo } from 'react';
import { useSubmit, useFetcher, useNavigate } from 'react-router';
import { Container, Alert, Group, Text, Button } from '@mantine/core';
import { IconAlertTriangle, IconArrowBackUp } from '@tabler/icons-react';

import type { Route } from './+types/my-decks';
import { useMyDecksActions } from './hooks/useMyDecksActions';
import { useMyDecksImport } from './hooks/useMyDecksImport';
import { processMyDecks } from './utils/myDecksHelpers';
import { buildCardsLookup } from '../../utils/deck';

import { MyDecksHero } from './components/MyDecksHero';
import { MyDecksToolbar } from './components/MyDecksToolbar';
import { MyDecksGrid } from './components/MyDecksGrid';

import { MyDecksCreateModal } from './components/modals/MyDecksCreateModal';
import { MyDecksEditModal } from './components/modals/MyDecksEditModal';
import { MyDecksImportModal } from './components/modals/MyDecksImportModal';
import { MyDecksViewModal } from './components/modals/MyDecksViewModal';
import { MyDecksAddCardsModal } from './components/modals/MyDecksAddCardsModal';
import { MyDecksDeleteModal } from './components/modals/MyDecksDeleteModal';

export { loader } from './loader';
export { action } from './action';

export default function MyDecks({ loaderData }: Route.ComponentProps) {
    const { decks: serverDecks, cards, user, sort } = loaderData;
    const submit = useSubmit();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    // Search query state
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state controls
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createFormat, setCreateFormat] = useState<'core' | 'infinity'>(
        'core',
    );
    const [createInks, setCreateInks] = useState<string[]>(['amber', 'ruby']);
    const [createDesc, setCreateDesc] = useState('');

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [deckModalSearch, setDeckModalSearch] = useState('');
    const [deckModalInkFilter, setDeckModalInkFilter] = useState('all');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingDeck, setEditingDeck] = useState<any>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editFormat, setEditFormat] = useState<'core' | 'infinity'>('core');
    const [editInks, setEditInks] = useState<string[]>([]);
    const [editDesc, setEditDesc] = useState('');
    const [editCoverCardId, setEditCoverCardId] = useState('auto');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingDeck, setDeletingDeck] = useState<any>(null);

    const [addCardsModalOpen, setAddCardsModalOpen] = useState(false);
    const [cardSearchQuery, setCardSearchQuery] = useState('');
    const [cardInkFilter, setCardInkFilter] = useState('all');
    const [cardTypeFilter, setCardTypeFilter] = useState('all');
    const [onlyCoreFilter, setOnlyCoreFilter] = useState(false);

    // Custom actions hook
    const {
        localDecks,
        undoState,
        copyFeedback,
        handleCreateDeck,
        handleSaveDeckDetails,
        handleAdjustQuantity,
        handleRemoveCard,
        handleUndo,
        handleAddCardToDeck,
        handleDeleteDeck,
        handleExportDeck,
        handleQuickAdd,
    } = useMyDecksActions({
        decks: serverDecks,
        cards,
        user,
        submit,
        fetcher,
    });

    // Lookups & Processed Decks
    const cardsLookup = useMemo(() => buildCardsLookup(cards), [cards]);
    const processedDecks = useMemo(
        () => processMyDecks(localDecks, searchQuery, cardsLookup),
        [localDecks, searchQuery, cardsLookup],
    );

    // Custom import hook
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
    } = useMyDecksImport({
        cards,
        submit,
        userId: user?.$id,
    });

    // Filtered decks for grid
    const filteredDecks = useMemo(() => {
        if (!searchQuery.trim()) return processedDecks;
        const q = searchQuery.toLowerCase().trim();
        return processedDecks.filter(
            (d) =>
                d.title.toLowerCase().includes(q) ||
                d.meta.description?.toLowerCase().includes(q),
        );
    }, [processedDecks, searchQuery]);

    const activeDeckForView = useMemo(
        () => processedDecks.find((d) => d.$id === activeDeckId) || null,
        [processedDecks, activeDeckId],
    );

    const filteredDeckCardsForView = useMemo(() => {
        if (!activeDeckForView) return [];
        let list = activeDeckForView.cards;
        if (deckModalSearch.trim()) {
            const q = deckModalSearch.toLowerCase().trim();
            list = list.filter((dc: any) =>
                dc.card.name.toLowerCase().includes(q),
            );
        }
        if (deckModalInkFilter !== 'all') {
            list = list.filter(
                (dc: any) =>
                    dc.card.ink_color?.toLowerCase().trim() ===
                    deckModalInkFilter,
            );
        }
        return list;
    }, [activeDeckForView, deckModalSearch, deckModalInkFilter]);

    const filteredCatalogCards = useMemo(() => {
        let list = cards;
        if (cardSearchQuery.trim()) {
            const q = cardSearchQuery.toLowerCase().trim();
            list = list.filter((c) => c.name.toLowerCase().includes(q));
        }
        if (cardInkFilter !== 'all') {
            list = list.filter(
                (c) => c.ink_color?.toLowerCase().trim() === cardInkFilter,
            );
        }
        if (cardTypeFilter !== 'all') {
            list = list.filter((c) => c.type?.includes(cardTypeFilter));
        }
        if (onlyCoreFilter) {
            list = list.filter((c) => c.formats?.includes('core'));
        }
        return list;
    }, [cards, cardSearchQuery, cardInkFilter, cardTypeFilter, onlyCoreFilter]);

    const activeDeckCardsMap = useMemo(() => {
        const map = new Map<string, number>();
        if (activeDeckForView) {
            activeDeckForView.cards.forEach((dc: any) => {
                map.set(dc.card.id || dc.card.$id, dc.requiredQty);
            });
        }
        return map;
    }, [activeDeckForView]);

    const totalDecksCount = localDecks.length;
    const readyToPlayCount = processedDecks.filter(
        (d) => d.progress.percentage >= 100,
    ).length;
    const inProgressCount = totalDecksCount - readyToPlayCount;

    return (
        <Container size="xl" py="xl">
            {/* Undo Notification Banner */}
            {undoState && (
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    color="amber"
                    mb="lg"
                    title="Deck Modified"
                >
                    <Group justify="space-between" align="center">
                        <Text size="sm">Deck change applied.</Text>
                        <Button
                            size="xs"
                            variant="light"
                            color="amber"
                            leftSection={<IconArrowBackUp size={14} />}
                            onClick={handleUndo}
                        >
                            Undo Action
                        </Button>
                    </Group>
                </Alert>
            )}

            {/* Hero Section */}
            <MyDecksHero
                totalDecksCount={totalDecksCount}
                readyToPlayCount={readyToPlayCount}
                inProgressCount={inProgressCount}
                onOpenCreateModal={() => setCreateModalOpen(true)}
                onOpenImportModal={() => setImportModalOpen(true)}
            />

            {/* Sticky Filter Toolbar */}
            <MyDecksToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sort={sort}
                navigate={navigate}
                activeCount={filteredDecks.length}
            />

            {/* Main Cards Grid */}
            <MyDecksGrid
                decks={filteredDecks}
                searchQuery={searchQuery}
                copyFeedback={copyFeedback}
                onOpenCreateModal={() => setCreateModalOpen(true)}
                onOpenViewModal={(id) => {
                    setActiveDeckId(id);
                    setViewModalOpen(true);
                }}
                onOpenEditModal={(deck) => {
                    setEditingDeck(deck);
                    setEditTitle(deck.title);
                    setEditInks(deck.meta.inks);
                    setEditFormat(deck.meta.format);
                    setEditDesc(deck.meta.description);
                    setEditCoverCardId(deck.meta.coverCardId || 'auto');
                    setEditModalOpen(true);
                }}
                onOpenDeleteModal={(deck) => {
                    setDeletingDeck(deck);
                    setDeleteModalOpen(true);
                }}
                onExportDeck={handleExportDeck}
            />

            {/* 1. Create Deck Modal */}
            <MyDecksCreateModal
                opened={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title={createTitle}
                onTitleChange={setCreateTitle}
                format={createFormat}
                onFormatChange={setCreateFormat}
                inks={createInks}
                onInksChange={setCreateInks}
                description={createDesc}
                onDescriptionChange={setCreateDesc}
                onSave={() => {
                    handleCreateDeck(
                        createTitle,
                        createFormat,
                        createInks,
                        createDesc,
                    );
                    setCreateModalOpen(false);
                    setCreateTitle('');
                }}
            />

            {/* 2. Edit Deck Modal */}
            <MyDecksEditModal
                opened={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title={editTitle}
                onTitleChange={setEditTitle}
                format={editFormat}
                onFormatChange={setEditFormat}
                inks={editInks}
                onInksChange={setEditInks}
                description={editDesc}
                onDescriptionChange={setEditDesc}
                coverCardId={editCoverCardId}
                onCoverCardIdChange={setEditCoverCardId}
                deckCards={editingDeck?.cards || []}
                onSave={() => {
                    if (editingDeck) {
                        handleSaveDeckDetails(
                            editingDeck,
                            editTitle,
                            editFormat,
                            editInks,
                            editDesc,
                            editCoverCardId,
                        );
                        setEditModalOpen(false);
                    }
                }}
            />

            {/* 3. Import Decklist Modal */}
            <MyDecksImportModal
                opened={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                title={importTitle}
                onTitleChange={setImportTitle}
                text={importText}
                onTextChange={setImportText}
                error={importError}
                parsedResults={parsedResults}
                onValidate={handleValidateImport}
                onSubmit={handleSubmitImport}
            />

            {/* 4. View & Manage Deck Modal */}
            <MyDecksViewModal
                opened={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                activeDeck={activeDeckForView}
                searchQuery={deckModalSearch}
                onSearchChange={setDeckModalSearch}
                inkFilter={deckModalInkFilter}
                onInkFilterChange={setDeckModalInkFilter}
                filteredCards={filteredDeckCardsForView}
                copyFeedback={copyFeedback}
                onOpenAddCardsModal={() => setAddCardsModalOpen(true)}
                onOpenEditModal={(deck) => {
                    setEditingDeck(deck);
                    setEditTitle(deck.title);
                    setEditInks(deck.meta.inks);
                    setEditFormat(deck.meta.format);
                    setEditDesc(deck.meta.description);
                    setEditCoverCardId(deck.meta.coverCardId || 'auto');
                    setEditModalOpen(true);
                }}
                onExportDeck={handleExportDeck}
                onUpdateCardQty={(deck, cardId, delta) => {
                    handleAdjustQuantity(deck, cardId, delta);
                }}
                onQuickAdd={handleQuickAdd}
                onRemoveCard={(deck, card) => {
                    const existing = deck.cards.find(
                        (c: any) =>
                            c.card.id === card.id || c.card.$id === card.id,
                    );
                    handleRemoveCard(deck, card, existing?.requiredQty || 1);
                }}
            />

            {/* 5. Add Cards Modal */}
            <MyDecksAddCardsModal
                opened={addCardsModalOpen}
                onClose={() => setAddCardsModalOpen(false)}
                searchQuery={cardSearchQuery}
                onSearchQueryChange={setCardSearchQuery}
                inkFilter={cardInkFilter}
                onInkFilterChange={setCardInkFilter}
                typeFilter={cardTypeFilter}
                onTypeFilterChange={setCardTypeFilter}
                onlyCoreFilter={onlyCoreFilter}
                onOnlyCoreFilterChange={setOnlyCoreFilter}
                filteredCards={filteredCatalogCards}
                activeDeckCardsMap={activeDeckCardsMap}
                onUpdateCardQty={(cardId, delta) => {
                    if (!activeDeckForView) return;
                    const card = cards.find(
                        (c) => c.id === cardId || c.$id === cardId,
                    );
                    if (card) {
                        const existingQty = activeDeckCardsMap.get(cardId) || 0;
                        if (existingQty === 0 && delta > 0) {
                            handleAddCardToDeck(activeDeckForView.$id, card);
                        } else {
                            handleAdjustQuantity(
                                activeDeckForView,
                                cardId,
                                delta,
                            );
                        }
                    }
                }}
            />

            {/* 6. Delete Deck Modal */}
            <MyDecksDeleteModal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                deckTitle={deletingDeck?.title || ''}
                onConfirmDelete={() => {
                    if (deletingDeck) {
                        handleDeleteDeck(deletingDeck);
                        setDeleteModalOpen(false);
                    }
                }}
            />
        </Container>
    );
}
