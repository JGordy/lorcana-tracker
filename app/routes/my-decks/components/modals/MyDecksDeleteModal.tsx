import { Modal, Stack, Text, Group, Button } from '@mantine/core';

interface MyDecksDeleteModalProps {
    opened: boolean;
    onClose: () => void;
    deckTitle: string;
    onConfirmDelete: () => void;
}

export function MyDecksDeleteModal({
    opened,
    onClose,
    deckTitle,
    onConfirmDelete,
}: MyDecksDeleteModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            zIndex={400}
            title="Delete Custom Deck"
            size="sm"
            radius="lg"
            centered
        >
            <Stack gap="md">
                <Text size="sm" c="gray.3">
                    Are you sure you want to permanently delete "{deckTitle}"?
                    This action cannot be undone.
                </Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={onConfirmDelete}>
                        Permanently Delete
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
