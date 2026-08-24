import { useState } from 'react';
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
    Alert,
} from '@mantine/core';
import {
    IconLayersIntersect,
    IconCheck,
    IconCopy,
    IconExternalLink,
    IconPlus,
    IconSparkles,
    IconAlertTriangle,
    IconPrinter,
    IconCards,
    IconSearch,
    IconInfoCircle,
} from '@tabler/icons-react';
import type { DeckWithProgress } from '../../../../types/lorcana';
import {
    type DeckAuditResult,
    formatTcgPlayerPhysicalShoppingList,
    formatProxyPrintList,
} from '../../../../utils/deckAudit';
import { getInkBadgeStyle } from '../../../decks/utils/deckHelpers';
import {
    getTcgPlayerCardSearchUrl,
    getTcgPlayerMassEntryUrl,
} from '../../../../utils/shoppingList';

export interface PhysicalDeckAuditModalProps {
    opened: boolean;
    onClose: () => void;
    auditResult: DeckAuditResult;
    activeDecks: DeckWithProgress[];
    user?: { $id: string } | null;
    onQuickAdd?: (cardId: string, currentOwned: number) => void;
}

export function PhysicalDeckAuditModal({
    opened,
    onClose,
    auditResult,
    activeDecks,
    user,
    onQuickAdd,
}: PhysicalDeckAuditModalProps) {
    const [copiedFormat, setCopiedFormat] = useState<'tcg' | 'proxy' | null>(
        null,
    );

    const handleCopyTcgShoppingList = () => {
        const text = formatTcgPlayerPhysicalShoppingList(auditResult.conflicts);
        navigator.clipboard.writeText(text).then(() => {
            setCopiedFormat('tcg');
            setTimeout(() => setCopiedFormat(null), 2500);
        });
    };

    const handleCopyProxyList = () => {
        const text = formatProxyPrintList(auditResult.conflicts, activeDecks);
        navigator.clipboard.writeText(text).then(() => {
            setCopiedFormat('proxy');
            setTimeout(() => setCopiedFormat(null), 2500);
        });
    };

    const handleLaunchTcgPlayerMassEntry = () => {
        handleCopyTcgShoppingList();
        window.open(
            getTcgPlayerMassEntryUrl(),
            '_blank',
            'noopener,noreferrer',
        );
    };

    const hasActiveDecks = activeDecks.length > 0;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
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
                                    'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(168, 85, 247, 0.25) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconLayersIntersect size={20} color="#60a5fa" />
                        </Box>
                        <Box>
                            <Text
                                fw={900}
                                size="md"
                                style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    letterSpacing: '0.5px',
                                    background:
                                        'linear-gradient(to right, #ffffff, #93c5fd, #c084fc)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Physical Deck Audit
                            </Text>
                            <Text size="xs" c="dimmed">
                                Multi-Deck Physical Collection Conflict Detector
                            </Text>
                        </Box>
                    </Group>

                    <Badge size="sm" variant="light" color="blue" radius="md">
                        {auditResult.activeDecksCount}{' '}
                        {auditResult.activeDecksCount === 1
                            ? 'Active Deck'
                            : 'Active Decks'}
                    </Badge>
                </Group>
            }
            size="1100px"
            centered
            radius="lg"
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #0d1326 0%, #080c19 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    boxShadow:
                        '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(59, 130, 246, 0.12)',
                },
                header: {
                    background: 'rgba(11, 16, 32, 0.95)',
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
                {/* Case 1: No Active Decks Selected */}
                {!hasActiveDecks ? (
                    <Paper
                        p="xl"
                        radius="md"
                        style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            textAlign: 'center',
                        }}
                    >
                        <ThemeIcon
                            size={56}
                            radius="xl"
                            color="blue"
                            variant="light"
                            mx="auto"
                            mb="md"
                        >
                            <IconInfoCircle size={32} />
                        </ThemeIcon>
                        <Text fw={800} size="lg" c="blue.3">
                            No Decks Marked as &quot;Physically Built&quot;
                        </Text>
                        <Text size="sm" c="gray.4" mt="xs" maw={520} mx="auto">
                            To run a multi-deck physical collection audit, mark
                            2 or more of your decks as{' '}
                            <strong>&quot;Physically Built&quot;</strong> using
                            the badge toggle on any deck card in My Decks.
                        </Text>
                    </Paper>
                ) : auditResult.is100PercentBuildable ? (
                    /* Case 2: 100% Physically Buildable */
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
                            100% Physically Buildable!
                        </Text>
                        <Text size="sm" c="gray.4" mt="xs" maw={540} mx="auto">
                            All {auditResult.activeDecksCount} active decks (
                            {auditResult.totalActiveCardsCount} cards total) can
                            be sleeved and built simultaneously from your
                            collection without any card conflicts!
                        </Text>
                    </Paper>
                ) : (
                    /* Case 3: Physical Conflicts Detected */
                    <>
                        {/* Overall Status Banner */}
                        <Alert
                            icon={<IconAlertTriangle size={20} />}
                            color="amber"
                            variant="light"
                            title={
                                <Group justify="space-between" align="center">
                                    <Text fw={800} size="sm">
                                        {auditResult.totalConflictCardsCount}{' '}
                                        Card Conflicts Across{' '}
                                        {auditResult.activeDecksCount} Active
                                        Decks
                                    </Text>
                                    <Badge
                                        color="amber"
                                        variant="filled"
                                        size="sm"
                                    >
                                        Short {auditResult.totalDeficitCount}{' '}
                                        total copies
                                    </Badge>
                                </Group>
                            }
                            styles={{
                                root: {
                                    backgroundColor: 'rgba(217, 119, 6, 0.12)',
                                    borderColor: 'rgba(245, 158, 11, 0.3)',
                                },
                            }}
                        >
                            <Text size="xs" c="gray.3" mt={4}>
                                You require more total physical copies across
                                your active decks than you currently own in your
                                inventory (standard + foil combined).
                            </Text>
                        </Alert>

                        {/* 1-Click Actions Bar */}
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
                                <Group gap="xs" wrap="wrap">
                                    <Button
                                        variant="light"
                                        color="violet"
                                        size="xs"
                                        leftSection={
                                            copiedFormat === 'tcg' ? (
                                                <IconCheck
                                                    size={14}
                                                    color="#34d399"
                                                />
                                            ) : (
                                                <IconCopy size={14} />
                                            )
                                        }
                                        onClick={handleCopyTcgShoppingList}
                                    >
                                        {copiedFormat === 'tcg'
                                            ? 'Copied Shopping List!'
                                            : 'Copy Missing Physical Cards'}
                                    </Button>

                                    <Button
                                        variant="light"
                                        color="indigo"
                                        size="xs"
                                        leftSection={
                                            copiedFormat === 'proxy' ? (
                                                <IconCheck
                                                    size={14}
                                                    color="#34d399"
                                                />
                                            ) : (
                                                <IconPrinter size={14} />
                                            )
                                        }
                                        onClick={handleCopyProxyList}
                                    >
                                        {copiedFormat === 'proxy'
                                            ? 'Copied Proxy List!'
                                            : 'Copy Proxy Print List'}
                                    </Button>
                                </Group>

                                <Button
                                    onClick={handleLaunchTcgPlayerMassEntry}
                                    variant="gradient"
                                    gradient={{
                                        from: 'blue.6',
                                        to: 'cyan.6',
                                        deg: 90,
                                    }}
                                    size="xs"
                                    leftSection={<IconExternalLink size={14} />}
                                >
                                    Buy Missing on TCGPlayer
                                </Button>
                            </Group>
                        </Paper>

                        {/* Conflict Cards Grid */}
                        <Box
                            p="sm"
                            style={{
                                background: 'rgba(10, 15, 29, 0.55)',
                                borderRadius: 12,
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                        >
                            <ScrollArea h={500} type="auto" offsetScrollbars>
                                <SimpleGrid
                                    cols={{
                                        base: 1,
                                        xs: 2,
                                        sm: 3,
                                        md: 4,
                                        lg: 4,
                                    }}
                                    spacing="md"
                                >
                                    {auditResult.conflicts.map((item) => {
                                        const inkStyle = getInkBadgeStyle(
                                            item.card.ink_color || '',
                                        );
                                        return (
                                            <Card
                                                key={
                                                    item.card.id ||
                                                    item.card.$id
                                                }
                                                padding={10}
                                                radius="md"
                                                withBorder
                                                style={{
                                                    backgroundColor:
                                                        'rgba(18, 22, 34, 0.85)',
                                                    borderColor: `${inkStyle.color}40`,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justify: 'space-between',
                                                }}
                                            >
                                                {/* Top Image with floating Deficit Badge */}
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
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                            }}
                                                        >
                                                            <IconCards
                                                                size={32}
                                                                opacity={0.3}
                                                            />
                                                        </Box>
                                                    )}

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
                                                        }}
                                                    >
                                                        Short {item.deficit}
                                                    </Badge>
                                                </Box>

                                                {/* Card Details & Active Decks Breakdown */}
                                                <Stack
                                                    gap={6}
                                                    mt="xs"
                                                    style={{ flex: 1 }}
                                                >
                                                    <Text
                                                        size="xs"
                                                        fw={700}
                                                        c="gray.2"
                                                        lineClamp={1}
                                                    >
                                                        {item.card.name}
                                                    </Text>

                                                    {/* Decks needing this card */}
                                                    <Box>
                                                        <Text
                                                            size="10px"
                                                            c="dimmed"
                                                            fw={600}
                                                            mb={2}
                                                        >
                                                            Active Decks
                                                            Needing:
                                                        </Text>
                                                        <Group
                                                            gap={4}
                                                            wrap="wrap"
                                                        >
                                                            {item.decks.map(
                                                                (d) => (
                                                                    <Badge
                                                                        key={
                                                                            d.deckId
                                                                        }
                                                                        size="xs"
                                                                        variant="light"
                                                                        color="indigo"
                                                                        style={{
                                                                            fontSize:
                                                                                '9px',
                                                                        }}
                                                                    >
                                                                        {d.deckTitle.slice(
                                                                            0,
                                                                            14,
                                                                        )}{' '}
                                                                        (
                                                                        {
                                                                            d.requiredQty
                                                                        }
                                                                        ×)
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </Group>
                                                    </Box>

                                                    {/* Ownership Summary */}
                                                    <Group
                                                        justify="space-between"
                                                        align="center"
                                                        mt="auto"
                                                        pt={4}
                                                    >
                                                        <Text
                                                            size="11px"
                                                            c="dimmed"
                                                        >
                                                            Needed:{' '}
                                                            <strong>
                                                                {
                                                                    item.totalRequired
                                                                }
                                                            </strong>{' '}
                                                            | Owned:{' '}
                                                            <Text
                                                                component="span"
                                                                fw={700}
                                                                c={
                                                                    item.totalOwned >
                                                                    0
                                                                        ? 'yellow.4'
                                                                        : 'red.4'
                                                                }
                                                            >
                                                                {
                                                                    item.totalOwned
                                                                }
                                                            </Text>
                                                        </Text>

                                                        <Group gap={4}>
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
                                                                        <ActionIcon
                                                                            size="xs"
                                                                            variant="light"
                                                                            color="violet"
                                                                            onClick={() =>
                                                                                onQuickAdd(
                                                                                    item
                                                                                        .card
                                                                                        .id ||
                                                                                        item
                                                                                            .card
                                                                                            .$id,
                                                                                    item.totalOwned,
                                                                                )
                                                                            }
                                                                        >
                                                                            <IconPlus
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />
                                                                        </ActionIcon>
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
