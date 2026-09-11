import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLoaderData, useFetcher } from 'react-router';
import {
    Box,
    Paper,
    Group,
    Image,
    Text,
    Badge,
    Transition,
} from '@mantine/core';
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';
import type { Card } from '../../types/lorcana';
import { buildCardsLookup } from '../../utils/deck';
import {
    CameraViewfinder,
    type CameraViewfinderRef,
} from './components/CameraViewfinder';
import { ScannerControls } from './components/ScannerControls';
import { ScannedCardDrawer } from './components/ScannedCardDrawer';
import { loader } from './loader';
import { action } from './action';
import { playCardChime } from '../../utils/scanner/soundEffects';

export { loader, action };

export default function ScanPage() {
    const {
        cards,
        userCollection: initialUserCollection,
        user,
        hasGeminiApiKey,
    } = useLoaderData<typeof loader>();
    const visionFetcher = useFetcher<any>();
    const inventoryFetcher = useFetcher();

    const viewfinderRef = useRef<CameraViewfinderRef | null>(null);

    // Local state
    const [isRapidMode, setIsRapidMode] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
        'environment',
    );
    const [isTorchOn, setIsTorchOn] = useState(false);

    const [activeCard, setActiveCard] = useState<Card | null>(null);
    const [detectionMethod, setDetectionMethod] = useState<'ocr' | 'ai'>('ocr');
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Rapid mode feedback toast
    const [rapidNotification, setRapidNotification] = useState<{
        card: Card;
        timestamp: number;
    } | null>(null);

    // Subtle notice (non-intrusive)
    const [statusNotice, setStatusNotice] = useState<string | null>(null);

    // Local inventory map cache
    const [inventoryMap, setInventoryMap] = useState<
        Record<string, { normal: number; foil: number }>
    >(() => {
        const map: Record<string, { normal: number; foil: number }> = {};
        for (const item of initialUserCollection) {
            if (!map[item.card_id]) {
                map[item.card_id] = { normal: 0, foil: 0 };
            }
            if (item.is_foil) {
                map[item.card_id].foil = item.quantity;
            } else {
                map[item.card_id].normal = item.quantity;
            }
        }
        return map;
    });

    const cardsLookup = useMemo(() => buildCardsLookup(cards), [cards]);

    const getCardQuantity = useCallback(
        (cardId: string) => {
            const resolved = cardsLookup.get(cardId);
            const canonicalId = resolved ? resolved.id : cardId;
            return (
                inventoryMap[canonicalId] ||
                inventoryMap[cardId] || { normal: 0, foil: 0 }
            );
        },
        [cardsLookup, inventoryMap],
    );

    // Update inventory quantity
    const handleAdjustQuantity = useCallback(
        (cardId: string, delta: number, isFoil: boolean) => {
            const resolved = cardsLookup.get(cardId);
            const canonicalId = resolved ? resolved.id : cardId;
            const current = getCardQuantity(canonicalId);

            const newNormal = isFoil
                ? current.normal
                : Math.max(0, current.normal + delta);
            const newFoil = isFoil
                ? Math.max(0, current.foil + delta)
                : current.foil;
            const newQty = isFoil ? newFoil : newNormal;

            // Optimistic update
            setInventoryMap((prev) => ({
                ...prev,
                [canonicalId]: {
                    normal: newNormal,
                    foil: newFoil,
                },
            }));

            // Sync with backend
            inventoryFetcher.submit(
                {
                    intent: 'update-quantity',
                    userId: user?.$id || 'guest',
                    cardId: canonicalId,
                    quantity: String(newQty),
                    isFoil: String(isFoil),
                },
                { method: 'post' },
            );
        },
        [cardsLookup, getCardQuantity, inventoryFetcher, user],
    );

    // Handle card matched by OCR or AI
    const handleCardDetected = useCallback(
        (card: Card, method: 'ocr' | 'ai') => {
            setDetectionMethod(method);
            setActiveCard(card);
            setStatusNotice(null);

            if (isRapidMode) {
                // Rapid mode: auto-add +1 normal, show feedback, and pause briefly
                handleAdjustQuantity(card.id, 1, false);
                setRapidNotification({ card, timestamp: Date.now() });
                setIsPaused(true);

                setTimeout(() => {
                    setRapidNotification(null);
                    setIsPaused(false);
                }, 1200);
            } else {
                // Single scan mode: pause stream and open drawer
                setIsPaused(true);
                setDrawerOpened(true);
            }
        },
        [isRapidMode, handleAdjustQuantity],
    );

    // Close drawer and resume scanning
    const handleCloseDrawer = () => {
        setDrawerOpened(false);
        setActiveCard(null);
        setTimeout(() => {
            setIsPaused(false);
        }, 400);
    };

    // Toggle Torch
    const handleToggleTorch = async () => {
        if (viewfinderRef.current) {
            const newState = await viewfinderRef.current.toggleTorch();
            setIsTorchOn(newState);
        }
    };

    // Switch Camera Front / Back
    const handleSwitchCamera = () => {
        setFacingMode((prev) =>
            prev === 'environment' ? 'user' : 'environment',
        );
    };

    // Trigger AI Vision with an explicit base64 frame or current video frame
    const handleTriggerAiScan = (customBase64?: string) => {
        if (!hasGeminiApiKey) {
            return;
        }

        const frameBase64 =
            customBase64 || viewfinderRef.current?.captureFrame();
        if (!frameBase64) {
            setStatusNotice('Please position the card in frame to scan.');
            setTimeout(() => setStatusNotice(null), 2500);
            return;
        }

        setStatusNotice(null);
        visionFetcher.submit(
            {
                intent: 'gemini-vision',
                image: frameBase64,
            },
            { method: 'post' },
        );
    };

    // Open file picker
    const handleOpenFilePicker = () => {
        viewfinderRef.current?.openFilePicker();
    };

    // Handle photo uploaded
    const handleImageUploaded = (base64: string) => {
        if (hasGeminiApiKey) {
            setTimeout(() => {
                if (!activeCard && !drawerOpened) {
                    handleTriggerAiScan(base64);
                }
            }, 500);
        }
    };

    // Process AI Vision response
    useEffect(() => {
        if (visionFetcher.data) {
            if (visionFetcher.data.success && visionFetcher.data.card) {
                const card = visionFetcher.data.card;
                const cardPrice = Math.max(
                    card.prices?.usd ?? 0,
                    card.prices?.usd_foil ?? 0,
                );
                playCardChime(cardPrice);
                handleCardDetected(card, 'ai');
            } else {
                setStatusNotice(
                    'Card not recognized. Align bottom collector code in frame.',
                );
                setTimeout(() => setStatusNotice(null), 3500);
            }
        }
    }, [visionFetcher.data, handleCardDetected, activeCard, drawerOpened]);

    const activeCardQty = activeCard
        ? getCardQuantity(activeCard.id)
        : { normal: 0, foil: 0 };
    const isAiScanning = visionFetcher.state === 'submitting';

    return (
        <Box
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#05050d',
                zIndex: 50,
                overflow: 'hidden',
            }}
        >
            {/* Top Navigation & Mode Controls */}
            <ScannerControls
                isRapidMode={isRapidMode}
                onToggleRapidMode={setIsRapidMode}
                hasTorch={Boolean(viewfinderRef.current?.hasTorch)}
                isTorchOn={isTorchOn}
                onToggleTorch={handleToggleTorch}
                onSwitchCamera={handleSwitchCamera}
                onTriggerAiScan={() => handleTriggerAiScan()}
                onOpenFilePicker={handleOpenFilePicker}
                isAiScanning={isAiScanning}
                hasGeminiApiKey={hasGeminiApiKey}
            />

            {/* Main Video Viewfinder */}
            <CameraViewfinder
                ref={viewfinderRef}
                cards={cards}
                onCardDetected={handleCardDetected}
                isPaused={isPaused}
                facingMode={facingMode}
                isAiScanning={isAiScanning}
                onImageUploaded={handleImageUploaded}
            />

            {/* Subtle Notification Toast */}
            <Transition
                mounted={Boolean(statusNotice)}
                transition="slide-down"
                duration={200}
            >
                {(styles) => (
                    <Box
                        style={{
                            ...styles,
                            position: 'absolute',
                            top: 64,
                            left: 16,
                            right: 16,
                            zIndex: 40,
                            display: 'flex',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                        }}
                    >
                        <Badge
                            size="lg"
                            radius="xl"
                            variant="filled"
                            leftSection={<IconInfoCircle size={14} />}
                            style={{
                                backgroundColor: 'rgba(30, 27, 75, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                color: '#e2e8f0',
                                padding: '8px 16px',
                                height: 'auto',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                                maxWidth: 400,
                                textAlign: 'center',
                            }}
                        >
                            {statusNotice}
                        </Badge>
                    </Box>
                )}
            </Transition>

            {/* Rapid Mode Success Toast Overlay */}
            <Transition
                mounted={Boolean(rapidNotification)}
                transition="slide-up"
                duration={200}
            >
                {(styles) => (
                    <Box
                        style={{
                            ...styles,
                            position: 'absolute',
                            bottom: 'max(95px, calc(env(safe-area-inset-bottom, 20px) + 85px))',
                            left: 16,
                            right: 16,
                            zIndex: 40,
                            pointerEvents: 'none',
                        }}
                    >
                        {rapidNotification && (
                            <Paper
                                p="sm"
                                radius="xl"
                                style={{
                                    backgroundColor: 'rgba(6, 78, 59, 0.94)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid #10b981',
                                    boxShadow:
                                        '0 10px 30px rgba(16, 185, 129, 0.4)',
                                    maxWidth: 420,
                                    margin: '0 auto',
                                }}
                            >
                                <Group
                                    justify="space-between"
                                    align="center"
                                    wrap="nowrap"
                                >
                                    <Group gap="sm" wrap="nowrap">
                                        <Image
                                            src={
                                                rapidNotification.card.image_url
                                            }
                                            w={36}
                                            h={50}
                                            radius="sm"
                                            alt={rapidNotification.card.name}
                                        />
                                        <Box>
                                            <Group gap={6} align="center">
                                                <IconCheck
                                                    size={16}
                                                    color="#34d399"
                                                />
                                                <Text
                                                    size="sm"
                                                    fw={700}
                                                    c="white"
                                                >
                                                    +1 Added to Collection
                                                </Text>
                                            </Group>
                                            <Text
                                                size="xs"
                                                c="gray.2"
                                                lineClamp={1}
                                            >
                                                {rapidNotification.card.name}
                                            </Text>
                                        </Box>
                                    </Group>
                                    <Badge
                                        size="sm"
                                        color="teal"
                                        variant="light"
                                    >
                                        Total:{' '}
                                        {
                                            getCardQuantity(
                                                rapidNotification.card.id,
                                            ).normal
                                        }
                                    </Badge>
                                </Group>
                            </Paper>
                        )}
                    </Box>
                )}
            </Transition>

            {/* Single Scan Mode Drawer */}
            <ScannedCardDrawer
                opened={drawerOpened}
                onClose={handleCloseDrawer}
                card={activeCard}
                allCards={cards}
                normalQty={activeCardQty.normal}
                foilQty={activeCardQty.foil}
                onAdjustQuantity={handleAdjustQuantity}
                onSelectCard={(selected) => {
                    setActiveCard(selected);
                    const cardPrice = Math.max(
                        selected.prices?.usd ?? 0,
                        selected.prices?.usd_foil ?? 0,
                    );
                    playCardChime(cardPrice);
                }}
                detectionMethod={detectionMethod}
            />
        </Box>
    );
}
