import { useState, useMemo } from 'react';
import {
    Modal,
    Stack,
    Group,
    Box,
    Text,
    Badge,
    Button,
    ScrollArea,
    SimpleGrid,
    Card,
    ThemeIcon,
    Paper,
    Tooltip,
    ActionIcon,
    Menu,
} from '@mantine/core';
import {
    IconShoppingCart,
    IconCheck,
    IconCopy,
    IconExternalLink,
    IconPlus,
    IconSparkles,
    IconFileText,
    IconSearch,
    IconChevronDown,
    IconCards,
    IconArrowsExchange,
} from '@tabler/icons-react';
import type { Card as LorcanaCard, DeckWithProgress } from '../types/lorcana';
import { getInkBadgeStyle } from '../routes/decks/utils/deckHelpers';
import {
    getMissingCards,
    formatTcgPlayerMassEntry,
    formatMarkdownShoppingList,
    formatPlainTextShoppingList,
    getTcgPlayerMassEntryUrl,
    getTcgPlayerCardSearchUrl,
    getCardmarketWantsUrl,
} from '../utils/shoppingList';
import { formatCurrency } from '../utils/valuation';

export interface ShoppingListModalProps {
    opened: boolean;
    onClose: () => void;
    deck: DeckWithProgress | null;
    user?: { $id: string } | null;
    onQuickAdd?: (cardId: string, currentOwned: number) => void;
    onOpenSubstitutions?: (card: LorcanaCard) => void;
}

