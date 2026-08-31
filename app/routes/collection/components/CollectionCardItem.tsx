import React, { memo } from 'react';
import {
    Box,
    Text,
    Stack,
    Group,
    SimpleGrid,
    ActionIcon,
    Tooltip,
    Badge,
} from '@mantine/core';
import {
    IconSparkles,
    IconMinus,
    IconPlus,
    IconExternalLink,
} from '@tabler/icons-react';
import type { Card as LorcanaCard } from '../../../types/lorcana';
import { getInkBadgeStyle } from '../utils/collectionHelpers';
import { LorcanaCardTile } from '../../../components/LorcanaCardTile';
import { formatCurrency } from '../../../utils/valuation';
import { getTcgPlayerCardSearchUrl } from '../../../utils/shoppingList';

export interface CollectionCardItemProps {
    card: LorcanaCard;
    qtyNormal?: number;
    qtyFoil?: number;
    getCardQuantity?: (card: LorcanaCard, isFoil: boolean) => number;
    handleAdjustQuantity: (
        cardId: string,
        isFoil: boolean,
        currentQty: number,
        change: number,
    ) => void;
}

export const CollectionCardItem = memo(function CollectionCardItem({
    card,
    qtyNormal: propQtyNormal,
    qtyFoil: propQtyFoil,
    getCardQuantity,
    handleAdjustQuantity,
}: CollectionCardItemProps) {
    const cardId = card.id || card.$id;
    const qtyNormal =
        propQtyNormal ?? (getCardQuantity ? getCardQuantity(card, false) : 0);
    const qtyFoil =
        propQtyFoil ?? (getCardQuantity ? getCardQuantity(card, true) : 0);
    const badgeStyle = getInkBadgeStyle(card.ink_color);
    const isFoilOnly =
        card.rarity === 'Enchanted' ||
        card.rarity === 'Epic' ||
        card.rarity === 'Iconic';

    const tcgUrl = card.tcgplayer_url || getTcgPlayerCardSearchUrl(card.name);

    return (
        <LorcanaCardTile
            card={card}
            badgeColor={badgeStyle.color}
            useShinyImage
        >
            {/* Bottom portion: Card Info & Inventory Controls */}
            <Stack gap="xs" p="xs">
                <Box style={{ minHeight: 48 }}>
                    <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="nowrap"
                        gap={4}
                    >
                        <Text
                            fw={800}
                            size="sm"
                            lineClamp={2}
                            c="gray.1"
                            style={{ lineHeight: 1.2, flex: 1 }}
                        >
                            {card.name}
                        </Text>
                        <Tooltip
                            label="View on TCGPlayer"
                            position="top"
                            withArrow
                        >
                            <ActionIcon
                                component="a"
                                href={tcgUrl}
                                aria-label="View on TCGPlayer"
                                target="_blank"
                                rel="noopener noreferrer"
                                size="xs"
                                variant="subtle"
                                color="blue"
                                style={{ opacity: 0.7, marginTop: -2 }}
                            >
                                <IconExternalLink size={13} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>

                    <Text size="10px" c="dimmed" mt={3} lineClamp={1}>
                        {card.set} • #{card.number}
                    </Text>

                    {(card.prices?.usd != null ||
                        card.prices?.usd_foil != null) && (
                        <Group gap={6} align="center" mt={4} wrap="wrap">
                            {card.prices?.usd != null && (
                                <Badge
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    style={{
                                        fontSize: 10,
                                        height: 18,
                                        padding: '0 6px',
                                        backgroundColor:
                                            'rgba(255, 255, 255, 0.06)',
                                        color: '#cbd5e1',
                                        fontWeight: 600,
                                    }}
                                >
                                    {formatCurrency(card.prices.usd)}
                                </Badge>
                            )}
                            {card.prices?.usd_foil != null && (
                                <Badge
                                    size="xs"
                                    variant="subtle"
                                    color="pink"
                                    leftSection={<IconSparkles size={9} />}
                                    style={{
                                        fontSize: 10,
                                        height: 18,
                                        padding: '0 6px',
                                        backgroundColor:
                                            'rgba(236, 72, 153, 0.14)',
                                        color: '#f472b6',
                                        fontWeight: 700,
                                    }}
                                >
                                    {formatCurrency(card.prices.usd_foil)}
                                </Badge>
                            )}
                        </Group>
                    )}
                </Box>

                {isFoilOnly ? (
                    <Box
                        mt={4}
                        style={{
                            borderTop: `1px solid ${badgeStyle.color}40`,
                            paddingTop: 10,
                        }}
                    >
                        <Stack gap={4} align="center">
                            <Group gap={3} align="center">
                                <IconSparkles
                                    size={11}
                                    color="var(--mantine-color-pink-4)"
                                />
                                <Text
                                    size="10px"
                                    fw={700}
                                    c="pink.4"
                                    style={{
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    Foil Only
                                </Text>
                            </Group>
                            <Group
                                gap={0}
                                bg={
                                    qtyFoil > 0
                                        ? 'rgba(240, 98, 146, 0.14)'
                                        : 'var(--mantine-color-dark-9)'
                                }
                                px={6}
                                py={2}
                                justify="space-between"
                                style={{
                                    borderRadius: 20,
                                    border:
                                        qtyFoil > 0
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
                                    <IconMinus size={8} />
                                </ActionIcon>
                                <Text
                                    size="xs"
                                    fw={800}
                                    c={qtyFoil > 0 ? 'pink.4' : 'dimmed'}
                                    style={{ textAlign: 'center' }}
                                >
                                    {qtyFoil}
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
                                    <IconPlus size={8} />
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
                        <Stack gap={4} align="center">
                            <Text
                                size="10px"
                                fw={700}
                                c={qtyNormal > 0 ? badgeStyle.color : 'dimmed'}
                                style={{
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    opacity: qtyNormal > 0 ? 1 : 0.6,
                                }}
                            >
                                Normal
                            </Text>
                            <Group
                                gap={0}
                                bg={
                                    qtyNormal > 0
                                        ? `${badgeStyle.color}18`
                                        : 'var(--mantine-color-dark-9)'
                                }
                                px={4}
                                py={2}
                                justify="space-between"
                                style={{
                                    borderRadius: 20,
                                    border:
                                        qtyNormal > 0
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
                                    <IconMinus size={8} />
                                </ActionIcon>
                                <Text
                                    size="xs"
                                    fw={800}
                                    style={{ textAlign: 'center' }}
                                    c={
                                        qtyNormal > 0
                                            ? badgeStyle.color
                                            : 'dimmed'
                                    }
                                >
                                    {qtyNormal}
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
                                    <IconPlus size={8} />
                                </ActionIcon>
                            </Group>
                        </Stack>

                        {/* Foil Counter */}
                        <Stack gap={4} align="center">
                            <Group gap={2} align="center">
                                <IconSparkles
                                    size={10}
                                    color="var(--mantine-color-pink-4)"
                                />
                                <Text
                                    size="10px"
                                    fw={700}
                                    c="pink.4"
                                    style={{
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    Foil
                                </Text>
                            </Group>
                            <Group
                                gap={0}
                                bg={
                                    qtyFoil > 0
                                        ? 'rgba(240, 98, 146, 0.12)'
                                        : 'var(--mantine-color-dark-9)'
                                }
                                px={4}
                                py={2}
                                justify="space-between"
                                style={{
                                    borderRadius: 20,
                                    border:
                                        qtyFoil > 0
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
                                    <IconMinus size={8} />
                                </ActionIcon>
                                <Text
                                    size="xs"
                                    fw={800}
                                    c={qtyFoil > 0 ? 'pink.4' : 'dimmed'}
                                    style={{ textAlign: 'center' }}
                                >
                                    {qtyFoil}
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
                                    <IconPlus size={8} />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    </SimpleGrid>
                )}
            </Stack>
        </LorcanaCardTile>
    );
});
