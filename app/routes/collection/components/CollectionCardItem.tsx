import { Box, Text, Stack, Group, SimpleGrid, ActionIcon } from '@mantine/core';
import { IconSparkles, IconMinus, IconPlus } from '@tabler/icons-react';
import type { Card as LorcanaCard } from '../../../types/lorcana';
import { getInkBadgeStyle } from '../utils/collectionHelpers';
import { LorcanaCardTile } from '../../../components/LorcanaCardTile';

export interface CollectionCardItemProps {
    card: LorcanaCard;
    getCardQuantity: (card: LorcanaCard, isFoil: boolean) => number;
    handleAdjustQuantity: (
        cardId: string,
        isFoil: boolean,
        currentQty: number,
        change: number,
    ) => void;
}

export function CollectionCardItem({
    card,
    getCardQuantity,
    handleAdjustQuantity,
}: CollectionCardItemProps) {
    const cardId = card.id || card.$id;
    const qtyNormal = getCardQuantity(card, false);
    const qtyFoil = getCardQuantity(card, true);
    const badgeStyle = getInkBadgeStyle(card.ink_color);
    const isFoilOnly =
        card.rarity === 'Enchanted' ||
        card.rarity === 'Epic' ||
        card.rarity === 'Iconic';

    return (
        <LorcanaCardTile
            card={card}
            badgeColor={badgeStyle.color}
            useShinyImage
        >
            {/* Bottom portion: Card Info & Inventory Controls */}
            <Stack gap="xs" p="xs">
                <Box style={{ minHeight: 38 }}>
                    <Text
                        fw={800}
                        size="sm"
                        lineClamp={2}
                        c="gray.1"
                        style={{ lineHeight: 1.2 }}
                    >
                        {card.name}
                    </Text>
                    <Text size="10px" c="dimmed" mt={4}>
                        {card.set} • #{card.number}
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
}
