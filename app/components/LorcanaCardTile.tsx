import { Card, Box, Text } from '@mantine/core';
import { IconCards } from '@tabler/icons-react';
import type { Card as LorcanaCard } from '../types/lorcana';
import { ShinyCardImage } from '../routes/collection/components/ShinyCardImage';

export interface LorcanaCardTileProps {
    card: LorcanaCard;
    badgeColor?: string;
    aspectRatio?: string;
    useShinyImage?: boolean;
    headerOverlay?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function LorcanaCardTile({
    card,
    badgeColor,
    aspectRatio = '5/7',
    useShinyImage = false,
    headerOverlay,
    children,
    className = '',
    style,
    onClick,
}: LorcanaCardTileProps) {
    const isEnchanted = card.rarity === 'Enchanted';
    const isEpic = card.rarity === 'Epic';
    const isIconic = card.rarity === 'Iconic';

    const glowClass = isEnchanted
        ? ' shiny-enchanted-glow'
        : isEpic
          ? ' shiny-epic-glow'
          : isIconic
            ? ' shiny-iconic-glow'
            : '';

    const defaultBorderColor = badgeColor
        ? `${badgeColor}45`
        : 'rgba(168, 85, 247, 0.25)';
    const defaultBgGradient = badgeColor
        ? `linear-gradient(180deg, rgba(37,38,43,0.98) 55%, ${badgeColor}1E 100%)`
        : 'linear-gradient(180deg, rgba(18, 22, 34, 0.85) 0%, rgba(15, 23, 42, 0.75) 100%)';

    return (
        <Card
            key={card.id || card.$id}
            className={`lorcana-card${glowClass}${className ? ` ${className}` : ''}`}
            padding={0}
            radius="md"
            withBorder
            onClick={onClick}
            style={
                {
                    backgroundColor: 'var(--mantine-color-dark-8)',
                    backgroundImage: defaultBgGradient,
                    borderColor: defaultBorderColor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    transition:
                        'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                    cursor: onClick ? 'pointer' : undefined,
                    '--hover-color': badgeColor || '#a855f7',
                    '--hover-shadow-color': badgeColor
                        ? `0 8px 24px ${badgeColor}40`
                        : '0 8px 24px rgba(168, 85, 247, 0.3)',
                    ...style,
                } as React.CSSProperties
            }
        >
            {/* Edge-to-Edge Top Card Artwork Section */}
            <Card.Section
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    aspectRatio,
                }}
            >
                {card.image_url ? (
                    useShinyImage ? (
                        <ShinyCardImage card={card} />
                    ) : (
                        <img
                            src={card.image_url}
                            alt={card.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                            loading="lazy"
                        />
                    )
                ) : (
                    <Box
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        }}
                    >
                        <IconCards
                            size={28}
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
                            {card.name}
                        </Text>
                    </Box>
                )}

                {/* Floating Header Overlay (Badges, tags, or extra controls) */}
                {headerOverlay}
            </Card.Section>

            {/* Bottom Footer Content */}
            {children}
        </Card>
    );
}
