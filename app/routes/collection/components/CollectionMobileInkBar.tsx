import { Group, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export interface InkDefinition {
    name: string;
    color: string;
}

export const INK_LIST: InkDefinition[] = [
    { name: 'Amber', color: '#F5B041' },
    { name: 'Amethyst', color: '#AF7AC5' },
    { name: 'Emerald', color: '#2ECC71' },
    { name: 'Ruby', color: '#EC7063' },
    { name: 'Sapphire', color: '#5DADE2' },
    { name: 'Steel', color: '#A6ACAF' },
];

export interface CollectionMobileInkBarProps {
    selectedInks: string[];
    setSelectedInks: React.Dispatch<React.SetStateAction<string[]>>;
    maxInks?: number;
    className?: string;
    size?: 'sm' | 'md';
}

export function CollectionMobileInkBar({
    selectedInks,
    setSelectedInks,
    maxInks = 3,
    className,
    size = 'sm',
}: CollectionMobileInkBarProps) {
    const isCompact = size === 'sm';
    const circleSize = isCompact ? 40 : 44;
    const iconSize = isCompact ? 25 : 28;

    const handleInkClick = (inkName: string) => {
        const isSelected = selectedInks.includes(inkName);
        if (isSelected) {
            setSelectedInks((prev) => prev.filter((name) => name !== inkName));
        } else if (selectedInks.length < maxInks) {
            setSelectedInks((prev) => [...prev, inkName]);
        }
    };

    return (
        <Group
            justify="space-between"
            align="center"
            gap={6}
            wrap="nowrap"
            className={className}
            style={{
                width: '100%',
                padding: '2px 0',
            }}
        >
            <Group
                justify="space-between"
                align="center"
                style={{ flex: 1, width: '100%' }}
                wrap="nowrap"
            >
                {INK_LIST.map((ink) => {
                    const isSelected = selectedInks.includes(ink.name);
                    const isDimmed = selectedInks.length > 0 && !isSelected;
                    const isMaxReached =
                        selectedInks.length >= maxInks && !isSelected;

                    return (
                        <Tooltip
                            key={ink.name}
                            label={`${ink.name}${isSelected ? ' (Selected)' : ''}`}
                            withArrow
                            position="top"
                        >
                            <Box
                                role="button"
                                tabIndex={0}
                                aria-label={`Filter by ${ink.name} ink`}
                                aria-pressed={isSelected}
                                onClick={() => handleInkClick(ink.name)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleInkClick(ink.name);
                                    }
                                }}
                                style={{
                                    cursor: isMaxReached
                                        ? 'not-allowed'
                                        : 'pointer',
                                    opacity: isDimmed ? 0.35 : 1,
                                    filter: isDimmed
                                        ? 'grayscale(80%)'
                                        : 'none',
                                    transform: isSelected
                                        ? 'scale(1.12)'
                                        : 'scale(1)',
                                    transition:
                                        'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderRadius: '50%',
                                    padding: 2,
                                    border: isSelected
                                        ? `2px solid ${ink.color}`
                                        : '2px solid transparent',
                                    backgroundColor: isSelected
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(255, 255, 255, 0.02)',
                                    boxShadow: isSelected
                                        ? `0 0 10px ${ink.color}66, inset 0 0 6px ${ink.color}44`
                                        : 'none',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: circleSize,
                                    height: circleSize,
                                    flexShrink: 0,
                                    outline: 'none',
                                }}
                            >
                                <img
                                    src={`/inks/${ink.name.toLowerCase()}.svg`}
                                    alt={ink.name}
                                    style={{
                                        width: iconSize,
                                        height: iconSize,
                                        display: 'block',
                                        pointerEvents: 'none',
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    );
                })}
            </Group>

            {selectedInks.length > 0 && (
                <ActionIcon
                    size="sm"
                    radius="xl"
                    variant="subtle"
                    color="violet"
                    onClick={() => setSelectedInks([])}
                    title="Clear ink filters"
                    aria-label="Clear ink filters"
                    style={{
                        flexShrink: 0,
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    }}
                >
                    <IconX size={14} />
                </ActionIcon>
            )}
        </Group>
    );
}
