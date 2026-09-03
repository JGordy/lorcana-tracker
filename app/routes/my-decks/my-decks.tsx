import { useState, useMemo } from 'react';
import { useSubmit, useFetcher, useNavigate } from 'react-router';
import { Container, Alert, Group, Text, Button } from '@mantine/core';
import { IconAlertTriangle, IconArrowBackUp } from '@tabler/icons-react';

import type { Route } from './+types/my-decks';
import { useMyDecksActions } from './hooks/useMyDecksActions';
import { useMyDecksImport } from './hooks/useMyDecksImport';
import { processMyDecks } from './utils/myDecksHelpers';
import { buildCardsLookup } from '../../utils/deck';
import { calculatePhysicalDeckAudit } from '../../utils/deckAudit';

import { MyDecksHero } from './components/MyDecksHero';
import { MyDecksToolbar } from './components/MyDecksToolbar';
import { MyDecksGrid } from './components/MyDecksGrid';

import { MyDecksCreateModal } from './components/modals/MyDecksCreateModal';
import { MyDecksEditModal } from './components/modals/MyDecksEditModal';
import { MyDecksImportModal } from './components/modals/MyDecksImportModal';
import { MyDecksViewModal } from './components/modals/MyDecksViewModal';
import { MyDecksAddCardsModal } from './components/modals/MyDecksAddCardsModal';
import { MyDecksDeleteModal } from './components/modals/MyDecksDeleteModal';
import { PhysicalDeckAuditModal } from './components/modals/PhysicalDeckAuditModal';
import { CardSubstitutionModal } from '../../components/substitutions/CardSubstitutionModal';
import { ShoppingListModal } from '../../components/ShoppingListModal';
import { PlaytestModal } from '../../components/PlaytestModal';

export { loader } from './loader';
export { action } from './action';