export function ShoppingListModal({
    opened,
    onClose,
    deck,
    user,
    onQuickAdd,
    onOpenSubstitutions,
}: ShoppingListModalProps) {
    const [copiedFormat, setCopiedFormat] = useState<
        'tcg' | 'md' | 'text' | null
    >(null);

    const missingCards = useMemo(() => {
        if (!deck) return [];
        return getMissingCards(deck);
    }, [deck]);

    const totalMissingCount = useMemo(() => {
        return missingCards.reduce((sum, item) => sum + item.missingQty, 0);
    }, [missingCards]);

    const totalEstimatedCost = useMemo(() => {
        return missingCards.reduce((sum, item) => {
            const unitPrice = item.card.prices?.usd ?? 0;
            return sum + unitPrice * item.missingQty;
        }, 0);
    }, [missingCards]);

    if (!deck) return null;

    const handleCopy = (format: 'tcg' | 'md' | 'text') => {
        let textToCopy = '';
        if (format === 'tcg') {
            textToCopy = formatTcgPlayerMassEntry(missingCards);
        } else if (format === 'md') {
            textToCopy = formatMarkdownShoppingList(deck.title, missingCards);
        } else {
            textToCopy = formatPlainTextShoppingList(deck.title, missingCards);
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedFormat(format);
            setTimeout(() => setCopiedFormat(null), 2500);
        });
    };

    const handleBuyOnTcgPlayer = () => {
        const textToCopy = formatTcgPlayerMassEntry(missingCards);
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedFormat('tcg');
            setTimeout(() => setCopiedFormat(null), 3500);
        });
        window.open(
            getTcgPlayerMassEntryUrl(),
            '_blank',
            'noopener,noreferrer',
        );
    };

    const isFullyOwned = missingCards.length === 0;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            zIndex={400}
            title={
                <Group
                    justify="space-between"
                    align="center"
                    style={{ width: '100%' }}
                >
                    <Group gap="sm" align="center">
                        <Box
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '10px',
                                background:
                                    'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconShoppingCart size={20} color="#c084fc" />
                        </Box>
                        <Box>
                            <Text
                                fw={900}
                                size="md"
                                style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    letterSpacing: '0.5px',
                                    background:
                                        'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Shopping List: {deck.title}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {isFullyOwned
                                    ? '100% Owned — Ready to sleeve up!'
                                    : `${totalMissingCount} card${totalMissingCount === 1 ? '' : 's'} needed (${missingCards.length} unique)`}
                            </Text>
                        </Box>
                    </Group>

                    <Group gap="xs" align="center">
                        {totalEstimatedCost > 0 && (
                            <Badge
                                size="sm"
                                variant="gradient"
                                gradient={{
                                    from: 'orange.6',
                                    to: 'yellow.6',
                                    deg: 90,
                                }}
                                radius="md"
                                style={{ fontWeight: 800 }}
                            >
                                Est. Missing Cost:{' '}
                                {formatCurrency(totalEstimatedCost)}
                            </Badge>
                        )}
                        <Badge
                            size="sm"
                            variant="light"
                            color={isFullyOwned ? 'teal' : 'violet'}
                            radius="md"
                        >
                            {deck.progress.ownedCount}/
                            {deck.progress.totalCount} Cards (
                            {deck.progress.percentage}%)
                        </Badge>
                    </Group>
                </Group>
            }
            size="1100px"
            centered
            radius="lg"
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #110d24 0%, #0c0919 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    boxShadow:
                        '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(168, 85, 247, 0.12)',
                },
                header: {
                    background: 'rgba(15, 11, 32, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px 22px',
                },
                title: {
                    flex: 1,
                    marginRight: 16,
                },
                body: {
                    padding: '20px 22px',
                },
            }}
        >
            <Stack gap="md">
                {isFullyOwned ? (
                    <Paper
                        p="xl"
                        radius="md"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            textAlign: 'center',
                        }}
                    >
                        <ThemeIcon
                            size={56}
                            radius="xl"
                            color="teal"
                            variant="light"
                            mx="auto"
                            mb="md"
                        >
                            <IconSparkles size={32} />
                        </ThemeIcon>
                        <Text fw={800} size="lg" c="teal.3">
                            You own all the cards for this deck!
                        </Text>
                        <Text size="sm" c="gray.4" mt="xs" maw={480} mx="auto">
                            Your collection matches 100% of this decklist (
                            {deck.progress.totalCount}/
                            {deck.progress.totalCount} cards). You are ready to
                            build and play!
                        </Text>
                    </Paper>
                ) : (
                    <>
                        {/* Action Bar for 1-Click Export & External Buy */}
                        <Paper
                            p="sm"
                            radius="md"
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <Group
                                justify="space-between"
                                wrap="wrap"
                                gap="xs"
                                align="center"
                            >
                                {/* Left: Export Formats Menu */}
                                <Menu
                                    shadow="md"
                                    width={220}
                                    position="bottom-start"
                                    radius="md"
                                    withinPortal={false}
                                >
                                    <Menu.Target>
                                        <Button
                                            variant="light"
                                            color="violet"
                                            size="xs"
                                            leftSection={
                                                copiedFormat ? (
                                                    <IconCheck
                                                        size={14}
                                                        color="#34d399"
                                                    />
                                                ) : (
                                                    <IconCopy size={14} />
                                                )
                                            }
                                            rightSection={
                                                <IconChevronDown size={12} />
                                            }
                                        >
                                            {copiedFormat === 'tcg'
                                                ? 'Copied TCG Format!'
                                                : copiedFormat === 'md'
                                                  ? 'Copied Markdown!'
                                                  : copiedFormat === 'text'
                                                    ? 'Copied Text!'
                                                    : 'Copy List'}
                                        </Button>
                                    </Menu.Target>

                                    <Menu.Dropdown
                                        style={{
                                            backgroundColor:
                                                'rgba(15, 23, 42, 0.95)',
                                            borderColor:
                                                'rgba(168, 85, 247, 0.25)',
                                            backdropFilter: 'blur(12px)',
                                        }}
                                    >
                                        <Menu.Label
                                            style={{
                                                color: '#a855f7',
                                                fontWeight: 700,
                                                fontSize: 10,
                                            }}
                                        >
                                            EXPORT FORMATS
                                        </Menu.Label>
                                        <Menu.Item
                                            leftSection={
                                                <IconCopy
                                                    size={14}
                                                    color="#c084fc"
                                                />
                                            }
                                            onClick={() => handleCopy('tcg')}
                                            style={{
                                                color: '#f8fafc',
                                                fontSize: 12,
                                            }}
                                        >
                                            TCGPlayer Mass Entry
                                        </Menu.Item>
                                        <Menu.Item
                                            leftSection={
                                                <IconFileText
                                                    size={14}
                                                    color="#60a5fa"
                                                />
                                            }
                                            onClick={() => handleCopy('md')}
                                            style={{
                                                color: '#f8fafc',
                                                fontSize: 12,
                                            }}
                                        >
                                            Markdown Checklist
                                        </Menu.Item>
                                        <Menu.Item
                                            leftSection={
                                                <IconCopy
                                                    size={14}
                                                    color="#94a3b8"
                                                />
                                            }
                                            onClick={() => handleCopy('text')}
                                            style={{
                                                color: '#f8fafc',
                                                fontSize: 12,
                                            }}
                                        >
                                            Plain Text Summary
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>

                                {/* Right: Vendor Launch Actions */}
                                <Group gap="xs" wrap="wrap">
                                    <Button
                                        onClick={handleBuyOnTcgPlayer}
                                        variant="gradient"
                                        gradient={{
                                            from: 'blue.6',
                                            to: 'cyan.6',
                                            deg: 90,
                                        }}
                                        size="xs"
                                        leftSection={
                                            <IconExternalLink size={14} />
                                        }
                                    >
                                        Buy on TCGPlayer
                                    </Button>

                                    <Button
                                        component="a"
                                        href={getCardmarketWantsUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="outline"
                                        color="blue"
                                        size="xs"
                                        leftSection={
                                            <IconExternalLink size={14} />
                                        }
                                    >
                                        Cardmarket
                                    </Button>
                                </Group>
                            </Group>

                            <Group gap={6} align="center" mt="xs" px={4}>
                                <Text size="11px" c="dimmed">
                                    💡 <strong>TCGPlayer Tip:</strong> Clicking
                                    &quot;Buy on TCGPlayer&quot; copies your
                                    missing cards to clipboard. In the Mass
                                    Entry page, select{' '}
                                    <em>&quot;Disney Lorcana&quot;</em> and
                                    paste your list.
                                </Text>
                            </Group>
                        </Paper>

                        {/* Missing Cards Visual Grid Gallery */}
                        <Box
                            p="sm"
                            style={{
                                background: 'rgba(10, 15, 29, 0.55)',
                                borderRadius: 12,
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                        >
                            <ScrollArea h={520} type="auto" offsetScrollbars>
                                <SimpleGrid
                                    cols={{
                                        base: 2,
                                        xs: 2,
                                        sm: 3,
                                        md: 4,
                                        lg: 5,
                                    }}
                                    spacing="md"
                                >
                                    {missingCards.map((item) => {
                                        const inkStyle = getInkBadgeStyle(
                                            item.card.ink_color || '',
                                        );
                                        return (
                                            <Card
                                                key={item.card.id}
                                                padding={10}
                                                radius="md"
                                                withBorder
                                                style={{
                                                    backgroundColor:
                                                        'rgba(18, 22, 34, 0.85)',
                                                    borderColor: `${inkStyle.color}40`,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent:
                                                        'space-between',
                                                    transition:
                                                        'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                                                }}
                                            >
                                                {/* Top: Card Image with floating "Need X" badge */}
                                                <Box
                                                    style={{
                                                        position: 'relative',
                                                        borderRadius: 6,
                                                        overflow: 'hidden',
                                                        backgroundColor:
                                                            'rgba(0, 0, 0, 0.3)',
                                                        aspectRatio: '5/7',
                                                    }}
                                                >
                                                    {item.card.image_url ? (
                                                        <img
                                                            src={
                                                                item.card
                                                                    .image_url
                                                            }
                                                            alt={item.card.name}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit:
                                                                    'cover',
                                                                display:
                                                                    'block',
                                                            }}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <Box
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                display: 'flex',
                                                                flexDirection:
                                                                    'column',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                padding: 8,
                                                            }}
                                                        >
                                                            <IconCards
                                                                size={24}
                                                                style={{
                                                                    opacity: 0.3,
                                                                    marginBottom: 4,
                                                                }}
                                                            />
                                                            <Text
                                                                size="xs"
                                                                fw={700}
                                                                ta="center"
                                                                c="gray.3"
                                                                lineClamp={2}
                                                            >
                                                                {item.card.name}
                                                            </Text>
                                                        </Box>
                                                    )}

                                                    {/* Floating Need X Badge */}
                                                    <Badge
                                                        size="sm"
                                                        color="red"
                                                        variant="filled"
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            top: 6,
                                                            right: 6,
                                                            fontWeight: 900,
                                                            boxShadow:
                                                                '0 2px 8px rgba(0, 0, 0, 0.75)',
                                                            pointerEvents:
                                                                'none',
                                                        }}
                                                    >
                                                        Need {item.missingQty}
                                                    </Badge>
                                                </Box>

                                                {/* Bottom: Card Name, Ownership, & Quick Actions */}
                                                <Stack
                                                    gap={6}
                                                    mt="xs"
                                                    justify="space-between"
                                                    style={{ flex: 1 }}
                                                >
                                                    <Box>
                                                        <Text
                                                            size="xs"
                                                            fw={700}
                                                            c="gray.2"
                                                            lh={1.3}
                                                            lineClamp={2}
                                                            style={{
                                                                minHeight:
                                                                    '2.4em',
                                                            }}
                                                        >
                                                            {item.card.name}
                                                        </Text>
                                                        {item.card.prices
                                                            ?.usd != null && (
                                                            <Group
                                                                gap={4}
                                                                mt={2}
                                                                align="center"
                                                            >
                                                                <Text
                                                                    size="10px"
                                                                    c="teal.3"
                                                                    fw={700}
                                                                >
                                                                    {formatCurrency(
                                                                        item
                                                                            .card
                                                                            .prices
                                                                            .usd,
                                                                    )}{' '}
                                                                    <span
                                                                        style={{
                                                                            color: '#64748b',
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        ea
                                                                    </span>
                                                                </Text>
                                                                {item.missingQty >
                                                                    1 && (
                                                                    <Text
                                                                        size="10px"
                                                                        c="orange.3"
                                                                        fw={600}
                                                                    >
                                                                        (
                                                                        {formatCurrency(
                                                                            item
                                                                                .card
                                                                                .prices
                                                                                .usd *
                                                                                item.missingQty,
                                                                        )}{' '}
                                                                        total)
                                                                    </Text>
                                                                )}
                                                            </Group>
                                                        )}
                                                    </Box>

                                                    <Group
                                                        justify="space-between"
                                                        align="center"
                                                        wrap="nowrap"
                                                    >
                                                        <Text
                                                            size="11px"
                                                            c="dimmed"
                                                        >
                                                            Own{' '}
                                                            <Text
                                                                component="span"
                                                                fw={700}
                                                                c={
                                                                    item.ownedQty >
                                                                    0
                                                                        ? 'teal.4'
                                                                        : 'gray.4'
                                                                }
                                                            >
                                                                {item.ownedQty}
                                                            </Text>
                                                            /{item.requiredQty}
                                                        </Text>

                                                        <Group
                                                            gap={4}
                                                            wrap="nowrap"
                                                        >
                                                            {onOpenSubstitutions && (
                                                                <Tooltip
                                                                    label={`Find budget substitutes for ${item.card.name}`}
                                                                    position="top"
                                                                >
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        variant="subtle"
                                                                        color="violet"
                                                                        aria-label={`Find substitutes for ${item.card.name}`}
                                                                        onClick={() =>
                                                                            onOpenSubstitutions(
                                                                                item.card,
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconArrowsExchange
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip
                                                                label={`Search "${item.card.name}" on TCGPlayer`}
                                                                position="top"
                                                            >
                                                                <ActionIcon
                                                                    component="a"
                                                                    href={getTcgPlayerCardSearchUrl(
                                                                        item
                                                                            .card
                                                                            .name,
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    size="xs"
                                                                    variant="subtle"
                                                                    color="blue"
                                                                >
                                                                    <IconSearch
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            </Tooltip>

                                                            {user &&
                                                                onQuickAdd && (
                                                                    <Tooltip
                                                                        label="Add 1 to collection"
                                                                        position="top"
                                                                    >
                                                                        <Button
                                                                            size="compact-xs"
                                                                            variant="light"
                                                                            color="violet"
                                                                            leftSection={
                                                                                <IconPlus
                                                                                    size={
                                                                                        11
                                                                                    }
                                                                                />
                                                                            }
                                                                            onClick={() =>
                                                                                onQuickAdd(
                                                                                    item
                                                                                        .card
                                                                                        .id,
                                                                                    item.ownedQty +
                                                                                        1,
                                                                                )
                                                                            }
                                                                            style={{
                                                                                paddingLeft: 4,
                                                                                paddingRight: 6,
                                                                                fontSize: 10,
                                                                            }}
                                                                        >
                                                                            +1
                                                                            Coll
                                                                        </Button>
                                                                    </Tooltip>
                                                                )}
                                                        </Group>
                                                    </Group>
                                                </Stack>
                                            </Card>
                                        );
                                    })}
                                </SimpleGrid>
                            </ScrollArea>
                        </Box>
                    </>
                )}
            </Stack>
        </Modal>
    );
}
