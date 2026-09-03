import {
    Group,
    Stack,
    Text,
    Badge,
    Button,
    Tooltip,
    ActionIcon,
    List,
    ThemeIcon,
} from '@mantine/core';
import {
    IconExternalLink,
    IconPlus,
    IconArrowsExchange,
    IconSparkles,
    IconCheck,
} from '@tabler/icons-react';
import type { Card } from '../../types/lorcana';
import type { SubstitutionRecommendation } from '../../utils/substitutions';
import { LorcanaCardTile } from '../LorcanaCardTile';
import { getInkBadgeStyle } from '../../routes/decks/utils/deckHelpers';
import { formatCurrency } from '../../utils/valuation';
import { getTcgPlayerCardSearchUrl } from '../../utils/shoppingList';

export interface SubstituteCardTileProps {
    substitute: SubstitutionRecommendation;
    targetCard?: Card;
    user?: { $id: string } | null;
    canSwap?: boolean;
    onSwapCard?: (substituteCard: Card, swapQuantity: number) => void;
    onQuickAdd?: (cardId: string, newOwnedQty: number) => void;
}

const darkTooltipStyles = {
    tooltip: {
        background:
            'linear-gradient(180deg, rgba(24, 18, 52, 0.98) 0%, rgba(13, 9, 30, 0.98) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.45)',
        boxShadow:
            '0 16px 36px rgba(0, 0, 0, 0.9), 0 0 20px rgba(168, 85, 247, 0.25)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: '#ffffff',
    },
    arrow: {
        border: '1px solid rgba(168, 85, 247, 0.45)',
        background: 'rgba(13, 9, 30, 0.98)',
    },
};

