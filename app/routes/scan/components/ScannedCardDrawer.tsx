import { useMemo } from 'react';
import {
    Drawer,
    Box,
    Group,
    Stack,
    Image,
    Title,
    Text,
    Badge,
    Button,
    ActionIcon,
    Paper,
    Divider,
} from '@mantine/core';
import {
    IconMinus,
    IconPlus,
    IconSparkles,
    IconCheck,
    IconX,
} from '@tabler/icons-react';
import type { Card } from '../../../types/lorcana';
import { RARITY_COLOR, INK_HEX_MAP } from '../../../constants/lorcana';
import { formatCurrency } from '../../../utils/valuation';
import { getCardSlug } from '../../../utils/deck';

export interface ScannedCardDrawerProps {
    opened: boolean;
    onClose: () => void;
    card: Card | null;
    allCards?: Card[];
    normalQty: number;
    foilQty: number;
    onAdjustQuantity: (
        cardId: string,
        delta: number,
        isFoil: boolean,
    ) => Promise<void> | void;
    onSelectCard?: (card: Card) => void;
    detectionMethod?: 'ocr' | 'ai';
}

export function ScannedCardDrawer({
    opened,
    onClose,
    card,
    allCards,
    normalQty,
    foilQty,
    onAdjustQuantity,
    onSelectCard,
}: ScannedCardDrawerProps) {
    // Identify unique collector variants (Epic, Enchanted, Promo, Special, over-number > 204)
    const isUnique = Boolean(
        card &&
        (['Epic', 'Enchanted', 'Promo', 'Special'].includes(card.rarity) ||
            card.number > 204 ||
            card.id.includes('-p')),
    );

    // Cards like Epics and Enchanteds only exist in foil form in Lorcana
    const isFoilOnly = Boolean(
        card &&
        (card.rarity === 'Epic' ||
            card.rarity === 'Enchanted' ||
            (card.prices?.usd_foil != null && card.prices?.usd == null)),
    );

    // Find all available printings/versions in catalog sharing the same canonical title.
    // Unique cards (e.g. Epics, Enchanteds) are distinct collector items and should not display base-level printings or pricing.
    // Base cards should only display other standard base printings (reprints across sets).
    const availableVersions = useMemo(() => {
        if (!card || !allCards || allCards.length === 0) return [];
        const targetSlug = getCardSlug(card.name);
        const allMatching = allCards.filter(
            (c) => getCardSlug(c.name) === targetSlug,
        );

        if (isUnique) {
            return allMatching.filter((c) => c.rarity === card.rarity);
        }

        return allMatching.filter(
            (c) =>
                !['Epic', 'Enchanted', 'Promo', 'Special'].includes(c.rarity) &&
                c.number <= 204 &&
                !c.id.includes('-p'),
        );
    }, [card, allCards, isUnique]);

    if (!card) return null;

    const rarityColor = RARITY_COLOR[card.rarity] || '#94a3b8';
    const inkColorHex = INK_HEX_MAP[card.ink_color?.toLowerCase()] || '#a855f7';

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="bottom"
            size="auto"
            zIndex={1200}
            withCloseButton={false}
            styles={{
                content: {
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    background:
                        'linear-gradient(180deg, #18152e 0%, #0d0e1e 100%)',
                    borderTop: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
                    maxHeight: '66vh',
                },
                body: {
                    padding: '12px 18px 20px',
                },
            }}
        >
            {/* Top Bar: Rarity Badge and Close X */}
            <Group justify="space-between" align="center" mb={8}>
                <Badge
                    size="xs"
                    variant="filled"
                    style={{
                        backgroundColor: rarityColor,
                        color: '#000000',
                        fontWeight: 700,
                    }}
                >
                    {card.rarity}
                </Badge>

                <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="md"
                    radius="xl"
                    onClick={onClose}
                    aria-label="Close drawer"
                    style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                    }}
                >
                    <IconX size={18} />
                </ActionIcon>
            </Group>

            <Stack gap="xs">
                <Group align="flex-start" wrap="nowrap" gap="md">
                    {/* Card Thumbnail */}
                    <Box
                        style={{
                            width: 135,
                            flexShrink: 0,
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                            border: `2px solid ${inkColorHex}60`,
                        }}
                    >
                        <Image
                            src={card.image_url}
                            alt={card.name}
                            fallbackSrc="https://placehold.co/135x188?text=Card"
                            radius="md"
                        />
                    </Box>

                    {/* Card Meta */}
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Title
                            order={3}
                            size="h5"
                            style={{
                                color: '#ffffff',
                                whiteSpace: 'normal',
                                lineHeight: 1.25,
                            }}
                        >
                            {card.name}
                        </Title>

                        <Text size="xs" c="dimmed">
                            {card.set} • #{card.number}
                        </Text>

                        {/* Prices */}
                        <Group gap="md" mt={2}>
                            {card.prices?.usd != null && (
                                <Text size="xs" c="gray.3">
                                    Normal:{' '}
                                    <Text
                                        span
                                        fw={700}
                                        c="emerald.4"
                                        style={{ color: '#34d399' }}
                                    >
                                        {formatCurrency(card.prices.usd)}
                                    </Text>
                                </Text>
                            )}
                            {card.prices?.usd_foil != null && (
                                <Text size="xs" c="gray.3">
                                    Foil:{' '}
                                    <Text
                                        span
                                        fw={700}
                                        style={{ color: '#c084fc' }}
                                    >
                                        {formatCurrency(card.prices.usd_foil)}
                                    </Text>
                                </Text>
                            )}
                        </Group>

                        {/* Other Printings / Versions Switcher */}
                        {availableVersions.length > 1 && (
                            <Stack gap={3} mt={4}>
                                <Text
                                    size="xs"
                                    c="dimmed"
                                    fw={600}
                                    style={{
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.02em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Printings:
                                </Text>
                                <Group gap={4} wrap="wrap">
                                    {availableVersions.map((v) => {
                                        const isSelected = v.id === card.id;
                                        const vPrice =
                                            v.prices?.usd_foil ?? v.prices?.usd;
                                        const priceLabel =
                                            vPrice != null
                                                ? `$${vPrice.toFixed(2)}`
                                                : '';
                                        return (
                                            <Badge
                                                key={v.id}
                                                size="xs"
                                                variant={
                                                    isSelected
                                                        ? 'filled'
                                                        : 'outline'
                                                }
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected
                                                        ? 'rgba(168, 85, 247, 0.35)'
                                                        : 'transparent',
                                                    borderColor: isSelected
                                                        ? '#a855f7'
                                                        : 'rgba(255, 255, 255, 0.2)',
                                                    color: isSelected
                                                        ? '#ffffff'
                                                        : 'rgba(255, 255, 255, 0.75)',
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                }}
                                                onClick={() =>
                                                    onSelectCard?.(v)
                                                }
                                            >
                                                {v.rarity} #{v.number}{' '}
                                                {priceLabel
                                                    ? `• ${priceLabel}`
                                                    : ''}
                                            </Badge>
                                        );
                                    })}
                                </Group>
                            </Stack>
                        )}
                    </Stack>
                </Group>

                <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                {/* Inventory Quantity Adjusters */}
                <Group justify="space-between" grow={!isFoilOnly} gap="sm">
                    {/* Standard Version Controls */}
                    {!isFoilOnly && (
                        <Paper
                            p="xs"
                            radius="md"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <Text
                                size="xs"
                                fw={600}
                                c="dimmed"
                                mb={4}
                                ta="center"
                            >
                                Regular Copy
                            </Text>
                            <Group justify="center" align="center" gap="xs">
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    aria-label="Decrease regular quantity"
                                    disabled={normalQty <= 0}
                                    onClick={() =>
                                        onAdjustQuantity(card.id, -1, false)
                                    }
                                >
                                    <IconMinus size={14} />
                                </ActionIcon>

                                <Text fw={700} size="md" w={24} ta="center">
                                    {normalQty}
                                </Text>

                                <ActionIcon
                                    variant="filled"
                                    color="teal"
                                    size="sm"
                                    aria-label="Increase regular quantity"
                                    onClick={() =>
                                        onAdjustQuantity(card.id, 1, false)
                                    }
                                >
                                    <IconPlus size={14} />
                                </ActionIcon>
                            </Group>
                        </Paper>
                    )}

                    {/* Foil Version Controls */}
                    <Paper
                        p="xs"
                        radius="md"
                        style={{
                            backgroundColor: 'rgba(168, 85, 247, 0.06)',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            ...(isFoilOnly ? { width: '100%' } : {}),
                        }}
                    >
                        <Group justify="center" gap={4} mb={4}>
                            <IconSparkles size={13} color="#c084fc" />
                            <Text
                                size="xs"
                                fw={600}
                                style={{ color: '#c084fc' }}
                                ta="center"
                            >
                                Foil Copy
                            </Text>
                        </Group>
                        <Group justify="center" align="center" gap="xs">
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                aria-label="Decrease foil quantity"
                                disabled={foilQty <= 0}
                                onClick={() =>
                                    onAdjustQuantity(card.id, -1, true)
                                }
                            >
                                <IconMinus size={14} />
                            </ActionIcon>

                            <Text fw={700} size="md" w={24} ta="center">
                                {foilQty}
                            </Text>

                            <ActionIcon
                                variant="filled"
                                color="grape"
                                size="sm"
                                aria-label="Increase foil quantity"
                                onClick={() =>
                                    onAdjustQuantity(card.id, 1, true)
                                }
                            >
                                <IconPlus size={14} />
                            </ActionIcon>
                        </Group>
                    </Paper>
                </Group>

                {/* Confirm & Continue button */}
                <Button
                    fullWidth
                    size="md"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'teal', to: 'cyan' }}
                    leftSection={<IconCheck size={18} />}
                    onClick={onClose}
                    style={{
                        boxShadow: '0 4px 15px rgba(20, 184, 166, 0.3)',
                    }}
                >
                    Keep Scanning
                </Button>
            </Stack>
        </Drawer>
    );
}
