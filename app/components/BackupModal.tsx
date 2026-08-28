import React, { useState } from 'react';
import {
    Modal,
    Button,
    Group,
    Text,
    Stack,
    FileInput,
    Alert,
} from '@mantine/core';
import {
    IconDownload,
    IconUpload,
    IconAlertCircle,
    IconCheck,
} from '@tabler/icons-react';
import type { UserCollectionMap } from '../types/lorcana';
import {
    parseAndValidateBackup,
    type BackupPayload,
} from '../utils/backup-schema';

interface BackupModalProps {
    opened: boolean;
    onClose: () => void;
    currentCollection: UserCollectionMap;
    onRestore: (data: BackupPayload) => Promise<void>;
}

export const BackupModal: React.FC<BackupModalProps> = ({
    opened,
    onClose,
    currentCollection,
    onRestore,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const handleDownloadBackup = () => {
        const payload: BackupPayload = {
            version: 1,
            exported_at: new Date().toISOString(),
            collection: currentCollection,
        };

        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const dateStr = new Date().toISOString().split('T')[0];
        const link = document.createElement('a');
        link.href = url;
        link.download = `lorcana-tracker-backup-${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileRestore = async () => {
        if (!file) return;
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsRestoring(true);

        try {
            const text = await file.text();
            const validatedPayload = parseAndValidateBackup(text);
            await onRestore(validatedPayload);
            setSuccessMsg('Collection backup restored successfully!');
            setFile(null);
        } catch (err: any) {
            console.error('[BackupModal] Restore error:', err);
            setErrorMsg(
                err?.message ||
                    'Invalid or corrupted backup JSON file. Verification failed.',
            );
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                onClose();
            }}
            title={
                <Text fw={700} size="lg">
                    Collection Backup & Restore
                </Text>
            }
            centered
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Export your collection inventory to a single{' '}
                    <code>.json</code> backup file or restore from a previously
                    exported backup.
                </Text>

                {errorMsg && (
                    <Alert color="red" icon={<IconAlertCircle size={16} />}>
                        {errorMsg}
                    </Alert>
                )}

                {successMsg && (
                    <Alert color="green" icon={<IconCheck size={16} />}>
                        {successMsg}
                    </Alert>
                )}

                <Group justify="space-between" align="center">
                    <div>
                        <Text fw={600} size="sm">
                            Export Collection
                        </Text>
                        <Text size="xs" c="dimmed">
                            Download local collection backup
                        </Text>
                    </div>
                    <Button
                        leftSection={<IconDownload size={16} />}
                        onClick={handleDownloadBackup}
                        variant="light"
                        color="blue"
                    >
                        Export JSON
                    </Button>
                </Group>

                <Group justify="space-between" align="center" mt="sm">
                    <div>
                        <Text fw={600} size="sm">
                            Restore from Backup
                        </Text>
                        <Text size="xs" c="dimmed">
                            Upload `.json` collection file
                        </Text>
                    </div>
                </Group>

                <FileInput
                    placeholder="Select .json backup file"
                    accept="application/json"
                    value={file}
                    onChange={setFile}
                    clearable
                />

                {file && (
                    <Button
                        leftSection={<IconUpload size={16} />}
                        onClick={handleFileRestore}
                        loading={isRestoring}
                        color="green"
                        fullWidth
                    >
                        Restore Collection
                    </Button>
                )}
            </Stack>
        </Modal>
    );
};