export default function MyDecks({ loaderData }: Route.ComponentProps) {
    const {
        decks: serverDecks,
        cards,
        userCollection = [],
        user,
        sort,
    } = loaderData;
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
    const [createInks, setCreateInks] = useState<string[]>([]);
    const [createDesc, setCreateDesc] = useState('');

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [deckModalSearch, setDeckModalSearch] = useState('');
    const [deckModalInkFilter, setDeckModalInkFilter] = useState('all');

    const [auditModalOpen, setAuditModalOpen] = useState(false);

    const [shoppingListModalOpen, setShoppingListModalOpen] = useState(false);
    const [shoppingListDeck, setShoppingListDeck] = useState<any>(null);

    const [playtestModalOpen, setPlaytestModalOpen] = useState(false);
    const [playtestDeck, setPlaytestDeck] = useState<any>(null);

    const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
    const [substitutionTargetCard, setSubstitutionTargetCard] =
        useState<any>(null);
    const [substitutionDeck, setSubstitutionDeck] = useState<any>(null);

    const handleOpenPlaytest = (deck: any) => {
        setPlaytestDeck(deck);
        setViewModalOpen(false); // Seamless transition: no stacked modals
        setPlaytestModalOpen(true);
    };

    const handleOpenSubstitutions = (card: any, deck?: any) => {
        setSubstitutionTargetCard(card);
        setSubstitutionDeck(deck || activeDeckForView);
        setSubstitutionModalOpen(true);
    };

    const handleOpenAddCardsModal = (deck: any) => {
        setActiveDeckId(deck.$id);
        setCardSearchQuery('');
        setCardTypeFilter('all');
        const deckInks =
            deck.displayInks && deck.displayInks.length > 0
                ? deck.displayInks
                : deck.meta?.inks || [];
        setCardInkFilter(deckInks.length > 0 ? 'deck' : 'all');
        setOnlyCoreFilter(deck.meta?.format !== 'infinity');
        setAddCardsModalOpen(true);
    };

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
        handleToggleDeckActive,
        handleAdjustQuantity,
        handleRemoveCard,
        handleUndo,
        handleAddCardToDeck,
        handleSwapCardInDeck,
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

    const inventoryMap = useMemo(() => {
        const map = new Map<string, number>();
        if (userCollection && userCollection.length > 0) {
            for (const item of userCollection) {
                if (item.card_id) {
                    map.set(
                        item.card_id,
                        (map.get(item.card_id) || 0) + (item.quantity || 0),
                    );
                }
            }
        }
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('lorcana_user_inventory');
                if (stored) {
                    const parsed: Array<{ card_id: string; quantity: number }> =
                        JSON.parse(stored);
                    const localMap = new Map<string, number>();
                    for (const item of parsed) {
                        if (item.card_id) {
                            localMap.set(
                                item.card_id,
                                (localMap.get(item.card_id) || 0) +
                                    (item.quantity || 0),
                            );
                        }
                    }
                    for (const [cardId, localQty] of localMap.entries()) {
                        map.set(
                            cardId,
                            Math.max(map.get(cardId) || 0, localQty),
                        );
                    }
                }
            } catch {
                // Ignore
            }
        }
        return map;
    }, [userCollection]);

    const processedDecks = useMemo(
        () =>
            processMyDecks(localDecks, searchQuery, cardsLookup, inventoryMap),
        [localDecks, searchQuery, cardsLookup, inventoryMap],
    );

    // Active (Physically Built) decks and conflict detection audit calculation
    const activeDecks = useMemo(
        () => processedDecks.filter((d) => d.is_active),
        [processedDecks],
    );

    const auditResult = useMemo(
        () =>
            calculatePhysicalDeckAudit(
                activeDecks,
                userCollection,
                cards,
                inventoryMap,
            ),
        [activeDecks, userCollection, cards, inventoryMap],
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
        if (cardInkFilter === 'deck') {
            const deckInks =
                activeDeckForView?.displayInks &&
                activeDeckForView.displayInks.length > 0
                    ? activeDeckForView.displayInks
                    : activeDeckForView?.meta?.inks || [];
            if (deckInks.length > 0) {
                const normalizedInks = deckInks.map((i: string) =>
                    i.toLowerCase().trim(),
                );
                list = list.filter((c) => {
                    const cardInk = c.ink_color?.toLowerCase().trim();
                    if (!cardInk) return false;
                    const cInks = cardInk
                        .split('/')
                        .map((s: string) => s.trim());
                    return cInks.some((ci: string) =>
                        normalizedInks.includes(ci),
                    );
                });
            }
        } else if (cardInkFilter !== 'all') {
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
    }, [
        cards,
        cardSearchQuery,
        cardInkFilter,
        cardTypeFilter,
        onlyCoreFilter,
        activeDeckForView,
    ]);

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
        <Container size="xl" py="lg">
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
            />

            {/* Sticky Filter Toolbar with Actions */}
            <MyDecksToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sort={sort}
                navigate={navigate}
                activeCount={filteredDecks.length}
                user={user}
                onOpenCreateModal={() => setCreateModalOpen(true)}
                onOpenImportModal={() => setImportModalOpen(true)}
                onOpenAuditModal={() => setAuditModalOpen(true)}
                conflictCount={auditResult.totalConflictCardsCount}
                physicallyBuiltCount={activeDecks.length}
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
                onOpenAddCardsModal={handleOpenAddCardsModal}
                onOpenPlaytest={handleOpenPlaytest}
                onToggleActive={handleToggleDeckActive}
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
                onOpenAddCardsModal={() => {
                    if (activeDeckForView) {
                        handleOpenAddCardsModal(activeDeckForView);
                    } else {
                        setAddCardsModalOpen(true);
                    }
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
                onOpenShoppingList={(deck) => {
                    setShoppingListDeck(deck);
                    setShoppingListModalOpen(true);
                }}
                onOpenPlaytest={handleOpenPlaytest}
                onOpenSubstitutions={(card) =>
                    handleOpenSubstitutions(card, activeDeckForView)
                }
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
                deckInks={
                    activeDeckForView?.displayInks &&
                    activeDeckForView.displayInks.length > 0
                        ? activeDeckForView.displayInks
                        : activeDeckForView?.meta?.inks || []
                }
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

            {/* 7. Shopping List / Missing Cards Modal */}
            <ShoppingListModal
                opened={shoppingListModalOpen}
                onClose={() => {
                    setShoppingListModalOpen(false);
                    setShoppingListDeck(null);
                }}
                deck={shoppingListDeck}
                user={user}
                onQuickAdd={handleQuickAdd}
                onOpenSubstitutions={(card) =>
                    handleOpenSubstitutions(card, shoppingListDeck)
                }
            />

            {/* 8. Card Substitutions Modal */}
            <CardSubstitutionModal
                opened={substitutionModalOpen}
                onClose={() => {
                    setSubstitutionModalOpen(false);
                    setSubstitutionTargetCard(null);
                    setSubstitutionDeck(null);
                }}
                targetCard={substitutionTargetCard}
                deck={substitutionDeck || activeDeckForView}
                catalog={cards}
                userCollection={userCollection}
                user={user}
                canSwapInDeck={true}
                onSwapCardInDeck={(oldCard, newCard, qty) => {
                    const deckToUpdate = substitutionDeck || activeDeckForView;
                    if (deckToUpdate) {
                        handleSwapCardInDeck(
                            deckToUpdate.$id,
                            oldCard.id,
                            newCard,
                            qty,
                        );
                    }
                }}
                onQuickAdd={handleQuickAdd}
            />

            {/* 9. Playtest / Opening Hand & Alter Simulator Modal */}
            <PlaytestModal
                opened={playtestModalOpen}
                onClose={() => {
                    setPlaytestModalOpen(false);
                    setPlaytestDeck(null);
                }}
                deck={playtestDeck}
            />

            {/* 10. Multi-Deck Physical Collection Audit Modal */}
            <PhysicalDeckAuditModal
                opened={auditModalOpen}
                onClose={() => setAuditModalOpen(false)}
                auditResult={auditResult}
                activeDecks={activeDecks}
                user={user}
                onQuickAdd={handleQuickAdd}
            />
        </Container>
    );
}