export function SubstituteCardTile({
    substitute,
    targetCard: _targetCard,
    user,
    canSwap = false,
    onSwapCard,
    onQuickAdd,
}: SubstituteCardTileProps) {
    const {
        card,
        score,
        reasons,
        priceDifference,
        percentSavings,
        ownedQty,
        inDeckQty,
        maxCanAdd,
    } = substitute;

    const inkStyle = getInkBadgeStyle(card.ink_color || '');
    const priceUsd = card.prices?.usd ?? null;

    const isCheaper =
        priceDifference !== null &&
        priceDifference > 0 &&
        percentSavings !== null &&
        percentSavings > 0;

    const primaryReason = reasons[0] || '';
    const extraReasonsCount = Math.max(0, reasons.length - 1);

    return (
        <LorcanaCardTile
            card={card}
            badgeColor={inkStyle.color}
            aspectRatio="5/7"
            headerOverlay={
                <Group
                    justify="flex-end"
                    align="flex-start"
                    wrap="nowrap"
                    p={6}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 2,
                    }}
                >
                    <Group gap={4} align="center" wrap="nowrap">
                        {/* Top Right: Score Badge with Themed Header & Bulleted Reason List */}
                        <Tooltip
                            label={
                                <Stack gap={8} style={{ maxWidth: 280 }}>
                                    <Group
                                        justify="space-between"
                                        align="center"
                                        wrap="nowrap"
                                        pb={6}
                                        style={{
                                            borderBottom:
                                                '1px solid rgba(255, 255, 255, 0.12)',
                                        }}
                                    >
                                        <Group gap={6} align="center">
                                            <IconSparkles
                                                size={14}
                                                color="#c084fc"
                                            />
                                            <Text
                                                size="xs"
                                                fw={800}
                                                c="#ffffff"
                                                style={{
                                                    fontFamily:
                                                        "'Cinzel Decorative', serif",
                                                    letterSpacing: '0.5px',
                                                }}
                                            >
                                                Why this is a good substitute
                                            </Text>
                                        </Group>
                                        <Badge
                                            size="xs"
                                            variant="filled"
                                            color="violet.8"
                                            style={{
                                                fontWeight: 800,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {score} pts
                                        </Badge>
                                    </Group>

                                    <List
                                        size="xs"
                                        spacing={5}
                                        icon={
                                            <ThemeIcon
                                                color="teal.6"
                                                size={14}
                                                radius="xl"
                                                variant="light"
                                            >
                                                <IconCheck
                                                    size={10}
                                                    stroke={3}
                                                />
                                            </ThemeIcon>
                                        }
                                    >
                                        {reasons.map((r, i) => (
                                            <List.Item
                                                key={i}
                                                style={{
                                                    color: '#f1f5f9',
                                                    fontSize: '11px',
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {r}
                                            </List.Item>
                                        ))}
                                    </List>
                                </Stack>
                            }
                            withArrow
                            position="top"
                            multiline
                            zIndex={1000}
                            styles={darkTooltipStyles}
                        >
                            <Badge
                                size="xs"
                                variant="filled"
                                color="violet.8"
                                leftSection={<IconSparkles size={10} />}
                                style={{
                                    backdropFilter: 'blur(6px)',
                                    backgroundColor: 'rgba(107, 33, 168, 0.85)',
                                    border: '1px solid rgba(192, 132, 252, 0.4)',
                                    fontWeight: 700,
                                    cursor: 'help',
                                }}
                            >
                                {score} pts
                            </Badge>
                        </Tooltip>

                        <Tooltip
                            label="View on TCGPlayer"
                            withArrow
                            position="top"
                            zIndex={1000}
                            styles={darkTooltipStyles}
                        >
                            <ActionIcon
                                component="a"
                                href={
                                    card.tcgplayer_url ||
                                    getTcgPlayerCardSearchUrl(card.name)
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                size="xs"
                                variant="filled"
                                color="dark"
                                style={{
                                    backdropFilter: 'blur(6px)',
                                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                }}
                            >
                                <IconExternalLink size={11} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            }
        >
            <Stack gap={6} p={8} justify="space-between" style={{ flex: 1 }}>
                {/* Row 1: Ownership & Price + Cost Savings Together */}
                <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap={4} align="center">
                        <Badge
                            size="xs"
                            variant={ownedQty > 0 ? 'light' : 'outline'}
                            color={ownedQty > 0 ? 'teal' : 'gray'}
                            style={{ fontWeight: 600 }}
                        >
                            {ownedQty > 0 ? `${ownedQty} owned` : '0 owned'}
                        </Badge>
                        {inDeckQty > 0 && (
                            <Badge size="xs" variant="light" color="violet">
                                {inDeckQty} in deck
                            </Badge>
                        )}
                    </Group>

                    {/* Cost of card and savings badge together */}
                    <Group gap={4} align="center" wrap="nowrap">
                        {isCheaper && (
                            <Badge
                                size="xs"
                                variant="filled"
                                color="teal.8"
                                style={{
                                    backgroundColor: 'rgba(13, 148, 136, 0.9)',
                                    fontWeight: 700,
                                    fontSize: '10px',
                                }}
                            >
                                Save {formatCurrency(priceDifference!)} (
                                {percentSavings}%)
                            </Badge>
                        )}
                        {priceUsd !== null && (
                            <Text size="11px" fw={700} c="teal.3">
                                {formatCurrency(priceUsd)}
                            </Text>
                        )}
                    </Group>
                </Group>

                {/* Row 2: Match Reasons Badge */}
                {primaryReason && (
                    <Group gap={4} wrap="nowrap" align="center">
                        <Tooltip
                            label={
                                <Stack gap={6} style={{ maxWidth: 260 }}>
                                    <Text
                                        size="xs"
                                        fw={800}
                                        c="#ffffff"
                                        style={{
                                            borderBottom:
                                                '1px solid rgba(255, 255, 255, 0.12)',
                                            paddingBottom: 4,
                                        }}
                                    >
                                        Match Breakdown
                                    </Text>
                                    <List
                                        size="xs"
                                        spacing={4}
                                        icon={
                                            <ThemeIcon
                                                color="teal.6"
                                                size={14}
                                                radius="xl"
                                                variant="light"
                                            >
                                                <IconCheck
                                                    size={10}
                                                    stroke={3}
                                                />
                                            </ThemeIcon>
                                        }
                                    >
                                        {reasons.map((r, i) => (
                                            <List.Item
                                                key={i}
                                                style={{
                                                    color: '#f1f5f9',
                                                    fontSize: '11px',
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {r}
                                            </List.Item>
                                        ))}
                                    </List>
                                </Stack>
                            }
                            withArrow
                            position="top"
                            multiline
                            zIndex={1000}
                            styles={darkTooltipStyles}
                        >
                            <Badge
                                size="xs"
                                variant="light"
                                color="cyan"
                                radius="sm"
                                style={{
                                    fontSize: '10px',
                                    textTransform: 'none',
                                    flex: 1,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    cursor: 'help',
                                }}
                            >
                                {primaryReason}
                                {extraReasonsCount > 0 &&
                                    ` (+${extraReasonsCount})`}
                            </Badge>
                        </Tooltip>
                    </Group>
                )}

                {/* Row 3: Action Buttons */}
                <Group gap={4} wrap="nowrap" mt={2}>
                    {canSwap && onSwapCard && (
                        <Button
                            size="xs"
                            variant="gradient"
                            gradient={{
                                from: 'violet.7',
                                to: 'indigo.6',
                                deg: 90,
                            }}
                            leftSection={<IconArrowsExchange size={13} />}
                            disabled={maxCanAdd <= 0}
                            onClick={() => onSwapCard(card, 1)}
                            style={{
                                flex: 1,
                                fontWeight: 700,
                                paddingLeft: 6,
                                paddingRight: 6,
                            }}
                        >
                            Swap
                        </Button>
                    )}

                    {user && onQuickAdd && (
                        <Tooltip
                            label="Add 1 copy to collection"
                            position="top"
                            zIndex={1000}
                            styles={darkTooltipStyles}
                        >
                            <Button
                                size="xs"
                                variant="light"
                                color="violet"
                                leftSection={<IconPlus size={11} />}
                                onClick={() =>
                                    onQuickAdd(card.id, ownedQty + 1)
                                }
                                style={{
                                    fontSize: 11,
                                    paddingLeft: 6,
                                    paddingRight: 6,
                                    flex: canSwap ? undefined : 1,
                                }}
                            >
                                +1 Coll
                            </Button>
                        </Tooltip>
                    )}
                </Group>
            </Stack>
        </LorcanaCardTile>
    );
}
