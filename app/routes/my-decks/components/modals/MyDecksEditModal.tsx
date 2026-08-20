import {
    Modal,
    Stack,
    TextInput,
    Textarea,
    Select,
    Text,
    Group,
    Checkbox,
    Button,
} from '@mantine/core';
import { ALL_INKS } from '../../../../types/lorcana';

interface MyDecksEditModalProps {
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
    coverCardId: string;
    onCoverCardIdChange: (val: string) => void;
    deckCards: any[];
    onSave: () => void;
}

export function MyDecksEditModal({
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
    coverCardId,
    onCoverCardIdChange,
    deckCards,
    onSave,
}: MyDecksEditModalProps) {
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
            title="Edit Deck Info"
            size="md"
            radius="lg"
            centered
        >
            <Stack gap="md">
                <TextInput
                    label="Deck Title"
                    value={title}
                    onChange={(e) => onTitleChange(e.currentTarget.value)}
                    required
                />

                <Select
                    label="Format Legality"
                    value={format}
                    onChange={(val) =>
                        onFormatChange((val as 'core' | 'infinity') || 'core')
                    }
                    data={[
                        {
                            value: 'core',
                            label: 'Core Legal (Sets 1–6 Standard)',
                        },
                        {
                            value: 'infinity',
                            label: 'Infinity (All Sets & Promos)',
                        },
                    ]}
                />

                <div>
                    <Text size="sm" fw={500} mb={6}>
                        Ink Colors (Select 1 or 2)
                    </Text>
                    <Group gap="xs">
                        {ALL_INKS.map((ink) => {
                            const isSelected = inks.includes(ink.id);
                            return (
                                <Checkbox
                                    key={ink.id}
                                    label={ink.name}
                                    checked={isSelected}
                                    onChange={() => handleToggleInk(ink.id)}
                                    disabled={!isSelected && inks.length >= 2}
                                />
                            );
                        })}
                    </Group>
                </div>

                <Select
                    label="Cover Card Image"
                    value={coverCardId}
                    onChange={(val) => onCoverCardIdChange(val || 'auto')}
                    data={[
                        {
                            value: 'auto',
                            label: 'Auto (First Legendary/Super Rare)',
                        },
                        ...deckCards.map(({ card }) => ({
                            value: card.id || card.$id,
                            label: `${card.name} (${card.set || ''})`,
                        })),
                    ]}
                />

                <Textarea
                    label="Notes / Strategy Description"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.currentTarget.value)}
                    rows={3}
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
                    >
                        Save Changes
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
