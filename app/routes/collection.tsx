import type { Route } from './+types/collection';
import { useLoaderData, useFetcher, useSearchParams } from 'react-router';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Container,
    Title,
    Text,
    Grid,
    Card,
    Group,
    Stack,
    TextInput,
    ActionIcon,
    Box,
    SimpleGrid,
    Paper,
    Select,
    SegmentedControl,
    Button,
    Tooltip,
} from '@mantine/core';
import {
    IconSearch,
    IconPlus,
    IconMinus,
    IconSparkles,
    IconCards,
    IconX,
} from '@tabler/icons-react';
import { authService, dbService } from '../services/appwrite.server';
import {
    COLLECTIONS,
    type Card as LorcanaCard,
    type UserCollectionItemDoc,
} from '../types/lorcana';
import { buildCardsLookup } from '../utils/deck';
import { getCardFranchise } from '../utils/franchise';
import { KNOWN_SETS } from '../constants';
import { Navbar } from '../components/Navbar';

// ---------------------------------------------------------
// Loader (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function loader({ request }: Route.LoaderArgs) {
    // Get active session user
    const user = await authService.getSessionUser(request);
    const userId = user ? user.$id : null;

    // Retrieve master cards catalog and user's current inventory
    const [cards, userCollection] = await Promise.all([
        dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], request),
        userId
            ? dbService.getUserInventory(userId, request)
            : Promise.resolve([]),
    ]);

    return {
        cards,
        userCollection,
        user,
    };
}

// ---------------------------------------------------------
// Action (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'update-quantity') {
        const sessionUser = await authService.getSessionUser(request);
        const userId = sessionUser?.$id || (formData.get('userId') as string);
        const cardId = formData.get('cardId') as string;
        const quantity = parseInt(formData.get('quantity') as string, 10);
        const isFoil = formData.get('isFoil') === 'true';

        const result = await dbService.updateInventory(
            userId,
            cardId,
            quantity,
            isFoil,
            request,
        );

        return { success: true, item: result };
    }

    return { success: false };
}

// ---------------------------------------------------------
// Color Utilities & Ink Badges Configuration
// ---------------------------------------------------------
const INK_COLORS: Record<string, string> = {
    amber: '#F5B041',
    amethyst: '#AF7AC5',
    emerald: '#2ECC71',
    ruby: '#EC7063',
    sapphire: '#5DADE2',
    steel: '#A6ACAF',
};

function getInkBadgeStyle(inkColorString: string | null) {
    if (!inkColorString) {
        return {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            textTransform: 'uppercase' as const,
            fontWeight: 700,
            letterSpacing: '0.5px',
        };
    }

    const primaryInk = inkColorString.split('/')[0].trim().toLowerCase();
    const hex = INK_COLORS[primaryInk] || '#ffffff';

    return {
        backgroundColor: `${hex}1F`, // ~12% opacity background
        borderColor: `${hex}66`, // ~40% opacity border
        color: hex,
        textTransform: 'uppercase' as const,
        fontWeight: 700,
        letterSpacing: '0.5px',
    };
}

// ---------------------------------------------------------
// Special Rarity Shiny Effect
// ---------------------------------------------------------
const SPECIAL_RARITIES = new Set(['Enchanted', 'Epic', 'Iconic', 'Promo']);

function ShinyCardImage({ card }: { card: LorcanaCard }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number | null>(null);
    const [tilt, setTilt] = useState({
        rx: 0,
        ry: 0,
        gx: 50,
        gy: 50,
        active: false,
    });

    useEffect(() => {
        return () => {
            if (animFrameRef.current !== null) {
                cancelAnimationFrame(animFrameRef.current);
            }
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (animFrameRef.current !== null)
            cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setTilt({
                rx: (0.5 - y) * 18,
                ry: (x - 0.5) * 18,
                gx: x * 100,
                gy: y * 100,
                active: true,
            });
        });
    };

    const handleMouseLeave = () => {
        if (animFrameRef.current !== null)
            cancelAnimationFrame(animFrameRef.current);
        setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
    };

    const isSpecial = SPECIAL_RARITIES.has(card.rarity);
    const hasHolo = card.rarity === 'Enchanted' || card.rarity === 'Iconic';
    const hasShimmer = card.rarity === 'Epic';

    if (!card.image_url) return null;

    return (
        <div
            ref={containerRef}
            onMouseMove={isSpecial ? handleMouseMove : undefined}
            onMouseLeave={isSpecial ? handleMouseLeave : undefined}
            style={{
                position: 'relative',
                transform: isSpecial
                    ? `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.active ? 1.03 : 1})`
                    : undefined,
                transition: tilt.active
                    ? 'transform 0.05s linear'
                    : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                transformStyle: 'preserve-3d',
                willChange: isSpecial ? 'transform' : undefined,
            }}
        >
            <img
                src={card.image_url}
                alt={card.name}
                style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {hasHolo && (
                <div
                    className="shiny-holo-layer"
                    style={{
                        background: tilt.active
                            ? `radial-gradient(ellipse at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.28) 0%, transparent 55%),
                 linear-gradient(${tilt.gx + tilt.gy * 0.8}deg,
                   rgba(255,0,128,0.35) 0%, rgba(255,165,0,0.35) 16%, rgba(255,255,0,0.3) 32%,
                   rgba(0,255,128,0.35) 48%, rgba(0,128,255,0.35) 64%, rgba(128,0,255,0.35) 80%, rgba(255,0,128,0.35) 100%)`
                            : undefined,
                        opacity: tilt.active ? 1 : 0,
                    }}
                />
            )}
            {hasShimmer && tilt.active && (
                <div className="shiny-shimmer-layer" />
            )}
        </div>
    );
}

