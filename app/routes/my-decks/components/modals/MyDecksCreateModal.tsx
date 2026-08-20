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
            title="Create Custom Deck"
            size="md"
            radius="lg"
            centered
        >
            <Stack gap="md">
                <TextInput
                    label="Deck Title"
                    placeholder="e.g. Amber / Ruby Aggro"
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

                <Textarea
                    label="Notes / Strategy Description"
                    placeholder="Optional deck guide or tournament notes..."
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
                        Save Deck
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
