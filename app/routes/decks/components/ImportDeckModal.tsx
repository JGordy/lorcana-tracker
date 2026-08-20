import {
    Modal,
    Stack,
    Text,
    TextInput,
    Textarea,
    Group,
    Badge,
    Box,
    Button,
} from '@mantine/core';
import type { ParsedResults } from '../hooks/useDeckImport';

interface ImportDeckModalProps {
    opened: boolean;
    onClose: () => void;
    importTitle: string;
    setImportTitle: (val: string) => void;
    importText: string;
    setImportText: (val: string) => void;
    importError: string | null;
    parsedResults: ParsedResults | null;
    onValidate: () => void;
    onSubmit: () => void;
}

export function ImportDeckModal({
    opened,
    onClose,
    importTitle,
    setImportTitle,
    importText,
    setImportText,
    importError,
    parsedResults,
    onValidate,
    onSubmit,
}: ImportDeckModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Text fw={700} size="lg">
                    Import Lorcana Deck List
                </Text>
            }
            size="lg"
            centered
            styles={{
                content: {
                    backgroundColor: 'var(--mantine-color-dark-8)',
                    color: 'var(--mantine-color-gray-1)',
                },
                header: {
                    backgroundColor: 'var(--mantine-color-dark-8)',
                    color: 'var(--mantine-color-gray-1)',
                },
            }}
        >
            <Stack gap="md">
                <Text size="xs" c="gray.4">
                    Paste a decklist from Dreamborn.ink or Inkdecks.com. The
                    parser supports quantities and card names (e.g.{' '}
                    <code>4 Elsa - Spirit of Winter</code> or{' '}
                    <code>4 Elsa - Spirit of Winter (001-042)</code>).
                </Text>

                <TextInput
                    label="Deck Title"
                    placeholder="e.g. Amber/Emerald Toys"
                    required
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    styles={{
                        input: {
                            backgroundColor: 'var(--mantine-color-dark-9)',
                        },
                    }}
                />

                <Textarea
                    label="Decklist Text"
                    placeholder="Paste decklist here, e.g.&#10;4 Elsa - Spirit of Winter&#10;4 Koda - Talkative Cub (005-001)"
                    minRows={8}
                    required
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    styles={{
                        input: {
                            backgroundColor: 'var(--mantine-color-dark-9)',
                            fontFamily: 'monospace',
                            fontSize: 12,
                        },
                    }}
                />

                {importError && (
                    <Text size="xs" c="red.4" fw={500}>
                        {importError}
                    </Text>
                )}

                {parsedResults && (
                    <Stack
                        gap="xs"
                        style={{
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: 12,
                        }}
                    >
                        <Text size="sm" fw={600}>
                            Parser Validation Summary:
                        </Text>
                        <Group gap="md">
                            <Badge color="teal" variant="light">
                                {parsedResults.matched.reduce(
                                    (acc, curr) => acc + curr.quantity,
                                    0,
                                )}{' '}
                                Cards Matched ({parsedResults.matched.length} Unique)
                            </Badge>
                            {parsedResults.unmatched.length > 0 && (
                                <Badge color="red" variant="light">
                                    {parsedResults.unmatched.reduce(
                                        (acc, curr) => acc + curr.quantity,
                                        0,
                                    )}{' '}
                                    Unknown Cards
                                </Badge>
                            )}
                        </Group>

                        {parsedResults.unmatched.length > 0 && (
                            <Box>
                                <Text size="xs" c="red.4" fw={500} mb={4}>
                                    Warning: The following cards could not be found
                                    in the database (they will be skipped):
                                </Text>
                                <Box
                                    style={{
                                        maxHeight: 100,
                                        overflowY: 'auto',
                                        backgroundColor: 'rgba(255,0,0,0.05)',
                                        padding: 8,
                                        borderRadius: 4,
                                    }}
                                >
                                    {parsedResults.unmatched.map((item, idx) => (
                                        <Text
                                            key={idx}
                                            size="xs"
                                            c="gray.4"
                                            style={{
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            - {item.quantity}x {item.name}{' '}
                                            {item.setCode ? `(${item.setCode})` : ''}
                                        </Text>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Stack>
                )}

                <Group justify="end" mt="md">
                    <Button
                        variant="outline"
                        color="gray"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="light"
                        color="blue"
                        onClick={onValidate}
                    >
                        Validate List
                    </Button>
                    <Button
                        variant="filled"
                        color="violet"
                        disabled={
                            !parsedResults || parsedResults.matched.length === 0
                        }
                        onClick={onSubmit}
                    >
                        Import Deck
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
