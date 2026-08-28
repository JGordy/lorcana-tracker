import {
    Modal,
    Stack,
    TextInput,
    Textarea,
    Select,
    Text,
    Group,
    UnstyledButton,
    Button,
    Box,
    Badge,
    SimpleGrid,
} from '@mantine/core';
import { IconSparkles, IconCheck } from '@tabler/icons-react';
import { ALL_INKS } from '../../../../types/lorcana';
import { DECK_FORMAT_OPTIONS } from '../../../../constants/lorcana';

interface MyDecksCreateModalProps {
    opened: boolean;
    onClose: () => void;
    title: string;
    onTitleChange: (val: string) => void;
    format: 'core' | 'infinity';
    onFormatChange: (val: 'core' | 'infinity') => void;
    inks: string[];
    onInksChange: (inks: string[]) => void;
    description: string;
    onDescriptionChange: (val: string) => void;
    onSave: () => void;
}

export function MyDecksCreateModal({
    opened,
    onClose,
    title,
    onTitleChange,
    format,
    onFormatChange,
    inks,
    onInksChange,
    description,
    onDescriptionChange,
    onSave,
}: MyDecksCreateModalProps) {
    const handleToggleInk = (inkId: string) => {
        if (inks.includes(inkId)) {
            onInksChange(inks.filter((i) => i !== inkId));
        } else {
            if (inks.length >= 2) return;
            onInksChange([...inks, inkId]);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="md"
            radius="lg"
            centered
            title={
                <Group gap="sm" align="center">
                    <Box
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: '10px',
                            background:
                                'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <IconSparkles size={20} color="#c084fc" />
                    </Box>
                    <Box>
                        <Text
                            fw={900}
                            size="lg"
                            style={{
                                fontFamily:
                                    "'Cinzel Decorative', Georgia, serif",
                                letterSpacing: '0.5px',
                                background:
                                    'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Create Custom Deck
                        </Text>
                        <Text size="xs" c="dimmed">
                            Design your deck format, ink colors, and strategy
                        </Text>
                    </Box>
                </Group>
            }
            styles={{
                content: {
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '16px',
                    boxShadow:
                        '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(168, 85, 247, 0.15)',
                },
                header: {
                    backgroundColor: '#0f172a',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                    paddingBottom: '14px',
                },
            }}
        >
            <Stack gap="md" mt="xs">
                <TextInput
                    label="Deck Title"
                    placeholder="e.g. Amber / Ruby Aggro"
                    value={title}
                    onChange={(e) => onTitleChange(e.currentTarget.value)}
                    required
                    data-autofocus
                    autoFocus
                    styles={{
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.7)',
                            borderColor: 'rgba(148, 163, 184, 0.2)',
                            color: '#f8fafc',
                        },
                        label: {
                            color: '#cbd5e1',
                            fontWeight: 600,
                            fontSize: '13px',
                        },
                    }}
                />

                <Select
                    label="Format Legality"
                    value={format}
                    onChange={(val) =>
                        onFormatChange((val as 'core' | 'infinity') || 'core')
                    }
                    data={DECK_FORMAT_OPTIONS as any}
                    styles={{
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.7)',
                            borderColor: 'rgba(148, 163, 184, 0.2)',
                            color: '#f8fafc',
                        },
                        label: {
                            color: '#cbd5e1',
                            fontWeight: 600,
                            fontSize: '13px',
                        },
                        dropdown: {
                            backgroundColor: '#0f172a',
                            borderColor: 'rgba(168, 85, 247, 0.3)',
                        },
                    }}
                />

                <div>
                    <Group justify="space-between" align="center" mb={8}>
                        <Text
                            size="xs"
                            fw={700}
                            c="gray.3"
                            style={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Ink Colors (Select 1 or 2)
                        </Text>
                        <Badge
                            size="xs"
                            variant="dot"
                            color={inks.length > 0 ? 'violet' : 'gray'}
                        >
                            {inks.length} / 2 Selected
                        </Badge>
                    </Group>

                    <SimpleGrid cols={3} spacing="xs">
                        {ALL_INKS.map((ink) => {
                            const isSelected = inks.includes(ink.id);
                            const isDisabled = !isSelected && inks.length >= 2;
                            return (
                                <UnstyledButton
                                    key={ink.id}
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    aria-label={ink.name}
                                    aria-disabled={isDisabled}
                                    disabled={isDisabled}
                                    onClick={() => handleToggleInk(ink.id)}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '10px 6px',
                                        borderRadius: '12px',
                                        border: `1.5px solid ${
                                            isSelected
                                                ? ink.hex
                                                : 'rgba(148, 163, 184, 0.15)'
                                        }`,
                                        background: isSelected
                                            ? `linear-gradient(135deg, ${ink.hex}30 0%, ${ink.hex}10 100%)`
                                            : 'rgba(30, 41, 59, 0.4)',
                                        cursor: isDisabled
                                            ? 'not-allowed'
                                            : 'pointer',
                                        opacity: isDisabled ? 0.35 : 1,
                                        boxShadow: isSelected
                                            ? `0 0 14px ${ink.hex}35, inset 0 0 10px ${ink.hex}15`
                                            : 'none',
                                        transition:
                                            'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    {isSelected && (
                                        <Box
                                            style={{
                                                position: 'absolute',
                                                top: 5,
                                                right: 5,
                                                width: 15,
                                                height: 15,
                                                borderRadius: '50%',
                                                backgroundColor: ink.hex,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconCheck
                                                size={10}
                                                color="#000000"
                                                stroke={3.5}
                                            />
                                        </Box>
                                    )}
                                    <img
                                        src={`/inks/${ink.id}.svg`}
                                        alt={`${ink.name} Ink`}
                                        style={{
                                            width: 26,
                                            height: 26,
                                            filter: isSelected
                                                ? `drop-shadow(0 0 6px ${ink.hex})`
                                                : 'grayscale(40%) opacity(0.8)',
                                            marginBottom: 4,
                                        }}
                                    />
                                    <Text
                                        size="xs"
                                        fw={isSelected ? 800 : 600}
                                        style={{
                                            color: isSelected
                                                ? '#ffffff'
                                                : '#94a3b8',
                                            letterSpacing: '0.3px',
                                        }}
                                    >
                                        {ink.name}
                                    </Text>
                                </UnstyledButton>
                            );
                        })}
                    </SimpleGrid>
                </div>

                <Textarea
                    label="Notes / Strategy Description"
                    placeholder="Optional deck guide or tournament notes..."
                    value={description}
                    onChange={(e) => onDescriptionChange(e.currentTarget.value)}
                    rows={3}
                    styles={{
                        input: {
                            backgroundColor: 'rgba(15, 23, 42, 0.7)',
                            borderColor: 'rgba(148, 163, 184, 0.2)',
                            color: '#f8fafc',
                        },
                        label: {
                            color: '#cbd5e1',
                            fontWeight: 600,
                            fontSize: '13px',
                        },
                    }}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet.6', to: 'indigo.6' }}
                        disabled={!title.trim() || inks.length === 0}
                        onClick={onSave}
                        style={{
                            boxShadow:
                                !title.trim() || inks.length === 0
                                    ? 'none'
                                    : '0 0 16px rgba(139, 92, 246, 0.4)',
                        }}
                    >
                        Save Deck
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
