import {
    Group,
    ActionIcon,
    Tooltip,
    Switch,
    Box,
    Button,
    Paper,
    Text,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconBolt,
    IconBoltOff,
    IconCameraRotate,
    IconSparkles,
    IconUpload,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';

export interface ScannerControlsProps {
    isRapidMode: boolean;
    onToggleRapidMode: (val: boolean) => void;
    hasTorch: boolean;
    isTorchOn: boolean;
    onToggleTorch: () => void;
    onSwitchCamera: () => void;
    onTriggerAiScan: () => void;
    onOpenFilePicker?: () => void;
    isAiScanning: boolean;
    hasGeminiApiKey?: boolean;
}

export function ScannerControls({
    isRapidMode,
    onToggleRapidMode,
    hasTorch,
    isTorchOn,
    onToggleTorch,
    onSwitchCamera,
    onTriggerAiScan,
    onOpenFilePicker,
    isAiScanning,
    hasGeminiApiKey = true,
}: ScannerControlsProps) {
    const navigate = useNavigate();

    return (
        <>
            {/* Top Bar: Back Button */}
            <Box
                style={{
                    position: 'absolute',
                    top: 'max(68px, calc(env(safe-area-inset-top, 14px) + 54px))',
                    left: 16,
                    zIndex: 30,
                    pointerEvents: 'none',
                }}
            >
                <Tooltip label="Back to Collection">
                    <ActionIcon
                        variant="subtle"
                        size="md"
                        radius="xl"
                        onClick={() => navigate('/collection')}
                        aria-label="Back to Collection"
                        style={{
                            pointerEvents: 'auto',
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        <IconArrowLeft size={18} />
                    </ActionIcon>
                </Tooltip>
            </Box>

            {/* Bottom Floating Thumb Control Dock */}
            <Box
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 35,
                    padding:
                        '12px 16px max(20px, env(safe-area-inset-bottom, 20px))',
                    background:
                        'linear-gradient(0deg, rgba(10, 10, 20, 0.95) 0%, rgba(10, 10, 20, 0.8) 70%, rgba(10, 10, 20, 0) 100%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <Paper
                    radius="xl"
                    px={{ base: 'xs', sm: 'md' }}
                    py={8}
                    style={{
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: 440,
                        backgroundColor: 'rgba(24, 20, 48, 0.88)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        boxShadow:
                            '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.2)',
                    }}
                >
                    <Group
                        justify="space-between"
                        align="center"
                        wrap="nowrap"
                        gap="xs"
                    >
                        {/* Left Secondary Controls: Torch, Camera Switch & File Upload */}
                        <Group gap={6} wrap="nowrap">
                            {hasTorch && (
                                <Tooltip
                                    label={
                                        isTorchOn
                                            ? 'Flashlight Off'
                                            : 'Flashlight On'
                                    }
                                >
                                    <ActionIcon
                                        variant="subtle"
                                        size="md"
                                        radius="xl"
                                        onClick={onToggleTorch}
                                        aria-label="Toggle Flashlight"
                                        style={{
                                            backgroundColor: isTorchOn
                                                ? 'rgba(251, 191, 36, 0.3)'
                                                : 'rgba(255, 255, 255, 0.08)',
                                            border: isTorchOn
                                                ? '1px solid rgba(251, 191, 36, 0.6)'
                                                : '1px solid rgba(255, 255, 255, 0.1)',
                                            color: isTorchOn
                                                ? '#fbbf24'
                                                : '#e2e8f0',
                                        }}
                                    >
                                        {isTorchOn ? (
                                            <IconBolt size={18} />
                                        ) : (
                                            <IconBoltOff size={18} />
                                        )}
                                    </ActionIcon>
                                </Tooltip>
                            )}

                            <Tooltip label="Switch Front/Back Camera">
                                <ActionIcon
                                    variant="subtle"
                                    size="md"
                                    radius="xl"
                                    onClick={onSwitchCamera}
                                    aria-label="Switch Camera"
                                    style={{
                                        backgroundColor:
                                            'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#e2e8f0',
                                    }}
                                >
                                    <IconCameraRotate size={18} />
                                </ActionIcon>
                            </Tooltip>

                            {onOpenFilePicker && (
                                <Tooltip label="Upload / Snap Card Photo">
                                    <ActionIcon
                                        variant="subtle"
                                        size="md"
                                        radius="xl"
                                        onClick={onOpenFilePicker}
                                        aria-label="Upload Card Photo"
                                        style={{
                                            backgroundColor:
                                                'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#e2e8f0',
                                        }}
                                    >
                                        <IconUpload size={18} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </Group>

                        {/* Center: Rapid Pack Mode Switch */}
                        <Paper
                            radius="xl"
                            px={8}
                            py={3}
                            style={{
                                backgroundColor: isRapidMode
                                    ? 'rgba(16, 185, 129, 0.25)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: isRapidMode
                                    ? '1px solid rgba(16, 185, 129, 0.5)'
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Group gap={4} align="center" wrap="nowrap">
                                <IconBolt
                                    size={14}
                                    color={isRapidMode ? '#34d399' : '#94a3b8'}
                                />
                                <Switch
                                    size="xs"
                                    color="teal"
                                    checked={isRapidMode}
                                    onChange={(e) =>
                                        onToggleRapidMode(
                                            e.currentTarget.checked,
                                        )
                                    }
                                    label={
                                        <Text
                                            size="11px"
                                            fw={700}
                                            c={
                                                isRapidMode
                                                    ? 'teal.3'
                                                    : 'gray.4'
                                            }
                                            style={{
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.3,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {isRapidMode
                                                ? 'Rapid Mode'
                                                : 'Single Scan'}
                                        </Text>
                                    }
                                />
                            </Group>
                        </Paper>

                        {/* Right: AI Scan Button (Only rendered if configured) */}
                        {hasGeminiApiKey && (
                            <Tooltip label="Identify foil or promo with AI Vision">
                                <Button
                                    size="xs"
                                    radius="xl"
                                    variant="gradient"
                                    gradient={{ from: 'violet', to: 'indigo' }}
                                    leftSection={<IconSparkles size={14} />}
                                    loading={isAiScanning}
                                    onClick={onTriggerAiScan}
                                    styles={{
                                        root: {
                                            height: 32,
                                            paddingLeft: 12,
                                            paddingRight: 12,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            boxShadow:
                                                '0 4px 12px rgba(139, 92, 246, 0.4)',
                                        },
                                    }}
                                >
                                    AI Scan
                                </Button>
                            </Tooltip>
                        )}
                    </Group>
                </Paper>
            </Box>
        </>
    );
}
