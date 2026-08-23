import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    Modal,
    Group,
    Text,
    Button,
    SegmentedControl,
    Box,
    Stack,
    Alert,
    Tooltip,
    ActionIcon,
} from '@mantine/core';
import {
    IconDownload,
    IconCopy,
    IconCheck,
    IconPhoto,
    IconAlertCircle,
    IconPlus,
    IconMinus,
} from '@tabler/icons-react';
import * as htmlToImage from 'html-to-image';
import { DeckGraphicCanvas } from './DeckGraphicCanvas';
import { parseDeckMetadata, getCardSlug } from '../../../utils/deck';

export interface ExportDeckGraphicModalProps {
    opened: boolean;
    onClose: () => void;
    deck: any;
}

/**
 * Converts an image URL to a base64 data URL via local proxy to prevent CORS canvas taints.
 */
async function toDataUrl(url: string): Promise<string> {
    if (!url || url.startsWith('data:')) return url;
    try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) return url;

        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    resolve(url);
                }
            };
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
        });
    } catch {
        return url;
    }
}

export function ExportDeckGraphicModal({
    opened,
    onClose,
    deck,
}: ExportDeckGraphicModalProps) {
    const [groupBy, setGroupBy] = useState<'cost' | 'type'>('cost');
    const [columns, setColumns] = useState<number>(8);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [imageDataUrls, setImageDataUrls] = useState<Record<string, string>>(
        {},
    );

    const canvasRef = useRef<HTMLDivElement>(null);

    const meta = useMemo(
        () =>
            deck
                ? parseDeckMetadata(deck.description)
                : { format: 'core', inks: [] },
        [deck],
    );

    const deckTitle = deck?.title || 'Lorcana Deck';
    const creatorName = deck?.creator_name || deck?.author || '';
    const displayInks = useMemo(
        () => deck?.displayInks || (meta.inks.length > 0 ? meta.inks : []),
        [deck, meta],
    );

    const isCoreLegal =
        typeof deck?.isCoreLegal === 'boolean'
            ? deck.isCoreLegal
            : meta.format !== 'infinity';

    const cards = useMemo(
        () => (Array.isArray(deck?.cards) ? deck.cards : []),
        [deck],
    );

    // Pre-load card images as base64 data URLs when modal opens for crisp CORS-free export
    useEffect(() => {
        if (!opened || cards.length === 0) return;
        let isMounted = true;

        async function preloadImages() {
            const map: Record<string, string> = {};
            const promises = cards.map(async (dc: any) => {
                const card = dc.card || dc;
                if (card && card.image_url) {
                    const dataUrl = await toDataUrl(card.image_url);
                    map[card.id] = dataUrl;
                    if (card.$id) map[card.$id] = dataUrl;
                }
            });
            await Promise.all(promises);
            if (isMounted) {
                setImageDataUrls(map);
            }
        }

        preloadImages();
        return () => {
            isMounted = false;
        };
    }, [opened, cards]);

    const handleDownload = useCallback(async () => {
        const node = canvasRef.current;
        if (!node) return;
        setIsGenerating(true);
        setErrorMsg(null);

        try {
            const fullWidth = node.scrollWidth || 1200;
            const fullHeight = node.scrollHeight;

            const dataUrl = await htmlToImage.toPng(node, {
                pixelRatio: 2,
                cacheBust: false,
                width: fullWidth,
                height: fullHeight,
                style: {
                    maxHeight: 'none',
                    overflow: 'visible',
                },
            });

            const fileName = `${getCardSlug(deckTitle) || 'deck'}-decklist.png`;
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate PNG image download:', err);
            setErrorMsg(
                'Could not capture deck graphic image. Please try again.',
            );
        } finally {
            setIsGenerating(false);
        }
    }, [deckTitle]);

    const handleCopyClipboard = useCallback(async () => {
        const node = canvasRef.current;
        if (!node) return;
        setIsGenerating(true);
        setErrorMsg(null);

        try {
            const fullWidth = node.scrollWidth || 1200;
            const fullHeight = node.scrollHeight;

            const blob = await htmlToImage.toBlob(node, {
                pixelRatio: 2,
                cacheBust: false,
                width: fullWidth,
                height: fullHeight,
                style: {
                    maxHeight: 'none',
                    overflow: 'visible',
                },
            });

            if (!blob) {
                throw new Error('Failed to generate image blob');
            }

            if (
                typeof navigator !== 'undefined' &&
                navigator.clipboard &&
                typeof ClipboardItem !== 'undefined'
            ) {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob }),
                ]);
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2500);
            } else {
                await handleDownload();
                setErrorMsg(
                    'Direct clipboard copy not supported in this browser. Image downloaded instead!',
                );
            }
        } catch (err) {
            console.error('Failed to copy image to clipboard:', err);
            try {
                await handleDownload();
                setErrorMsg(
                    'Clipboard permissions restricted. Image downloaded instead!',
                );
            } catch {
                setErrorMsg(
                    'Failed to copy image to clipboard. Please try downloading directly.',
                );
            }
        } finally {
            setIsGenerating(false);
        }
    }, [handleDownload]);

    if (!deck) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs" align="center">
                    <Box
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            background:
                                'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <IconPhoto size={18} color="#c084fc" />
                    </Box>
                    <Box>
                        <Text
                            fw={900}
                            size="md"
                            style={{
                                fontFamily: "'Cinzel Decorative', serif",
                                background:
                                    'linear-gradient(to right, #ffffff, #e9d5ff, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Export Shareable Graphic
                        </Text>
                        <Text size="11px" c="gray.4">
                            High-DPI visual deck spread for Discord & Reddit
                        </Text>
                    </Box>
                </Group>
            }
            size="1380px"
            centered
            radius="lg"
            styles={{
                content: {
                    background:
                        'linear-gradient(180deg, #110d24 0%, #0c0919 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)',
                },
                header: {
                    background: 'rgba(15, 11, 32, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px 20px',
                },
                body: {
                    padding: '16px 20px',
                },
            }}
        >
            <Stack gap="md">
                {/* Control Action Bar */}
                <Group
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap="md"
                >
                    <Group gap="lg" align="center" wrap="wrap">
                        {/* 1. Sort Order Selector */}
                        <Group gap="xs" align="center">
                            <Text size="xs" fw={700} c="gray.4">
                                Sort Cards:
                            </Text>
                            <SegmentedControl
                                size="xs"
                                value={groupBy}
                                onChange={(val) =>
                                    setGroupBy(val as 'cost' | 'type')
                                }
                                data={[
                                    { label: 'By Ink Cost', value: 'cost' },
                                    { label: 'By Card Type', value: 'type' },
                                ]}
                                styles={{
                                    root: {
                                        backgroundColor:
                                            'rgba(15, 23, 42, 0.7)',
                                        borderColor: 'rgba(168, 85, 247, 0.3)',
                                    },
                                    indicator: {
                                        background:
                                            'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                                    },
                                    label: {
                                        fontWeight: 700,
                                        fontSize: 11,
                                    },
                                }}
                            />
                        </Group>

                        {/* 2. Columns Stepper (Dreamborn Style) */}
                        <Group gap="xs" align="center">
                            <Text size="xs" fw={700} c="gray.4">
                                Columns:
                            </Text>
                            <ActionIcon
                                size="xs"
                                variant="light"
                                color="violet"
                                disabled={columns <= 5}
                                onClick={() =>
                                    setColumns((c) => Math.max(5, c - 1))
                                }
                            >
                                <IconMinus size={12} />
                            </ActionIcon>
                            <Text
                                size="xs"
                                fw={800}
                                c="white"
                                style={{ minWidth: 16, textAlign: 'center' }}
                            >
                                {columns}
                            </Text>
                            <ActionIcon
                                size="xs"
                                variant="light"
                                color="violet"
                                disabled={columns >= 12}
                                onClick={() =>
                                    setColumns((c) => Math.min(12, c + 1))
                                }
                            >
                                <IconPlus size={12} />
                            </ActionIcon>
                        </Group>
                    </Group>

                    {/* Right: Export & Copy Actions */}
                    <Group gap="xs">
                        <Tooltip
                            label="Copy PNG image to clipboard for easy pasting (Cmd+V / Ctrl+V)"
                            withArrow
                        >
                            <Button
                                variant="gradient"
                                gradient={{
                                    from: 'violet.7',
                                    to: 'indigo.6',
                                    deg: 90,
                                }}
                                size="xs"
                                radius="md"
                                leftSection={
                                    copyFeedback ? (
                                        <IconCheck size={14} color="#2ecc71" />
                                    ) : (
                                        <IconCopy size={14} />
                                    )
                                }
                                loading={isGenerating}
                                onClick={handleCopyClipboard}
                                style={{ fontWeight: 700 }}
                            >
                                {copyFeedback
                                    ? 'Copied to Clipboard!'
                                    : 'Copy Image'}
                            </Button>
                        </Tooltip>

                        <Tooltip
                            label="Download high-resolution PNG file"
                            withArrow
                        >
                            <Button
                                variant="light"
                                color="violet"
                                size="xs"
                                radius="md"
                                leftSection={<IconDownload size={14} />}
                                loading={isGenerating}
                                onClick={handleDownload}
                                style={{ fontWeight: 700 }}
                            >
                                Download PNG
                            </Button>
                        </Tooltip>
                    </Group>
                </Group>

                {errorMsg && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        color="amber"
                        variant="light"
                        withCloseButton
                        onClose={() => setErrorMsg(null)}
                        styles={{
                            root: {
                                padding: '8px 12px',
                            },
                        }}
                    >
                        <Text size="xs">{errorMsg}</Text>
                    </Alert>
                )}

                {/* Graphic Preview Container */}
                <Box
                    p="md"
                    style={{
                        background: 'rgba(5, 7, 15, 0.8)',
                        borderRadius: 12,
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        maxHeight: '75vh',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <DeckGraphicCanvas
                            ref={canvasRef}
                            deckTitle={deckTitle}
                            creatorName={creatorName}
                            displayInks={displayInks}
                            isCoreLegal={isCoreLegal}
                            cards={cards}
                            groupBy={groupBy}
                            columns={columns}
                            imageDataUrls={imageDataUrls}
                        />
                    </Box>
                </Box>
            </Stack>
        </Modal>
    );
}