export default function Collection() {
    const {
        cards,
        userCollection: serverCollection,
        user,
    } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();

    // Client-side persistent state for inventory (initialized from serverCollection)
    const [userCollection, setUserCollection] =
        useState<UserCollectionItemDoc[]>(serverCollection);

    // Synchronize with server loader data and update localStorage
    useEffect(() => {
        setUserCollection(serverCollection);
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'lorcana_user_inventory',
                JSON.stringify(serverCollection),
            );
        }
    }, [serverCollection]);

    const [searchParams, setSearchParams] = useSearchParams();

    // Filter States initialized from URL search params
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

    // Keep URL searchParams synchronized with live filter states
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

    // Infinite Scroll state for lazy-loading grid DOM nodes
    const [visibleCount, setVisibleCount] = useState(48);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Reset infinite scroll pagination when filters change to keep DOM small and fast
    useEffect(() => {
        setVisibleCount(48);
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
    ]);

    const cardsLookup = useMemo(() => buildCardsLookup(cards), [cards]);

    // Create a lookup of owned quantities by cardId & isFoil (memoized and supports Optimistic UI updates)
    const inventoryMap = useMemo(() => {
        const map = new Map<string, number>(); // key: `cardId_foil` or `cardId_normal`
        for (const item of userCollection) {
            const foilSuffix = item.is_foil ? 'foil' : 'normal';
            const resolvedCard = cardsLookup.get(item.card_id);
            const canonicalId = resolvedCard ? resolvedCard.id : item.card_id;

            map.set(`${item.card_id}_${foilSuffix}`, item.quantity);
            if (canonicalId !== item.card_id) {
                map.set(`${canonicalId}_${foilSuffix}`, item.quantity);
            }
        }

        // Apply optimistic updates from active submissions
        if (
            fetcher.formData &&
            fetcher.formData.get('intent') === 'update-quantity'
        ) {
            const cardId = fetcher.formData.get('cardId') as string;
            const isFoil = fetcher.formData.get('isFoil') === 'true';
            const quantity = parseInt(
                fetcher.formData.get('quantity') as string,
                10,
            );
            const foilSuffix = isFoil ? 'foil' : 'normal';
            const resolvedCard = cardsLookup.get(cardId);
            const canonicalId = resolvedCard ? resolvedCard.id : cardId;

            map.set(`${cardId}_${foilSuffix}`, quantity);
            if (canonicalId !== cardId) {
                map.set(`${canonicalId}_${foilSuffix}`, quantity);
            }
        }

        return map;
    }, [userCollection, fetcher.formData, cardsLookup]);

    // Helper to get card quantity across ID variations
    const getCardQuantity = (card: LorcanaCard, isFoil: boolean): number => {
        const foilSuffix = isFoil ? 'foil' : 'normal';
        const cardId = card.id || card.$id;
        if (!cardId) return 0;

        return (
            inventoryMap.get(`${cardId}_${foilSuffix}`) ||
            (card.$id ? inventoryMap.get(`${card.$id}_${foilSuffix}`) : 0) ||
            0
        );
    };

    // Handle quantity adjustment
    const handleAdjustQuantity = (
        cardId: string,
        isFoil: boolean,
        currentQty: number,
        change: number,
    ) => {
        if (!user) {
            alert(
                'Please sign in with a demo session to add cards to your collection.',
            );
            return;
        }
        const newQty = Math.max(0, currentQty + change);

        // Optimistically update React state & localStorage
        const updatedCollection = userCollection.filter(
            (item) => !(item.card_id === cardId && item.is_foil === isFoil),
        );

        if (newQty > 0) {
            const existing = userCollection.find(
                (item) => item.card_id === cardId && item.is_foil === isFoil,
            );
            updatedCollection.push({
                $id: existing?.$id || `inv-${Date.now()}`,
                user_id: user.$id,
                card_id: cardId,
                quantity: newQty,
                is_foil: isFoil,
            });
        }

        setUserCollection(updatedCollection);
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'lorcana_user_inventory',
                JSON.stringify(updatedCollection),
            );
        }

        fetcher.submit(
            {
                intent: 'update-quantity',
                userId: user.$id,
                cardId,
                quantity: newQty.toString(),
                isFoil: isFoil.toString(),
            },
            { method: 'post' },
        );
    };

    // Dynamically extract unique sets present in the database catalog
    const databaseSets = useMemo(() => {
        return Array.from(new Set(cards.map((c) => c.set).filter(Boolean)));
    }, [cards]);

    // Sort sets chronologically by reverse release sequence, with any extra/promo sets sorted alphabetically at the bottom
    const sortedSets = useMemo(() => {
        return [...databaseSets].sort((a, b) => {
            const idxA = KNOWN_SETS.indexOf(a);
            const idxB = KNOWN_SETS.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [databaseSets]);

    const sets = useMemo(() => ['All', ...sortedSets], [sortedSets]);

    // Filter cards catalog
    const filteredCards = useMemo(() => {
        return cards.filter((card) => {
            // 1. Search Query
            const matchesSearch = card.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

            // 2. Ink Colors (using Rule 1 & Rule 2 subset check)
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

            // 3. Set
            const matchesSet =
                selectedSet === 'All' || card.set === selectedSet;

            // 4. Rarity
            const matchesRarity =
                selectedRarity === 'All' ||
                card.rarity?.toLowerCase() === selectedRarity.toLowerCase() ||
                (selectedRarity === 'Super Rare' &&
                    card.rarity === 'Super_rare');

            // 5. Cost (Ink Cost)
            let matchesCost = true;
            if (selectedCost !== 'All') {
                if (selectedCost === '8+') {
                    matchesCost = card.cost >= 8;
                } else {
                    matchesCost = card.cost === parseInt(selectedCost, 10);
                }
            }

            // 6. Inkable
            let matchesInkable = true;
            if (selectedInkable !== 'All') {
                matchesInkable =
                    selectedInkable === 'Inkable'
                        ? card.inkwell
                        : !card.inkwell;
            }

            // 7. Format (Legality)
            let matchesFormat = true;
            if (selectedFormat !== 'All') {
                matchesFormat =
                    card.formats?.includes(selectedFormat.toLowerCase()) ||
                    false;
            }

            // 8. Type
            let matchesType = true;
            if (selectedType !== 'All') {
                matchesType = card.type?.includes(selectedType) || false;
            }

            // 9. Classification
            let matchesClassification = true;
            if (selectedClassification !== 'All') {
                matchesClassification =
                    card.classifications?.includes(selectedClassification) ||
                    false;
            }

            // 10. Franchise
            let matchesFranchise = true;
            if (selectedFranchise !== 'All') {
                matchesFranchise =
                    getCardFranchise(card.name) === selectedFranchise;
            }

            // 11. Attack (Strength)
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

            // 12. Defense (Willpower)
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

            // 13. Lore
            let matchesLore = true;
            if (selectedLore !== 'All') {
                if (selectedLore === '4+') {
                    matchesLore = card.lore >= 4;
                } else {
                    matchesLore = card.lore === parseInt(selectedLore, 10);
                }
            }

            // 0. Ownership Status
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

    // Infinite Scroll intersection observer to append cards as the user scrolls
    useEffect(() => {
        if (visibleCount >= filteredCards.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) =>
                        Math.min(prev + 48, filteredCards.length),
                    );
                }
            },
            { rootMargin: '300px', threshold: 0.1 },
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [filteredCards.length, visibleCount]);

    // Sort the filtered cards to respect reverse chronological release order of sets, and by card number ascending within the same set
    const sortedFilteredCards = useMemo(() => {
        return [...filteredCards].sort((a, b) => {
            const idxA = KNOWN_SETS.indexOf(a.set);
            const idxB = KNOWN_SETS.indexOf(b.set);
            if (idxA !== -1 && idxB !== -1) {
                if (idxA !== idxB) {
                    return idxA - idxB;
                }
            } else if (idxA !== -1) {
                return -1;
            } else if (idxB !== -1) {
                return 1;
            } else {
                const setComp = a.set.localeCompare(b.set);
                if (setComp !== 0) return setComp;
            }
            return a.number - b.number;
        });
    }, [filteredCards]);

    const slicedCards = useMemo(
        () => sortedFilteredCards.slice(0, visibleCount),
        [sortedFilteredCards, visibleCount],
    );

    // Calculate totals optimistically (incorporating pending update-quantity forms)
    const totals = useMemo(() => {
        let totalCardsOwned = 0;
        const uniqueCardsOwned = new Set<string>();

        // Start with server userCollection
        const localQuantities = new Map<string, number>(); // key: `cardId_foil` or `cardId_normal`
        for (const item of userCollection) {
            localQuantities.set(
                `${item.card_id}_${item.is_foil ? 'foil' : 'normal'}`,
                item.quantity,
            );
        }

        // Apply optimistic updates from active submissions
        if (
            fetcher.formData &&
            fetcher.formData.get('intent') === 'update-quantity'
        ) {
            const cardId = fetcher.formData.get('cardId') as string;
            const isFoil = fetcher.formData.get('isFoil') === 'true';
            const quantity = parseInt(
                fetcher.formData.get('quantity') as string,
                10,
            );
            localQuantities.set(
                `${cardId}_${isFoil ? 'foil' : 'normal'}`,
                quantity,
            );
        }

        // Accumulate total counts
        for (const [key, qty] of localQuantities.entries()) {
            if (qty > 0) {
                totalCardsOwned += qty;
                const cardId = key.substring(0, key.lastIndexOf('_'));
                uniqueCardsOwned.add(cardId);
            }
        }

        return {
            totalCardsOwned,
            uniqueCardsCount: uniqueCardsOwned.size,
        };
    }, [userCollection, fetcher.formData]);

    return (
        <Box mih="100vh" bg="#0b0d14" c="gray.1">
            <Navbar user={user} />

            <Container size="xl" py="xl">
                {/* Banner Dashboard Header */}
                <Paper
                    p={{ base: 'lg', md: 'xl' }}
                    radius="lg"
                    mb="xl"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.15)',
                    }}
                >
                    <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="wrap"
                        gap="lg"
                    >
                        <Box style={{ maxWidth: 640 }}>
                            <Group gap="xs" mb="xs">
                                <IconCards size={28} color="#a855f7" />
                                <Title
                                    order={1}
                                    style={{
                                        fontFamily:
                                            "'Cinzel Decorative', serif",
                                        letterSpacing: '0.5px',
                                        fontSize: 28,
                                        background:
                                            'linear-gradient(to right, #c084fc, #f472b6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    My Collection
                                </Title>
                            </Group>
                            <Text size="sm" c="gray.4" lh={1.6}>
                                Track your Lorcana cards (foil & non-foil
                                counts) here. Changes save instantly and
                                automatically update deck percentages.
                            </Text>
                        </Box>
                    </Group>

                    {/* Metric Quick Stats */}
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="xl">
                        <Card
                            padding="md"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text size="xs" c="gray.5" fw={600} tt="uppercase">
                                Total Cards Owned
                            </Text>
                            <Text size="xl" fw={800} c="gray.1" mt={4}>
                                {totals.totalCardsOwned}
                            </Text>
                        </Card>
                        <Card
                            padding="md"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text size="xs" c="teal.4" fw={600} tt="uppercase">
                                Unique Cards Owned
                            </Text>
                            <Text size="xl" fw={800} c="teal.3" mt={4}>
                                {totals.uniqueCardsCount}
                            </Text>
                        </Card>
                        <Card
                            padding="md"
                            radius="md"
                            bg="rgba(15, 23, 42, 0.6)"
                            withBorder
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Text
                                size="xs"
                                c="violet.4"
                                fw={600}
                                tt="uppercase"
                            >
                                Catalog Completion
                            </Text>
                            <Text size="xl" fw={800} c="violet.3" mt={4}>
                                {cards.length > 0
                                    ? `${Math.round((totals.uniqueCardsCount / cards.length) * 100)}%`
                                    : '0%'}
                                <Text
                                    component="span"
                                    size="xs"
                                    c="dimmed"
                                    fw={500}
                                    ml={6}
                                >
                                    ({totals.uniqueCardsCount} / {cards.length})
                                </Text>
                            </Text>
                        </Card>
                    </SimpleGrid>
                </Paper>

                {/* Workspace Layout */}
                <Grid gap="md">
                    {/* Left Panel: Filters */}
                    <Grid.Col span={{ base: 12, md: 3 }}>
                        <Stack gap="md" className="filters-sidebar">
                            {/* Advanced Filters Card */}
                            <Paper
                                p="md"
                                radius="lg"
                                withBorder
                                className="filters-sidebar-card"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderColor: 'rgba(168, 85, 247, 0.15)',
                                    backdropFilter: 'blur(12px)',
                                }}
                            >
                                <Group justify="space-between" mb="xs">
                                    <Text
                                        size="xs"
                                        fw={700}
                                        c="dimmed"
                                        style={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        Filters
                                    </Text>
                                    {hasActiveFilters && (
                                        <Text
                                            size="xs"
                                            c="violet.4"
                                            fw={700}
                                            style={{ cursor: 'pointer' }}
                                            onClick={handleResetFilters}
                                        >
                                            Reset All
                                        </Text>
                                    )}
                                </Group>

                                <Stack gap="sm" mt="xs">
                                    {/* 0. Ownership Status */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Ownership
                                        </Text>
                                        <Select
                                            placeholder="All Cards"
                                            data={[
                                                {
                                                    value: 'all',
                                                    label: 'All Cards (Catalog)',
                                                },
                                                {
                                                    value: 'owned',
                                                    label: 'Owned Cards (> 0)',
                                                },
                                                {
                                                    value: 'missing',
                                                    label: 'Missing / Unowned (0)',
                                                },
                                                {
                                                    value: 'foil',
                                                    label: 'Foil Cards Owned',
                                                },
                                                {
                                                    value: 'non_foil',
                                                    label: 'Normal Cards Owned',
                                                },
                                            ]}
                                            value={selectedOwnership}
                                            onChange={(val) =>
                                                setSelectedOwnership(
                                                    val || 'all',
                                                )
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 1. Set */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Card Set
                                        </Text>
                                        <Select
                                            placeholder="All Sets"
                                            data={sets.map((s) => ({
                                                value: s,
                                                label:
                                                    s === 'All'
                                                        ? 'All Sets'
                                                        : s,
                                            }))}
                                            value={selectedSet}
                                            onChange={(val) =>
                                                setSelectedSet(val || 'All')
                                            }
                                            searchable
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 2. Rarity */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Rarity
                                        </Text>
                                        <Select
                                            placeholder="All Rarities"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Rarities',
                                                },
                                                {
                                                    value: 'Common',
                                                    label: 'Common',
                                                },
                                                {
                                                    value: 'Uncommon',
                                                    label: 'Uncommon',
                                                },
                                                {
                                                    value: 'Rare',
                                                    label: 'Rare',
                                                },
                                                {
                                                    value: 'Super Rare',
                                                    label: 'Super Rare',
                                                },
                                                {
                                                    value: 'Legendary',
                                                    label: 'Legendary',
                                                },
                                                {
                                                    value: 'Epic',
                                                    label: 'Epic',
                                                },
                                                {
                                                    value: 'Enchanted',
                                                    label: 'Enchanted',
                                                },
                                                {
                                                    value: 'Iconic',
                                                    label: 'Iconic',
                                                },
                                                {
                                                    value: 'Promo',
                                                    label: 'Promo',
                                                },
                                            ]}
                                            value={selectedRarity}
                                            onChange={(val) =>
                                                setSelectedRarity(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 3. Cost */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Ink Cost
                                        </Text>
                                        <Select
                                            placeholder="All Costs"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Costs',
                                                },
                                                ...Array.from(
                                                    { length: 8 },
                                                    (_, i) => ({
                                                        value: String(i),
                                                        label: String(i),
                                                    }),
                                                ),
                                                { value: '8+', label: '8+' },
                                            ]}
                                            value={selectedCost}
                                            onChange={(val) =>
                                                setSelectedCost(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 4. Inkable */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Inkwell Type
                                        </Text>
                                        <Select
                                            placeholder="All Types"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Types',
                                                },
                                                {
                                                    value: 'Inkable',
                                                    label: 'Inkable',
                                                },
                                                {
                                                    value: 'Non-Inkable',
                                                    label: 'Non-Inkable',
                                                },
                                            ]}
                                            value={selectedInkable}
                                            onChange={(val) =>
                                                setSelectedInkable(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 5. Legality */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Format Legality
                                        </Text>
                                        <Select
                                            placeholder="All Formats"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Formats',
                                                },
                                                {
                                                    value: 'Core',
                                                    label: 'Core Legal',
                                                },
                                                {
                                                    value: 'Infinity',
                                                    label: 'Infinity Legal',
                                                },
                                            ]}
                                            value={selectedFormat}
                                            onChange={(val) =>
                                                setSelectedFormat(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 6. Card Type */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Card Type
                                        </Text>
                                        <Select
                                            placeholder="All Types"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Types',
                                                },
                                                {
                                                    value: 'Character',
                                                    label: 'Character',
                                                },
                                                {
                                                    value: 'Action',
                                                    label: 'Action',
                                                },
                                                {
                                                    value: 'Item',
                                                    label: 'Item',
                                                },
                                                {
                                                    value: 'Location',
                                                    label: 'Location',
                                                },
                                            ]}
                                            value={selectedType}
                                            onChange={(val) =>
                                                setSelectedType(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 7. Classifications */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Classification
                                        </Text>
                                        <Select
                                            placeholder="All Classifications"
                                            data={[
                                                'All',
                                                ...allClassifications,
                                            ].map((cl) => ({
                                                value: cl,
                                                label:
                                                    cl === 'All'
                                                        ? 'All Classifications'
                                                        : cl,
                                            }))}
                                            value={selectedClassification}
                                            onChange={(val) =>
                                                setSelectedClassification(
                                                    val || 'All',
                                                )
                                            }
                                            searchable
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 8. Franchise */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Franchise
                                        </Text>
                                        <Select
                                            placeholder="All Franchises"
                                            data={['All', ...allFranchises].map(
                                                (f) => ({
                                                    value: f,
                                                    label:
                                                        f === 'All'
                                                            ? 'All Franchises'
                                                            : f,
                                                }),
                                            )}
                                            value={selectedFranchise}
                                            onChange={(val) =>
                                                setSelectedFranchise(
                                                    val || 'All',
                                                )
                                            }
                                            searchable
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 9. Attack */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Attack (Strength)
                                        </Text>
                                        <Select
                                            placeholder="All Strength"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Strength',
                                                },
                                                ...Array.from(
                                                    { length: 7 },
                                                    (_, i) => ({
                                                        value: String(i),
                                                        label: String(i),
                                                    }),
                                                ),
                                                { value: '7+', label: '7+' },
                                            ]}
                                            value={selectedAttack}
                                            onChange={(val) =>
                                                setSelectedAttack(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 10. Defense */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Defense (Willpower)
                                        </Text>
                                        <Select
                                            placeholder="All Willpower"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Willpower',
                                                },
                                                ...Array.from(
                                                    { length: 8 },
                                                    (_, i) => ({
                                                        value: String(i + 1),
                                                        label: String(i + 1),
                                                    }),
                                                ),
                                                { value: '8+', label: '8+' },
                                            ]}
                                            value={selectedDefense}
                                            onChange={(val) =>
                                                setSelectedDefense(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>

                                    {/* 11. Lore */}
                                    <Box>
                                        <Text
                                            size="11px"
                                            fw={600}
                                            c="gray.4"
                                            mb={4}
                                        >
                                            Lore Value
                                        </Text>
                                        <Select
                                            placeholder="All Lore"
                                            data={[
                                                {
                                                    value: 'All',
                                                    label: 'All Lore',
                                                },
                                                ...Array.from(
                                                    { length: 4 },
                                                    (_, i) => ({
                                                        value: String(i),
                                                        label: String(i),
                                                    }),
                                                ),
                                                { value: '4+', label: '4+' },
                                            ]}
                                            value={selectedLore}
                                            onChange={(val) =>
                                                setSelectedLore(val || 'All')
                                            }
                                            allowDeselect={false}
                                            size="xs"
                                        />
                                    </Box>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid.Col>

                    {/* Right Panel: Cards Grid & Sticky Top Bar */}
                    <Grid.Col span={{ base: 12, md: 9 }}>
                        {/* Sticky Glassmorphic Filter & Toolbar */}
                        <Paper
                            p="xs"
                            px="md"
                            radius="lg"
                            withBorder
                            className="top-filter-bar"
                            mb="md"
                            style={{
                                position: 'sticky',
                                top: 76,
                                zIndex: 30,
                                background:
                                    'linear-gradient(135deg, rgba(24, 20, 52, 0.9) 0%, rgba(12, 16, 33, 0.94) 100%)',
                                backdropFilter: 'blur(16px)',
                                borderColor: 'rgba(168, 85, 247, 0.25)',
                                boxShadow:
                                    '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 15px rgba(168, 85, 247, 0.08)',
                            }}
                        >
                            <Group
                                justify="space-between"
                                align="center"
                                gap="sm"
                                wrap="nowrap"
                            >
                                {/* Compact Ownership SegmentedControl */}
                                <SegmentedControl
                                    value={
                                        selectedOwnership === 'owned' ||
                                        selectedOwnership === 'missing'
                                            ? selectedOwnership
                                            : selectedOwnership === 'all'
                                              ? 'all'
                                              : ''
                                    }
                                    onChange={(val) => {
                                        if (val) setSelectedOwnership(val);
                                    }}
                                    data={[
                                        {
                                            value: 'all',
                                            label: 'All',
                                        },
                                        {
                                            value: 'owned',
                                            label: 'Owned',
                                        },
                                        {
                                            value: 'missing',
                                            label: 'Missing',
                                        },
                                    ]}
                                    size="xs"
                                    radius="md"
                                    color="violet"
                                    style={{ flexShrink: 0 }}
                                    styles={{
                                        root: {
                                            backgroundColor:
                                                'rgba(15, 23, 42, 0.7)',
                                            border: '1px solid rgba(168, 85, 247, 0.2)',
                                            padding: 3,
                                        },
                                        indicator: {
                                            boxShadow:
                                                '0 2px 8px rgba(168, 85, 247, 0.3)',
                                        },
                                        label: {
                                            padding: '4px 12px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                        },
                                    }}
                                />

                                {/* Fluid Search Input with Clear Button */}
                                <TextInput
                                    placeholder="Search cards catalog..."
                                    leftSection={
                                        <IconSearch size={15} color="#c084fc" />
                                    }
                                    rightSection={
                                        searchQuery ? (
                                            <ActionIcon
                                                size="xs"
                                                variant="subtle"
                                                color="gray"
                                                onClick={() =>
                                                    setSearchQuery('')
                                                }
                                                title="Clear search"
                                            >
                                                <IconX size={13} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    size="xs"
                                    style={{ flex: 1, minWidth: 160 }}
                                    styles={{
                                        input: {
                                            backgroundColor:
                                                'rgba(15, 23, 42, 0.6)',
                                            borderColor:
                                                'rgba(168, 85, 247, 0.2)',
                                            color: '#f8fafc',
                                            height: 36,
                                        },
                                    }}
                                />

                                {/* Ink Colors Filter */}
                                <Group
                                    gap={6}
                                    align="center"
                                    style={{ flexShrink: 0 }}
                                    wrap="nowrap"
                                >
                                    {[
                                        {
                                            name: 'Amber',
                                            color: '#F5B041',
                                        },
                                        {
                                            name: 'Amethyst',
                                            color: '#AF7AC5',
                                        },
                                        {
                                            name: 'Emerald',
                                            color: '#2ECC71',
                                        },
                                        {
                                            name: 'Ruby',
                                            color: '#EC7063',
                                        },
                                        {
                                            name: 'Sapphire',
                                            color: '#5DADE2',
                                        },
                                        {
                                            name: 'Steel',
                                            color: '#A6ACAF',
                                        },
                                    ].map((ink) => {
                                        const isSelected =
                                            selectedInks.includes(ink.name);
                                        const isDimmed =
                                            selectedInks.length > 0 &&
                                            !isSelected;
                                        const handleInkClick = () => {
                                            if (isSelected) {
                                                setSelectedInks((prev) =>
                                                    prev.filter(
                                                        (name) =>
                                                            name !== ink.name,
                                                    ),
                                                );
                                            } else if (
                                                selectedInks.length < 3
                                            ) {
                                                setSelectedInks((prev) => [
                                                    ...prev,
                                                    ink.name,
                                                ]);
                                            }
                                        };
                                        return (
                                            <Tooltip
                                                key={ink.name}
                                                label={`${ink.name}${isSelected ? ' (Selected)' : ''}`}
                                                withArrow
                                                position="top"
                                            >
                                                <Box
                                                    onClick={handleInkClick}
                                                    style={{
                                                        cursor:
                                                            selectedInks.length >=
                                                                3 && !isSelected
                                                                ? 'not-allowed'
                                                                : 'pointer',
                                                        opacity: isDimmed
                                                            ? 0.35
                                                            : 1,
                                                        filter: isDimmed
                                                            ? 'grayscale(80%)'
                                                            : 'none',
                                                        transform: isSelected
                                                            ? 'scale(1.15)'
                                                            : 'scale(1)',
                                                        transition:
                                                            'all 0.2s ease',
                                                        borderRadius: '50%',
                                                        padding: 3,
                                                        border: isSelected
                                                            ? `2px solid ${ink.color}`
                                                            : '2px solid transparent',
                                                        backgroundColor:
                                                            isSelected
                                                                ? 'rgba(255,255,255,0.04)'
                                                                : 'transparent',
                                                        display: 'flex',
                                                        justifyContent:
                                                            'center',
                                                        alignItems: 'center',
                                                        width: 36,
                                                        height: 36,
                                                    }}
                                                >
                                                    <img
                                                        src={`/inks/${ink.name.toLowerCase()}.svg`}
                                                        alt={ink.name}
                                                        style={{
                                                            width: 22,
                                                            height: 22,
                                                            display: 'block',
                                                        }}
                                                    />
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                    {selectedInks.length > 0 && (
                                        <ActionIcon
                                            size="sm"
                                            radius="xl"
                                            variant="subtle"
                                            color="violet"
                                            onClick={() => setSelectedInks([])}
                                            title="Clear ink filters"
                                            ml={2}
                                        >
                                            <IconX size={15} />
                                        </ActionIcon>
                                    )}
                                </Group>
                            </Group>
                        </Paper>

                        {filteredCards.length === 0 ? (
                            <Card
                                padding="xl"
                                radius="md"
                                withBorder
                                bg="dark.8"
                                style={{
                                    textAlign: 'center',
                                    borderStyle: 'dashed',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                <Stack align="center" gap="sm" py="md">
                                    <Text c="gray.3" fw={700} size="md">
                                        {selectedOwnership === 'owned'
                                            ? 'No owned cards match your current filters.'
                                            : selectedOwnership === 'missing'
                                              ? 'No unowned cards match your current filters.'
                                              : 'No cards in catalog match your current filters.'}
                                    </Text>
                                    {selectedOwnership === 'owned' &&
                                    totals.uniqueCardsCount === 0 ? (
                                        <Text c="dimmed" size="xs" maw={420}>
                                            You haven't added any cards to your
                                            inventory yet. Switch to "All Cards"
                                            or adjust your filters to start
                                            adding cards!
                                        </Text>
                                    ) : null}
                                    {hasActiveFilters && (
                                        <Button
                                            variant="light"
                                            color="violet"
                                            size="xs"
                                            radius="md"
                                            onClick={handleResetFilters}
                                        >
                                            Reset All Filters
                                        </Button>
                                    )}
                                </Stack>
                            </Card>
                        ) : (
                            <>
                                <SimpleGrid
                                    cols={{
                                        base: 2,
                                        xs: 2,
                                        sm: 3,
                                        md: 3,
                                        lg: 4,
                                        xl: 4,
                                    }}
                                    spacing="md"
                                >
                                    {slicedCards.map((card) => {
                                        const cardId = card.id || card.$id;
                                        const qtyNormal = getCardQuantity(
                                            card,
                                            false,
                                        );
                                        const qtyFoil = getCardQuantity(
                                            card,
                                            true,
                                        );
                                        const badgeStyle = getInkBadgeStyle(
                                            card.ink_color,
                                        );
                                        const isFoilOnly =
                                            card.rarity === 'Enchanted' ||
                                            card.rarity === 'Epic' ||
                                            card.rarity === 'Iconic';

                                        return (
                                            <Card
                                                key={card.$id}
                                                className={`lorcana-card${card.rarity === 'Enchanted' ? ' shiny-enchanted-glow' : card.rarity === 'Epic' ? ' shiny-epic-glow' : card.rarity === 'Iconic' ? ' shiny-iconic-glow' : ''}`}
                                                padding="xs"
                                                radius="md"
                                                withBorder
                                                style={
                                                    {
                                                        backgroundColor:
                                                            'var(--mantine-color-dark-8)',
                                                        // Themed bottom gradient (12% opacity tint)
                                                        backgroundImage: `linear-gradient(180deg, rgba(37,38,43,0.98) 55%, ${badgeStyle.color}1E 100%)`,
                                                        borderColor: `${badgeStyle.color}45`, // ~27% opacity border on idle
                                                        overflow: 'hidden',
                                                        '--hover-color':
                                                            badgeStyle.color,
                                                        '--hover-shadow-color': `0 8px 24px ${badgeStyle.color}40`,
                                                    } as React.CSSProperties
                                                }
                                            >
                                                {/* Top portion: Card Image */}
                                                <Card.Section
                                                    style={{
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {card.image_url ? (
                                                        <ShinyCardImage
                                                            card={card}
                                                        />
                                                    ) : (
                                                        <Box
                                                            style={{
                                                                aspectRatio:
                                                                    '3/4',
                                                                display: 'flex',
                                                                flexDirection:
                                                                    'column',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                backgroundColor:
                                                                    'rgba(255,255,255,0.02)',
                                                            }}
                                                        >
                                                            <IconCards
                                                                size={32}
                                                                style={{
                                                                    opacity: 0.2,
                                                                    marginBottom: 8,
                                                                }}
                                                            />
                                                            <Text
                                                                size="xs"
                                                                c="dimmed"
                                                                ta="center"
                                                                px="xs"
                                                            >
                                                                {card.name}
                                                            </Text>
                                                        </Box>
                                                    )}
                                                </Card.Section>

                                                {/* Bottom portion: Card Info & Inventory Controls */}
                                                <Stack gap="xs" mt="xs">
                                                    <Box
                                                        style={{
                                                            minHeight: 38,
                                                        }}
                                                    >
                                                        <Text
                                                            fw={800}
                                                            size="sm"
                                                            lineClamp={2}
                                                            c="gray.1"
                                                            style={{
                                                                lineHeight: 1.2,
                                                            }}
                                                        >
                                                            {card.name}
                                                        </Text>
                                                        <Text
                                                            size="10px"
                                                            c="dimmed"
                                                            mt={4}
                                                        >
                                                            {card.set} • #
                                                            {card.number}
                                                        </Text>
                                                    </Box>

                                                    {isFoilOnly ? (
                                                        <Box
                                                            mt={4}
                                                            style={{
                                                                borderTop: `1px solid ${badgeStyle.color}40`,
                                                                paddingTop: 10,
                                                            }}
                                                        >
                                                            <Stack
                                                                gap={4}
                                                                align="center"
                                                            >
                                                                <Group
                                                                    gap={3}
                                                                    align="center"
                                                                >
                                                                    <IconSparkles
                                                                        size={
                                                                            11
                                                                        }
                                                                        color="var(--mantine-color-pink-4)"
                                                                    />
                                                                    <Text
                                                                        size="10px"
                                                                        fw={700}
                                                                        c="pink.4"
                                                                        style={{
                                                                            textTransform:
                                                                                'uppercase',
                                                                            letterSpacing:
                                                                                '0.5px',
                                                                        }}
                                                                    >
                                                                        Foil
                                                                        Only
                                                                    </Text>
                                                                </Group>
                                                                <Group
                                                                    gap={0}
                                                                    bg={
                                                                        qtyFoil >
                                                                        0
                                                                            ? 'rgba(240, 98, 146, 0.14)'
                                                                            : 'var(--mantine-color-dark-9)'
                                                                    }
                                                                    px={6}
                                                                    py={2}
                                                                    justify="space-between"
                                                                    style={{
                                                                        borderRadius: 20,
                                                                        border:
                                                                            qtyFoil >
                                                                            0
                                                                                ? '1px solid var(--mantine-color-pink-5)'
                                                                                : '1px solid rgba(255,255,255,0.06)',
                                                                        width: '100%',
                                                                        transition:
                                                                            'border-color 0.2s ease, background-color 0.2s ease',
                                                                    }}
                                                                >
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        radius="xl"
                                                                        variant="subtle"
                                                                        color="pink"
                                                                        onClick={() =>
                                                                            handleAdjustQuantity(
                                                                                cardId,
                                                                                true,
                                                                                qtyFoil,
                                                                                -1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconMinus
                                                                            size={
                                                                                8
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                    <Text
                                                                        size="xs"
                                                                        fw={800}
                                                                        c={
                                                                            qtyFoil >
                                                                            0
                                                                                ? 'pink.4'
                                                                                : 'dimmed'
                                                                        }
                                                                        style={{
                                                                            textAlign:
                                                                                'center',
                                                                        }}
                                                                    >
                                                                        {
                                                                            qtyFoil
                                                                        }
                                                                    </Text>
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        radius="xl"
                                                                        variant="subtle"
                                                                        color="pink"
                                                                        onClick={() =>
                                                                            handleAdjustQuantity(
                                                                                cardId,
                                                                                true,
                                                                                qtyFoil,
                                                                                1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconPlus
                                                                            size={
                                                                                8
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Stack>
                                                        </Box>
                                                    ) : (
                                                        <SimpleGrid
                                                            cols={2}
                                                            spacing="xs"
                                                            mt={4}
                                                            style={{
                                                                borderTop: `1px solid ${badgeStyle.color}40`,
                                                                paddingTop: 10,
                                                            }}
                                                        >
                                                            {/* Normal Counter */}
                                                            <Stack
                                                                gap={4}
                                                                align="center"
                                                            >
                                                                <Text
                                                                    size="10px"
                                                                    fw={700}
                                                                    c={
                                                                        qtyNormal >
                                                                        0
                                                                            ? badgeStyle.color
                                                                            : 'dimmed'
                                                                    }
                                                                    style={{
                                                                        textTransform:
                                                                            'uppercase',
                                                                        letterSpacing:
                                                                            '0.5px',
                                                                        opacity:
                                                                            qtyNormal >
                                                                            0
                                                                                ? 1
                                                                                : 0.6,
                                                                    }}
                                                                >
                                                                    Normal
                                                                </Text>
                                                                <Group
                                                                    gap={0}
                                                                    bg={
                                                                        qtyNormal >
                                                                        0
                                                                            ? `${badgeStyle.color}18`
                                                                            : 'var(--mantine-color-dark-9)'
                                                                    }
                                                                    px={4}
                                                                    py={2}
                                                                    justify="space-between"
                                                                    style={{
                                                                        borderRadius: 20,
                                                                        border:
                                                                            qtyNormal >
                                                                            0
                                                                                ? `1px solid ${badgeStyle.color}50`
                                                                                : '1px solid rgba(255,255,255,0.06)',
                                                                        width: '100%',
                                                                        transition:
                                                                            'border-color 0.2s ease, background-color 0.2s ease',
                                                                    }}
                                                                >
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        radius="xl"
                                                                        variant="subtle"
                                                                        color="gray"
                                                                        onClick={() =>
                                                                            handleAdjustQuantity(
                                                                                cardId,
                                                                                false,
                                                                                qtyNormal,
                                                                                -1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconMinus
                                                                            size={
                                                                                8
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                    <Text
                                                                        size="xs"
                                                                        fw={800}
                                                                        style={{
                                                                            textAlign:
                                                                                'center',
                                                                        }}
                                                                        c={
                                                                            qtyNormal >
                                                                            0
                                                                                ? badgeStyle.color
                                                                                : 'dimmed'
                                                                        }
                                                                    >
                                                                        {
                                                                            qtyNormal
                                                                        }
                                                                    </Text>
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        radius="xl"
                                                                        variant="subtle"
                                                                        color="gray"
                                                                        onClick={() =>
                                                                            handleAdjustQuantity(
                                                                                cardId,
                                                                                false,
                                                                                qtyNormal,
                                                                                1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconPlus
                                                                            size={
                                                                                8
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Stack>

                                                            {/* Foil Counter */}
                                                            <Stack
                                                                gap={4}
                                                                align="center"
                                                            >
                                                                <Group
                                                                    gap={2}
                                                                    align="center"
                                                                >
                                                                    <IconSparkles
                                                                        size={
                                                                            10
                                                                        }
                                                                        color="var(--mantine-color-pink-4)"
                                                                    />
                                                                    <Text
                                                                        size="10px"
                                                                        fw={700}
                                                                        c="pink.4"
                                                                        style={{
                                                                            textTransform:
                                                                                'uppercase',
                                                                            letterSpacing:
                                                                                '0.5px',
                                                                        }}
                                                                    >
                                                                        Foil
                                                                    </Text>
                                                                </Group>
                                                                <Group
                                                                    gap={0}
                                                                    bg={
                                                                        qtyFoil >
                                                                        0
                                                                            ? 'rgba(240, 98, 146, 0.12)'
                                                                            : 'var(--mantine-color-dark-9)'
                                                                    }
                                                                    px={4}
                                                                    py={2}
                                                                    justify="space-between"
                                                                    style={{
                                                                        borderRadius: 20,
                                                                        border:
                                                                            qtyFoil >
                                                                            0
                                                                                ? '1px solid var(--mantine-color-pink-5)'
                                                                                : '1px solid rgba(255,255,255,0.06)',
                                                                        width: '100%',
                                                                        transition:
                                                                            'border-color 0.2s ease, background-color 0.2s ease',
                                                                    }}
                                                                >
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        radius="xl"
                                                                        variant="subtle"
                                                                        color="pink"
                                                                        onClick={() =>
                                                                            handleAdjustQuantity(
                                                                                cardId,
                                                                                true,
                                                                                qtyFoil,
                                                                                -1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconMinus
                                                                            size={
                                                                                8
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                    <Text
                                                                        size="xs"
                                                                        fw={800}
                                                                        c={
                                                                            qtyFoil >
                                                                            0
                                                                                ? 'pink.4'
                                                                                : 'dimmed'
                                                                        }
                                                                        style={{
                                                                            textAlign:
                                                                                'center',
                                                                        }}
                                                                    >
                                                                        {
                                                                            qtyFoil
                                                                        }
                                                                    </Text>
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        radius="xl"
                                                                        variant="subtle"
                                                                        color="pink"
                                                                        onClick={() =>
                                                                            handleAdjustQuantity(
                                                                                cardId,
                                                                                true,
                                                                                qtyFoil,
                                                                                1,
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconPlus
                                                                            size={
                                                                                8
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Stack>
                                                        </SimpleGrid>
                                                    )}
                                                </Stack>
                                            </Card>
                                        );
                                    })}
                                </SimpleGrid>

                                {/* Infinite Scroll sentinel sensor */}
                                {visibleCount < filteredCards.length && (
                                    <div
                                        ref={sentinelRef}
                                        style={{ height: 20, margin: '20px 0' }}
                                    />
                                )}
                            </>
                        )}
                    </Grid.Col>
                </Grid>
            </Container>
        </Box>
    );
}
