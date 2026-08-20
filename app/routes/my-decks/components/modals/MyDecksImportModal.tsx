import {
    Modal,
    Stack,
    TextInput,
    Textarea,
    Alert,
    Group,
    Text,
    Button,
    Badge,
    ScrollArea,
} from '@mantine/core';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface MyDecksImportModalProps {
    opened: boolean;
    onClose: () => void;
    title: string;
    onTitleChange: (val: string) => void;
    text: string;
    onTextChange: (val: string) => void;
    error: string | null;
    parsedResults: any;
    onValidate: () => void;
    onSubmit: () => void;
}

export function MyDecksImportModal({
    opened,
    onClose,
    title,
    onTitleChange,
    text,
    onTextChange,
    error,
    parsedResults,
    onValidate,
    onSubmit,
}: MyDecksImportModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Import Decklist from Text"
            size="lg"
            radius="lg"
            centered
        >
            <Stack gap="md">
                <TextInput
                    label="Deck Name"
                    placeholder="e.g. Sapphire / Steel Control"
                    value={title}
                    onChange={(e) => onTitleChange(e.currentTarget.value)}
                    required
                />

                <Textarea
                    label="Paste Decklist (Format: 4 Card Name or 4x Card Name)"
                    placeholder={`4 Mickey Mouse - Brave Little Tailor\n4 Tinker Bell - Giant Fairy\n2 Whole New World`}
                    value={text}
                    onChange={(e) => onTextChange(e.currentTarget.value)}
                    rows={8}
                    required
                />

                {error && (
                    <Alert icon={<IconAlertTriangle size={16} />} color="red">
                        {error}
                    </Alert>
                )}

                {parsedResults && (
                    <Stack gap="xs">
                        <Group justify="space-between" align="center">
                            <Text size="xs" fw={700} c="gray.3">
                                Parsed Preview:{' '}
                                {parsedResults.validEntries.reduce(
                                    (s: number, e: any) => s + e.qty,
                                    0,
                                )}
                                /60 Cards
                            </Text>
                            <Badge
                                size="xs"
                                color={
                                    parsedResults.invalidLines.length === 0
                                        ? 'teal'
                                        : 'yellow'
                                }
                            >
                                {parsedResults.validEntries.length} Unique
                                Recognized
                            </Badge>
                        </Group>

                        <ScrollArea
                            h={120}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 8,
                                padding: 8,
                            }}
                        >
                            {parsedResults.validEntries.map(
                                (e: any, idx: number) => (
                                    <Text key={idx} size="xs" c="gray.3">
                                        ✓ {e.qty}x {e.card.name} (
                                        {e.card.set || ''})
                                    </Text>
                                ),
                            )}
                            {parsedResults.invalidLines.map(
                                (line: string, idx: number) => (
                                    <Text key={idx} size="xs" c="red.4">
                                        ✗ Could not resolve: "{line}"
                                    </Text>
                                ),
                            )}
                        </ScrollArea>
                    </Stack>
                )}

                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="light"
                        color="violet"
                        onClick={onValidate}
                        disabled={!text.trim()}
                    >
                        Validate Preview
                    </Button>
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet.6', to: 'indigo.6' }}
                        disabled={
                            !title.trim() ||
                            !parsedResults ||
                            parsedResults.validEntries.length === 0
                        }
                        onClick={onSubmit}
                        leftSection={<IconCheck size={16} />}
                    >
                        Import Deck
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
