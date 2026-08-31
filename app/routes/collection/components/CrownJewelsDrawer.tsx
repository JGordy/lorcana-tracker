import {
    Modal,
    Stack,
    Group,
    Box,
    Text,
    Badge,
    SimpleGrid,
    Card,
    Button,
    ScrollArea,
} from '@mantine/core';
import {
    IconDiamond,
    IconSparkles,
    IconExternalLink,
    IconCards,
} from '@tabler/icons-react';
import type { TopGemItem } from '../../../utils/valuation';
import { formatCurrency } from '../../../utils/valuation';
import { getInkBadgeStyle } from '../utils/collectionHelpers';
import { getTcgPlayerCardSearchUrl } from '../../../utils/shoppingList';

export interface CrownJewelsDrawerProps {
    opened: boolean;
    onClose: () => void;
    topGems: TopGemItem[];
    totalCollectionValue: number;
}

export function CrownJewelsDrawer({
    opened,
    onClose,
    topGems,
    totalCollectionValue,
}: CrownJewelsDrawerProps) {
    const totalGemsValue = topGems.reduce((sum, g) => sum + g.totalValue, 0);
    const gemsPercent =
        totalCollectionValue > 0
            ? Math.min(
                  100,
                  Math.round((totalGemsValue / totalCollectionValue) * 100),
              )
            : 0;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            zIndex={300}
            size="960px"
            centered
            radius="lg"
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #16122e 0%, #0d0a1a 100%)',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    boxShadow:
                        '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 45px rgba(234, 179, 8, 0.15)',
                },
                header: {
                    background: 'rgba(18, 14, 38, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px 22px',
                },
                body: {
                    padding: '20px 22px',
                },
            }}
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
                                    'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                border: '1px solid rgba(234, 179, 8, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconDiamond size={22} color="#fbbf24" />
                        </Box>
                        <Box>
                            <Text
                                fw={900}
                                size="md"
                                style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    letterSpacing: '0.5px',
                                    background:
                                        'linear-gradient(to right, #fef08a, #f59e0b, #fbbf24)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Crown Jewels • Top Value Gems
                            </Text>
                            <Text size="xs" c="dimmed">
                                Your most valuable owned Lorcana cards based on
                                live market pricing.
                            </Text>
                        </Box>
                    </Group>

                    <Badge
                        size="md"
                        variant="gradient"
                        gradient={{ from: 'yellow.6', to: 'amber.7', deg: 90 }}
                        radius="sm"
                        style={{ fontWeight: 800 }}
                    >
                        Top Value: {formatCurrency(totalGemsValue)} (
                        {gemsPercent}% of Coll.)
                    </Badge>
                </Group>
            }
        >
            <Stack gap="md">
                {topGems.length === 0 ? (
                    <Box p="xl" style={{ textAlign: 'center' }}>
                        <IconDiamond
                            size={48}
                            color="#fbbf24"
                            style={{ opacity: 0.3, margin: '0 auto 12px' }}
                        />
                        <Text fw={700} size="md" c="gray.3">
                            No Valued Cards Found Yet
                        </Text>
                        <Text size="xs" c="dimmed" mt={4} maw={400} mx="auto">
                            Add cards to your collection to automatically rank
                            and track your most valuable treasures here.
                        </Text>
                    </Box>
                ) : (
                    <ScrollArea h={520} type="auto" offsetScrollbars>
                        <SimpleGrid
                            cols={{ base: 1, sm: 2, md: 3, lg: 5 }}
                            spacing="md"
                        >
                            {topGems.map((gem, index) => {
                                const inkStyle = getInkBadgeStyle(
                                    gem.card.ink_color || '',
                                );
                                const tcgUrl =
                                    gem.card.tcgplayer_url ||
                                    getTcgPlayerCardSearchUrl(gem.card.name);

                                return (
                                    <Card
                                        key={`${gem.card.id}_${gem.isFoil ? 'foil' : 'normal'}_${index}`}
                                        padding={10}
                                        radius="md"
                                        withBorder
                                        style={{
                                            backgroundColor:
                                                'rgba(18, 22, 34, 0.85)',
                                            borderColor: gem.isFoil
                                                ? 'rgba(236, 72, 153, 0.45)'
                                                : `${inkStyle.color}40`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            position: 'relative',
                                            boxShadow: gem.isFoil
                                                ? '0 4px 16px rgba(236, 72, 153, 0.15)'
                                                : undefined,
                                        }}
                                    >
                                        {/* Rank Badge */}
                                        <Badge
                                            size="xs"
                                            variant="filled"
                                            color="yellow.8"
                                            style={{
                                                position: 'absolute',
                                                top: 6,
                                                left: 6,
                                                zIndex: 10,
                                                fontWeight: 900,
                                                boxShadow:
                                                    '0 2px 8px rgba(0,0,0,0.8)',
                                            }}
                                        >
                                            #{index + 1}
                                        </Badge>

                                        {/* Card Image */}
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
                                            {gem.card.image_url ? (
                                                <img
                                                    src={gem.card.image_url}
                                                    alt={gem.card.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                    }}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <Box
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
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
                                                        {gem.card.name}
                                                    </Text>
                                                </Box>
                                            )}

                                            {/* Foil indicator */}
                                            {gem.isFoil && (
                                                <Badge
                                                    size="xs"
                                                    variant="gradient"
                                                    gradient={{
                                                        from: 'pink.6',
                                                        to: 'purple.6',
                                                        deg: 90,
                                                    }}
                                                    leftSection={
                                                        <IconSparkles
                                                            size={10}
                                                        />
                                                    }
                                                    style={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        fontWeight: 800,
                                                        boxShadow:
                                                            '0 2px 8px rgba(0, 0, 0, 0.75)',
                                                    }}
                                                >
                                                    FOIL
                                                </Badge>
                                            )}
                                        </Box>

                                        {/* Card Info & Valuation Breakdown */}
                                        <Stack
                                            gap={6}
                                            mt="xs"
                                            justify="space-between"
                                            style={{ flex: 1 }}
                                        >
                                            <Box>
                                                <Text
                                                    size="xs"
                                                    fw={800}
                                                    c="gray.1"
                                                    lineClamp={1}
                                                    title={gem.card.name}
                                                >
                                                    {gem.card.name}
                                                </Text>
                                                <Text size="10px" c="dimmed">
                                                    {gem.card.set}
                                                </Text>
                                            </Box>

                                            <Box
                                                p={6}
                                                style={{
                                                    backgroundColor:
                                                        'rgba(15, 23, 42, 0.7)',
                                                    borderRadius: 6,
                                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                                }}
                                            >
                                                <Group
                                                    justify="space-between"
                                                    align="center"
                                                >
                                                    <Text
                                                        size="10px"
                                                        c="gray.4"
                                                        fw={600}
                                                    >
                                                        Rate:
                                                    </Text>
                                                    <Text
                                                        size="xs"
                                                        fw={800}
                                                        c="teal.3"
                                                    >
                                                        {formatCurrency(
                                                            gem.unitPrice,
                                                        )}
                                                    </Text>
                                                </Group>
                                                <Group
                                                    justify="space-between"
                                                    align="center"
                                                    mt={2}
                                                >
                                                    <Text
                                                        size="10px"
                                                        c="gray.4"
                                                        fw={600}
                                                    >
                                                        Owned ({gem.quantity}x):
                                                    </Text>
                                                    <Text
                                                        size="xs"
                                                        fw={900}
                                                        c="yellow.4"
                                                    >
                                                        {formatCurrency(
                                                            gem.totalValue,
                                                        )}
                                                    </Text>
                                                </Group>
                                            </Box>

                                            <Button
                                                component="a"
                                                href={tcgUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="compact-xs"
                                                variant="light"
                                                color="blue"
                                                rightSection={
                                                    <IconExternalLink
                                                        size={11}
                                                    />
                                                }
                                                fullWidth
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                TCGPlayer
                                            </Button>
                                        </Stack>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    </ScrollArea>
                )}
            </Stack>
        </Modal>
    );
}
