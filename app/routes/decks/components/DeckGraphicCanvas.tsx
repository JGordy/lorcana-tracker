import React, { useMemo } from 'react';
import {
    getCardQuantity,
    getPrimaryCardType,
    type DeckCardItemInput,
} from '../utils/graphicHelpers';
import { calculateDeckStats } from '../../../utils/deck';
import { INK_HEX_MAP } from '../../../constants';
import { ALL_INKS } from '../../../types/lorcana';

export interface DeckGraphicCanvasProps {
    deckTitle: string;
    creatorName?: string;
    displayInks?: string[];
    isCoreLegal?: boolean;
    cards: DeckCardItemInput[];
    groupBy?: 'cost' | 'type';
    columns?: number;
    imageDataUrls?: Record<string, string>;
}

const INK_GRADIENT_MAP: Record<string, string> = {
    amber: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
    amethyst: 'linear-gradient(180deg, #c084fc 0%, #7e22ce 100%)',
    emerald: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
    ruby: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)',
    sapphire: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
    steel: 'linear-gradient(180deg, #94a3b8 0%, #475569 100%)',
};

export const DeckGraphicCanvas = React.forwardRef<
    HTMLDivElement,
    DeckGraphicCanvasProps
>(function DeckGraphicCanvas(
    {
        deckTitle,
        creatorName,
        displayInks = [],
        isCoreLegal = true,
        cards,
        groupBy = 'cost',
        columns = 8,
        imageDataUrls = {},
    },
    ref,
) {
    const stats = useMemo(() => calculateDeckStats(cards), [cards]);

    // Flatten and sort cards based on groupBy setting
    const sortedCardItems = useMemo(() => {
        if (!Array.isArray(cards)) return [];

        const items = cards
            .map((item) => ({
                card: item.card,
                quantity: getCardQuantity(item),
            }))
            .filter((i) => Boolean(i.card));

        return [...items].sort((a, b) => {
            if (groupBy === 'type') {
                const typeA = getPrimaryCardType(a.card);
                const typeB = getPrimaryCardType(b.card);
                if (typeA !== typeB) return typeA.localeCompare(typeB);
            }
            // Sort by cost ascending
            const costA = typeof a.card.cost === 'number' ? a.card.cost : 0;
            const costB = typeof b.card.cost === 'number' ? b.card.cost : 0;
            if (costA !== costB) return costA - costB;
            // Sort by name alphabetically
            return (a.card.name || '').localeCompare(b.card.name || '');
        });
    }, [cards, groupBy]);

    // Cost tiers for histogram
    const costTiers = useMemo(() => {
        const hasZero = Boolean(stats.costDistribution['0']?.count);
        return hasZero
            ? ['0', '1', '2', '3', '4', '5', '6', '7+']
            : ['1', '2', '3', '4', '5', '6', '7+'];
    }, [stats.costDistribution]);

    // Max count for mini cost curve
    const maxCostCount = useMemo(() => {
        let max = 1;
        costTiers.forEach((t) => {
            const count = stats.costDistribution[t]?.count || 0;
            if (count > max) max = count;
        });
        return max;
    }, [costTiers, stats.costDistribution]);

    const inksList = displayInks.length > 0 ? displayInks : ['amber'];

    return (
        <div
            ref={ref}
            style={{
                width: 1200,
                boxSizing: 'border-box',
                padding: '28px 32px',
                background: 'linear-gradient(180deg, #110d28 0%, #070514 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 16,
                boxShadow:
                    '0 30px 60px -12px rgba(0, 0, 0, 0.95), 0 0 50px rgba(168, 85, 247, 0.15)',
                color: '#f8fafc',
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            {/* 1. Header Section */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 16,
                    marginBottom: 20,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Left: Creator ✦ Deck Title & Subtitle */}
                <div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 4,
                        }}
                    >
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 28,
                                fontWeight: 900,
                                fontFamily:
                                    "'Cinzel Decorative', Georgia, serif",
                                background:
                                    'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {creatorName ? `${creatorName} ✦ ` : ''}
                            {deckTitle || 'Untitled Deck'}
                        </h1>
                        <span
                            style={{
                                padding: '3px 10px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                background: isCoreLegal
                                    ? 'linear-gradient(90deg, #0d9488, #059669)'
                                    : 'linear-gradient(90deg, #ea580c, #d97706)',
                                color: '#ffffff',
                            }}
                        >
                            {isCoreLegal ? 'Core Legal' : 'Infinity'}
                        </span>
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            color: '#c084fc',
                            fontWeight: 600,
                        }}
                    >
                        Built with Glimmerforge
                    </div>
                </div>

                {/* Right: Inks & Metric Badges */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                    }}
                >
                    {/* Ink Badges */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 6,
                            alignItems: 'center',
                        }}
                    >
                        {inksList.map((inkName) => {
                            const normalized = inkName.toLowerCase().trim();
                            const hex = INK_HEX_MAP[normalized] || '#94a3b8';
                            const matchedInk = ALL_INKS.find(
                                (i) => i.id === normalized,
                            );

                            return (
                                <div
                                    key={inkName}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '4px 12px',
                                        borderRadius: 20,
                                        background: 'rgba(15, 23, 42, 0.75)',
                                        border: `1px solid ${hex}70`,
                                        boxShadow: `0 0 10px ${hex}25`,
                                    }}
                                >
                                    <img
                                        src={`/inks/${normalized}.svg`}
                                        alt=""
                                        style={{
                                            width: 14,
                                            height: 14,
                                            display: 'block',
                                        }}
                                        onError={(e) => {
                                            (
                                                e.target as HTMLElement
                                            ).style.display = 'none';
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            color: hex,
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {matchedInk ? matchedInk.name : inkName}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stat Badges Container */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            padding: '5px 14px',
                            borderRadius: 10,
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    fontSize: 9,
                                    color: '#94a3b8',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Cards
                            </div>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 900,
                                    color: '#ffffff',
                                }}
                            >
                                {stats.totalCards}
                            </div>
                        </div>

                        <div
                            style={{
                                width: 1,
                                background: 'rgba(255, 255, 255, 0.15)',
                            }}
                        />

                        <div style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    fontSize: 9,
                                    color: '#94a3b8',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Avg Cost
                            </div>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 900,
                                    color: '#c084fc',
                                }}
                            >
                                {stats.averageCost}⬡
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Compact Horizontal Cards Matrix Grid (Dreamborn-Style Spread) */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: 10,
                    marginBottom: 24,
                }}
            >
                {sortedCardItems.map(({ card, quantity }) => {
                    const cardInk = (card.ink_color || 'steel')
                        .toLowerCase()
                        .trim();
                    const inkHex = INK_HEX_MAP[cardInk] || '#94a3b8';
                    const imgSrc =
                        imageDataUrls[card.id] ||
                        imageDataUrls[card.$id] ||
                        card.image_url;

                    return (
                        <div
                            key={card.id}
                            style={{
                                position: 'relative',
                                aspectRatio: '5/7',
                                borderRadius: 7,
                                overflow: 'hidden',
                                backgroundColor: 'rgba(10, 14, 26, 0.9)',
                                border: `1px solid ${inkHex}80`,
                                boxShadow: `0 3px 10px rgba(0, 0, 0, 0.65), 0 0 8px ${inkHex}25`,
                            }}
                        >
                            {/* Card Image */}
                            {imgSrc ? (
                                <img
                                    src={imgSrc}
                                    alt=""
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        (
                                            e.target as HTMLElement
                                        ).style.display = 'none';
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        padding: 6,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontSize: 9,
                                        fontWeight: 700,
                                    }}
                                >
                                    {card.name}
                                </div>
                            )}

                            {/* Floating Quantity Badge (Top-Right) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    padding: '2px 6px',
                                    borderRadius: 5,
                                    background: 'rgba(10, 14, 26, 0.92)',
                                    border: `1px solid ${inkHex}`,
                                    fontSize: 11,
                                    fontWeight: 900,
                                    color: '#ffffff',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.95)',
                                    lineHeight: 1,
                                }}
                            >
                                {quantity}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. Enhanced Footer: Stacked Ink Color Cost Curve & Branding */}
            <div
                style={{
                    padding: '16px 24px',
                    borderRadius: 12,
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: 90,
                    boxSizing: 'border-box',
                }}
            >
                {/* Stacked Ink Color Cost Curve Histogram */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                    }}
                >
                    <div>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 900,
                                color: '#e2e8f0',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                display: 'block',
                            }}
                        >
                            Cost Curve
                        </span>
                        <span
                            style={{
                                fontSize: 10,
                                color: '#94a3b8',
                                fontWeight: 600,
                            }}
                        >
                            Ink distribution by cost
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-end',
                            height: 80,
                        }}
                    >
                        {costTiers.map((tier) => {
                            const detail = stats.costDistribution[tier] || {
                                count: 0,
                                inkable: 0,
                                uninkable: 0,
                                inkDistribution: {},
                                cards: [],
                            };
                            const count = detail.count;
                            const maxBarHeight = 36;
                            const barHeight =
                                count > 0
                                    ? Math.max(
                                          Math.round(
                                              (count / maxCostCount) *
                                                  maxBarHeight,
                                          ),
                                          8,
                                      )
                                    : 4;

                            return (
                                <div
                                    key={tier}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: 22,
                                    }}
                                >
                                    {/* Number Count on Top */}
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 800,
                                            color:
                                                count > 0
                                                    ? '#ffffff'
                                                    : '#64748b',
                                            marginBottom: 3,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {count > 0 ? count : '-'}
                                    </span>

                                    {/* Stacked Ink Color Bar */}
                                    <div
                                        style={{
                                            width: 18,
                                            height: 36,
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '100%',
                                                height: barHeight,
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'flex-end',
                                                background:
                                                    count === 0
                                                        ? 'rgba(255, 255, 255, 0.08)'
                                                        : undefined,
                                                boxShadow:
                                                    count > 0
                                                        ? '0 0 10px rgba(168, 85, 247, 0.3)'
                                                        : undefined,
                                            }}
                                        >
                                            {Object.entries(
                                                detail.inkDistribution || {},
                                            ).map(([ink, inkCount]) => {
                                                const ratio =
                                                    count > 0
                                                        ? (inkCount / count) *
                                                          100
                                                        : 0;
                                                const gradient =
                                                    INK_GRADIENT_MAP[ink] ||
                                                    'linear-gradient(180deg, #94a3b8 0%, #475569 100%)';
                                                return (
                                                    <div
                                                        key={ink}
                                                        style={{
                                                            width: '100%',
                                                            height: `${ratio}%`,
                                                            background:
                                                                gradient,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Cost Orb Pill */}
                                    <div
                                        style={{
                                            marginTop: 5,
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background:
                                                count > 0
                                                    ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                                                    : 'rgba(255, 255, 255, 0.08)',
                                            border:
                                                count > 0
                                                    ? '1px solid rgba(216, 180, 254, 0.6)'
                                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 10,
                                            fontWeight: 900,
                                            color:
                                                count > 0
                                                    ? '#ffffff'
                                                    : '#64748b',
                                            boxShadow:
                                                count > 0
                                                    ? '0 2px 6px rgba(0,0,0,0.5)'
                                                    : undefined,
                                        }}
                                    >
                                        {tier}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Watermark Branding */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 14,
                        fontWeight: 900,
                        letterSpacing: '0.5px',
                        background:
                            'linear-gradient(to right, #ffffff, #c084fc)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    <span>Glimmerforge</span>
                </div>
            </div>
        </div>
    );
});
