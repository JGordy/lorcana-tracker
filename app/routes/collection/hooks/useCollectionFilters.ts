import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { Card as LorcanaCard } from '../../../types/lorcana';
import { getCardFranchise } from '../../../utils/franchise';
import { sortSets, sortCards } from '../utils/collectionHelpers';

export interface UseCollectionFiltersOptions {
    cards: LorcanaCard[];
    getCardQuantity: (card: LorcanaCard, isFoil: boolean) => number;
}

export function useCollectionFilters({
    cards,
    getCardQuantity,
}: UseCollectionFiltersOptions) {
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedOwnership, setSelectedOwnership] = useState<string>(
        () => searchParams.get('ownership') || 'all',
    );
    const [searchQuery, setSearchQuery] = useState(
        () => searchParams.get('q') || '',
    );
    const [selectedInks, setSelectedInks] = useState<string[]>(
        () => searchParams.get('inks')?.split(',').filter(Boolean) || [],
    );
    const [selectedSet, setSelectedSet] = useState<string>(
        () => searchParams.get('set') || 'All',
    );
    const [selectedRarity, setSelectedRarity] = useState<string>(
        () => searchParams.get('rarity') || 'All',
    );
    const [selectedCost, setSelectedCost] = useState<string>(
        () => searchParams.get('cost') || 'All',
    );
    const [selectedInkable, setSelectedInkable] = useState<string>(
        () => searchParams.get('inkable') || 'All',
    );
    const [selectedFormat, setSelectedFormat] = useState<string>(
        () => searchParams.get('format') || 'All',
    );
    const [selectedType, setSelectedType] = useState<string>(
        () => searchParams.get('type') || 'All',
    );
    const [selectedClassification, setSelectedClassification] =
        useState<string>(() => searchParams.get('class') || 'All');
    const [selectedFranchise, setSelectedFranchise] = useState<string>(
        () => searchParams.get('franchise') || 'All',
    );
    const [selectedAttack, setSelectedAttack] = useState<string>(
        () => searchParams.get('attack') || 'All',
    );
    const [selectedDefense, setSelectedDefense] = useState<string>(
        () => searchParams.get('defense') || 'All',
    );
    const [selectedLore, setSelectedLore] = useState<string>(
        () => searchParams.get('lore') || 'All',
    );

    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedOwnership !== 'all')
            params.set('ownership', selectedOwnership);
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedInks.length > 0) params.set('inks', selectedInks.join(','));
        if (selectedSet !== 'All') params.set('set', selectedSet);
        if (selectedRarity !== 'All') params.set('rarity', selectedRarity);
        if (selectedCost !== 'All') params.set('cost', selectedCost);
        if (selectedInkable !== 'All') params.set('inkable', selectedInkable);
        if (selectedFormat !== 'All') params.set('format', selectedFormat);
        if (selectedType !== 'All') params.set('type', selectedType);
        if (selectedClassification !== 'All')
            params.set('class', selectedClassification);
        if (selectedFranchise !== 'All')
            params.set('franchise', selectedFranchise);
        if (selectedAttack !== 'All') params.set('attack', selectedAttack);
        if (selectedDefense !== 'All') params.set('defense', selectedDefense);
        if (selectedLore !== 'All') params.set('lore', selectedLore);

        if (params.toString() !== searchParams.toString()) {
            setSearchParams(params, { replace: true });
        }
    }, [
        selectedOwnership,
        searchQuery,
        selectedInks,
        selectedSet,
        selectedRarity,
        selectedCost,
        selectedInkable,
        selectedFormat,
        selectedType,
        selectedClassification,
        selectedFranchise,
        selectedAttack,
        selectedDefense,
        selectedLore,
        searchParams,
        setSearchParams,
    ]);

    const allClassifications = useMemo(() => {
        return Array.from(
            new Set(cards.flatMap((c) => c.classifications || [])),
        ).sort();
    }, [cards]);

    const allFranchises = useMemo(() => {
        return Array.from(
            new Set(cards.map((c) => getCardFranchise(c.name))),
        ).sort();
    }, [cards]);

    const databaseSets = useMemo(() => {
        return Array.from(new Set(cards.map((c) => c.set).filter(Boolean)));
    }, [cards]);

    const sortedSets = useMemo(() => {
        return sortSets(databaseSets);
    }, [databaseSets]);

    const sets = useMemo(() => ['All', ...sortedSets], [sortedSets]);

    const hasActiveFilters =
        selectedOwnership !== 'all' ||
        searchQuery !== '' ||
        selectedInks.length > 0 ||
        selectedSet !== 'All' ||
        selectedRarity !== 'All' ||
        selectedCost !== 'All' ||
        selectedInkable !== 'All' ||
        selectedFormat !== 'All' ||
        selectedType !== 'All' ||
        selectedClassification !== 'All' ||
        selectedFranchise !== 'All' ||
        selectedAttack !== 'All' ||
        selectedDefense !== 'All' ||
        selectedLore !== 'All';

    const handleResetFilters = () => {
        setSelectedOwnership('all');
        setSearchQuery('');
        setSelectedInks([]);
        setSelectedSet('All');
        setSelectedRarity('All');
        setSelectedCost('All');
        setSelectedInkable('All');
        setSelectedFormat('All');
        setSelectedType('All');
        setSelectedClassification('All');
        setSelectedFranchise('All');
        setSelectedAttack('All');
        setSelectedDefense('All');
        setSelectedLore('All');
    };

    const filteredCards = useMemo(() => {
        return cards.filter((card) => {
            const matchesSearch = card.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

            const cardColors = card.ink_color ? card.ink_color.split('/') : [];
            const matchesInk =
                selectedInks.length === 0
                    ? true
                    : selectedInks.length === 1
                      ? cardColors.length > 0 &&
                        cardColors.includes(selectedInks[0])
                      : cardColors.length > 0 &&
                        cardColors.every((color) =>
                            selectedInks.includes(color),
                        );

            const matchesSet =
                selectedSet === 'All' || card.set === selectedSet;

            const matchesRarity =
                selectedRarity === 'All' ||
                card.rarity?.toLowerCase() === selectedRarity.toLowerCase() ||
                (selectedRarity === 'Super Rare' &&
                    card.rarity === 'Super_rare');

            let matchesCost = true;
            if (selectedCost !== 'All') {
                if (selectedCost === '8+') {
                    matchesCost = card.cost >= 8;
                } else {
                    matchesCost = card.cost === parseInt(selectedCost, 10);
                }
            }

            let matchesInkable = true;
            if (selectedInkable !== 'All') {
                matchesInkable =
                    selectedInkable === 'Inkable'
                        ? card.inkwell
                        : !card.inkwell;
            }

            let matchesFormat = true;
            if (selectedFormat !== 'All') {
                matchesFormat =
                    card.formats?.includes(selectedFormat.toLowerCase()) ||
                    false;
            }

            let matchesType = true;
            if (selectedType !== 'All') {
                matchesType = card.type?.includes(selectedType) || false;
            }

            let matchesClassification = true;
            if (selectedClassification !== 'All') {
                matchesClassification =
                    card.classifications?.includes(selectedClassification) ||
                    false;
            }

            let matchesFranchise = true;
            if (selectedFranchise !== 'All') {
                matchesFranchise =
                    getCardFranchise(card.name) === selectedFranchise;
            }

            let matchesAttack = true;
            if (selectedAttack !== 'All') {
                if (card.strength === null) {
                    matchesAttack = false;
                } else if (selectedAttack === '7+') {
                    matchesAttack = card.strength >= 7;
                } else {
                    matchesAttack =
                        card.strength === parseInt(selectedAttack, 10);
                }
            }

            let matchesDefense = true;
            if (selectedDefense !== 'All') {
                if (card.willpower === null) {
                    matchesDefense = false;
                } else if (selectedDefense === '8+') {
                    matchesDefense = card.willpower >= 8;
                } else {
                    matchesDefense =
                        card.willpower === parseInt(selectedDefense, 10);
                }
            }

            let matchesLore = true;
            if (selectedLore !== 'All') {
                if (selectedLore === '4+') {
                    matchesLore = card.lore >= 4;
                } else {
                    matchesLore = card.lore === parseInt(selectedLore, 10);
                }
            }

            let matchesOwnership = true;
            if (selectedOwnership !== 'all') {
                const qtyNormal = getCardQuantity(card, false);
                const qtyFoil = getCardQuantity(card, true);
                const totalQty = qtyNormal + qtyFoil;

                if (selectedOwnership === 'owned') {
                    matchesOwnership = totalQty > 0;
                } else if (selectedOwnership === 'missing') {
                    matchesOwnership = totalQty === 0;
                } else if (selectedOwnership === 'foil') {
                    matchesOwnership = qtyFoil > 0;
                } else if (selectedOwnership === 'non_foil') {
                    matchesOwnership = qtyNormal > 0;
                }
            }

            return (
                matchesOwnership &&
                matchesSearch &&
                matchesInk &&
                matchesSet &&
                matchesRarity &&
                matchesCost &&
                matchesInkable &&
                matchesFormat &&
                matchesType &&
                matchesClassification &&
                matchesFranchise &&
                matchesAttack &&
                matchesDefense &&
                matchesLore
            );
        });
    }, [
        cards,
        searchQuery,
        selectedInks,
        selectedSet,
        selectedRarity,
        selectedCost,
        selectedInkable,
        selectedFormat,
        selectedType,
        selectedClassification,
        selectedFranchise,
        selectedAttack,
        selectedDefense,
        selectedLore,
        selectedOwnership,
        getCardQuantity,
    ]);

    const sortedFilteredCards = useMemo(() => {
        return sortCards(filteredCards);
    }, [filteredCards]);

    const filterResetKey = `${selectedOwnership}_${searchQuery}_${selectedInks.join(',')}_${selectedSet}_${selectedRarity}_${selectedCost}_${selectedInkable}_${selectedFormat}_${selectedType}_${selectedClassification}_${selectedFranchise}_${selectedAttack}_${selectedDefense}_${selectedLore}`;

    return {
        selectedOwnership,
        setSelectedOwnership,
        searchQuery,
        setSearchQuery,
        selectedInks,
        setSelectedInks,
        selectedSet,
        setSelectedSet,
        selectedRarity,
        setSelectedRarity,
        selectedCost,
        setSelectedCost,
        selectedInkable,
        setSelectedInkable,
        selectedFormat,
        setSelectedFormat,
        selectedType,
        setSelectedType,
        selectedClassification,
        setSelectedClassification,
        selectedFranchise,
        setSelectedFranchise,
        selectedAttack,
        setSelectedAttack,
        selectedDefense,
        setSelectedDefense,
        selectedLore,
        setSelectedLore,
        allClassifications,
        allFranchises,
        sets,
        hasActiveFilters,
        handleResetFilters,
        filteredCards,
        sortedFilteredCards,
        filterResetKey,
    };
}
