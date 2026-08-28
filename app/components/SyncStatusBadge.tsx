import React from 'react';
import { Badge, Tooltip } from '@mantine/core';
import {
    IconCloudCheck,
    IconCloudUpload,
    IconWifiOff,
    IconAlertTriangle,
} from '@tabler/icons-react';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncStatusBadgeProps {
    status: SyncStatus;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status }) => {
    switch (status) {
        case 'syncing':
            return (
                <Tooltip label="Saving changes to cloud storage...">
                    <Badge
                        color="yellow"
                        variant="light"
                        size="sm"
                        leftSection={<IconCloudUpload size={14} />}
                    >
                        Saving...
                    </Badge>
                </Tooltip>
            );
        case 'offline':
            return (
                <Tooltip label="Changes are saved locally to your device. Cloud sync will resume when online.">
                    <Badge
                        color="blue"
                        variant="light"
                        size="sm"
                        leftSection={<IconWifiOff size={14} />}
                    >
                        Saved to Device
                    </Badge>
                </Tooltip>
            );
        case 'error':
            return (
                <Tooltip label="Could not sync with cloud. Your data remains safe on your device.">
                    <Badge
                        color="red"
                        variant="light"
                        size="sm"
                        leftSection={<IconAlertTriangle size={14} />}
                    >
                        Sync Error
                    </Badge>
                </Tooltip>
            );
        case 'synced':
        default:
            return (
                <Tooltip label="All collection changes are saved locally and synced to cloud storage.">
                    <Badge
                        color="green"
                        variant="light"
                        size="sm"
                        leftSection={<IconCloudCheck size={14} />}
                    >
                        Saved & Synced
                    </Badge>
                </Tooltip>
            );
    }
};
