import {
    useEffect,
    useRef,
    useState,
    useCallback,
    useImperativeHandle,
    forwardRef,
} from 'react';
import {
    Box,
    Text,
    Badge,
    Group,
    Loader,
    Button,
    Paper,
    Stack,
    Center,
} from '@mantine/core';
import {
    IconCamera,
    IconAlertCircle,
    IconRefresh,
    IconUpload,
    IconSparkles,
} from '@tabler/icons-react';
import type { Card } from '../../../types/lorcana';
import {
    preprocessCanvasForOcr,
    matchCardFromOcr,
} from '../../../utils/scanner/ocrDetector';
import { playCardChime } from '../../../utils/scanner/soundEffects';

export interface CameraViewfinderRef {
    captureFrame: () => string | null;
    toggleTorch: () => Promise<boolean>;
    triggerFocus: () => Promise<void>;
    hasTorch: boolean;
    isTorchOn: boolean;
    openFilePicker: () => void;
}

export interface CameraViewfinderProps {
    cards: Card[];
    onCardDetected: (card: Card, method: 'ocr' | 'ai') => void;
    isPaused: boolean;
    facingMode: 'environment' | 'user';
    isAiScanning?: boolean;
    onImageUploaded?: (base64: string) => void;
}

export const CameraViewfinder = forwardRef<
    CameraViewfinderRef,
    CameraViewfinderProps
>(function CameraViewfinder(
    {
        cards,
        onCardDetected,
        isPaused,
        facingMode,
        isAiScanning = false,
        onImageUploaded,
    },
    ref,
) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workerRef = useRef<any>(null);
    const isScanningRef = useRef(false);
    const candidateRef = useRef<{
        cardId: string;
        count: number;
        timestamp: number;
    } | null>(null);
    const imageCaptureRef = useRef<any>(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isNotFoundError, setIsNotFoundError] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [scanStatus, setScanStatus] = useState<string>(
        'Hold card inside frame',
    );
    const [ocrReady, setOcrReady] = useState(false);
    const [isCardLocked, setIsCardLocked] = useState(false);
    const [isProcessingFrame, setIsProcessingFrame] = useState(false);
    const isProcessingRef = useRef(false);
    const [hasZoom, setHasZoom] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Initialize Tesseract.js worker safely with high-performance low-latency settings
    useEffect(() => {
        let isMounted = true;
        async function initOcr() {
            try {
                const { createWorker } = await import('tesseract.js');
                const worker = await createWorker('eng');
                await worker.setParameters({
                    tessjs_create_hocr: '0',
                    tessjs_create_tsv: '0',
                    tessjs_create_box: '0',
                    tessjs_create_unlv: '0',
                    tessjs_create_osd: '0',
                    tessedit_char_whitelist:
                        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -/·•'!:",
                });
                if (isMounted) {
                    workerRef.current = worker;
                    setOcrReady(true);
                } else {
                    await worker.terminate();
                }
            } catch (e) {
                console.warn('[OCR Worker Init Error]:', e);
            }
        }
        initOcr();

        return () => {
            isMounted = false;
            if (workerRef.current) {
                const w = workerRef.current;
                workerRef.current = null;
                w.terminate().catch(() => {});
            }
        };
    }, []);

    // Process an uploaded or captured image file
    const processImageFile = useCallback(
        async (file: File | null) => {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Data = e.target?.result as string;
                if (!base64Data) return;

                onImageUploaded?.(base64Data);

                if (workerRef.current && !isScanningRef.current) {
                    try {
                        isScanningRef.current = true;
                        const img = new window.Image();
                        img.src = base64Data;
                        await img.decode();

                        const tempCanvas = document.createElement('canvas');
                        preprocessCanvasForOcr(img, tempCanvas, {
                            x: 0,
                            y: 0,
                            width: 1,
                            height: 1,
                        });

                        if (tempCanvas.width >= 60 && tempCanvas.height >= 60) {
                            const { data } =
                                await workerRef.current.recognize(tempCanvas);
                            if (data?.text) {
                                const match = matchCardFromOcr(
                                    data.text,
                                    cards,
                                );
                                if (match && match.card) {
                                    const cardPrice = Math.max(
                                        match.card.prices?.usd ?? 0,
                                        match.card.prices?.usd_foil ?? 0,
                                    );
                                    playCardChime(cardPrice);
                                    onCardDetected(match.card, 'ocr');
                                    return;
                                }
                            }
                        }
                    } catch (ocrErr) {
                        console.warn('[Image OCR Error]:', ocrErr);
                    } finally {
                        isScanningRef.current = false;
                    }
                }
            };
            reader.readAsDataURL(file);
        },
        [cards, onCardDetected, onImageUploaded],
    );

    // Robust camera streamer with fallback constraints
    const startCameraStream = useCallback(async () => {
        setCameraLoading(true);
        setCameraError(null);
        setIsNotFoundError(false);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError(
                'Camera API is not supported in this browser. Please use HTTPS or localhost in a modern browser.',
            );
            setCameraLoading(false);
            return;
        }

        let stream: MediaStream | null = null;

        const isMobile =
            typeof navigator !== 'undefined' &&
            (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent,
            ) ||
                navigator.maxTouchPoints > 1);

        // Progressive constraints: Start at 1080p Full HD, gracefully fall back without OverconstrainedError
        const candidates: MediaStreamConstraints[] = isMobile
            ? [
                  {
                      video: {
                          facingMode: { ideal: facingMode },
                          width: { ideal: 1920 },
                          height: { ideal: 1080 },
                          frameRate: { ideal: 30 },
                      },
                      audio: false,
                  },
                  {
                      video: {
                          facingMode: { ideal: facingMode },
                          width: { ideal: 1280 },
                          height: { ideal: 720 },
                      },
                      audio: false,
                  },
                  {
                      video: {
                          facingMode: { ideal: facingMode },
                      },
                      audio: false,
                  },
                  {
                      video: true,
                      audio: false,
                  },
              ]
            : [
                  {
                      video: {
                          width: { ideal: 1920 },
                          height: { ideal: 1080 },
                      },
                      audio: false,
                  },
                  {
                      video: true,
                      audio: false,
                  },
              ];

        let lastErr: any = null;
        for (const c of candidates) {
            try {
                stream = await navigator.mediaDevices.getUserMedia(c);
                if (stream) break;
            } catch (e: any) {
                lastErr = e;
                console.warn(
                    '[Camera Attempt Failed, trying next candidate]:',
                    e?.message || e,
                );
            }
        }

        if (!stream) {
            console.error('[All Camera Attempts Failed]:', lastErr);
            const isNotFound =
                lastErr?.name === 'NotFoundError' ||
                lastErr?.name === 'DevicesNotFoundError' ||
                lastErr?.message?.toLowerCase().includes('not found');
            setIsNotFoundError(isNotFound);

            setCameraError(
                isNotFound
                    ? 'No camera device was reported by the browser. If another app (FaceTime/Zoom/PhotoBooth) is using the camera, please close it. You can also upload a card photo below.'
                    : lastErr?.name === 'NotAllowedError' ||
                        lastErr?.name === 'PermissionDeniedError'
                      ? 'Camera permission was denied in the browser.'
                      : `Could not open camera: ${lastErr?.message || 'Device error'}.`,
            );
            setCameraLoading(false);
            setCameraActive(false);
            return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
            video.srcObject = stream;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.muted = true;

            video.onloadedmetadata = async () => {
                try {
                    await video.play();
                    setCameraActive(true);
                    setCameraLoading(false);
                } catch (playErr) {
                    console.warn('[Video Play Error]:', playErr);
                    setCameraLoading(false);
                }
            };
        }

        const track = stream.getVideoTracks()[0];
        if (track) {
            const capabilities = (track.getCapabilities?.() as any) || {};
            setHasTorch(Boolean(capabilities.torch));

            // Detect optical/digital zoom capabilities (vital for holding cards outside minimum focal blur distance)
            if (capabilities.zoom) {
                setHasZoom(true);
                const initialZoom = Math.min(1.4, capabilities.zoom.max || 1);
                if (initialZoom > 1) {
                    try {
                        await (track as any).applyConstraints({
                            advanced: [{ zoom: initialZoom }],
                        });
                        setZoomLevel(initialZoom);
                        console.log(
                            '[Camera Initial Zoom Applied]:',
                            initialZoom,
                        );
                    } catch (zErr) {
                        console.warn('[Camera Initial Zoom Warning]:', zErr);
                    }
                }
            }

            // Activate continuous autofocus, auto-exposure, and auto-white-balance on mobile camera hardware
            const advanced: any = {};
            if (
                capabilities.focusMode &&
                Array.isArray(capabilities.focusMode)
            ) {
                if (capabilities.focusMode.includes('continuous')) {
                    advanced.focusMode = 'continuous';
                } else if (capabilities.focusMode.includes('single-shot')) {
                    advanced.focusMode = 'single-shot';
                }
            }
            if (
                capabilities.exposureMode &&
                Array.isArray(capabilities.exposureMode)
            ) {
                if (capabilities.exposureMode.includes('continuous')) {
                    advanced.exposureMode = 'continuous';
                }
            }
            if (
                capabilities.whiteBalanceMode &&
                Array.isArray(capabilities.whiteBalanceMode)
            ) {
                if (capabilities.whiteBalanceMode.includes('continuous')) {
                    advanced.whiteBalanceMode = 'continuous';
                }
            }

            if (Object.keys(advanced).length > 0) {
                try {
                    await (track as any).applyConstraints({
                        advanced: [advanced],
                    });
                    console.log(
                        '[Camera Advanced Constraints Applied]:',
                        advanced,
                    );
                } catch (constraintErr) {
                    console.warn(
                        '[Camera Advanced Constraints Warning]:',
                        constraintErr,
                    );
                }
            }

            // Initialize ImageCapture API if available in Chromium on Android
            if (typeof window !== 'undefined' && 'ImageCapture' in window) {
                try {
                    imageCaptureRef.current = new (window as any).ImageCapture(
                        track,
                    );
                    console.log('[ImageCapture API Initialized]');
                } catch (icErr) {
                    console.warn('[ImageCapture Init Warning]:', icErr);
                }
            }
        }
    }, [facingMode]);

    useEffect(() => {
        startCameraStream();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, [startCameraStream]);

    // Toggle torch helper
    const toggleTorch = useCallback(async (): Promise<boolean> => {
        if (!streamRef.current) return false;
        const track = streamRef.current.getVideoTracks()[0];
        if (!track) return false;

        try {
            const nextState = !isTorchOn;
            await (track as any).applyConstraints({
                advanced: [{ torch: nextState }],
            });
            setIsTorchOn(nextState);
            return nextState;
        } catch (e) {
            console.warn('Torch constraint error:', e);
            return isTorchOn;
        }
    }, [isTorchOn]);

    // Tap-to-focus helper for mobile cameras
    const triggerFocus = useCallback(async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (!track) return;

        const capabilities = (track.getCapabilities?.() as any) || {};
        setScanStatus('Refocusing camera...');
        try {
            if (
                capabilities.focusMode &&
                Array.isArray(capabilities.focusMode)
            ) {
                if (capabilities.focusMode.includes('continuous')) {
                    await (track as any).applyConstraints({
                        advanced: [{ focusMode: 'continuous' }],
                    });
                } else if (capabilities.focusMode.includes('single-shot')) {
                    await (track as any).applyConstraints({
                        advanced: [{ focusMode: 'single-shot' }],
                    });
                }
            }
        } catch (err) {
            console.warn('[Focus trigger error]:', err);
        } finally {
            setTimeout(() => setScanStatus('Hold card inside frame'), 1200);
        }
    }, []);

    // Set optical/digital zoom level
    const handleSetZoom = useCallback(async (level: number) => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (!track) return;
        try {
            await (track as any).applyConstraints({
                advanced: [{ zoom: level }],
            });
            setZoomLevel(level);
        } catch (err) {
            console.warn('[Set zoom error]:', err);
        }
    }, []);

    // Frame capture helper for AI Vision
    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return null;

        const canvas = document.createElement('canvas');
        const scale = Math.min(
            1,
            640 / Math.max(video.videoWidth, video.videoHeight),
        );
        canvas.width = Math.floor(video.videoWidth * scale);
        canvas.height = Math.floor(video.videoHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.82);
    }, []);

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            captureFrame,
            toggleTorch,
            triggerFocus,
            hasTorch,
            isTorchOn,
            openFilePicker,
        }),
        [
            captureFrame,
            toggleTorch,
            triggerFocus,
            hasTorch,
            isTorchOn,
            openFilePicker,
        ],
    );

    // ManaBox-Style 60FPS Glowing HUD Reticle Overlay
    useEffect(() => {
        if (!cameraActive) return;

        let animId: number;

        function renderOverlay() {
            const overlay = overlayCanvasRef.current;
            if (!overlay) return;

            const dWidth = overlay.clientWidth || window.innerWidth;
            const dHeight = overlay.clientHeight || window.innerHeight;

            if (overlay.width !== dWidth || overlay.height !== dHeight) {
                overlay.width = dWidth;
                overlay.height = dHeight;
            }

            const ctx = overlay.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, dWidth, dHeight);

                // Compute centered card rectangle (2.5 : 3.5 TCG aspect ratio)
                // Sized comfortably so cards are held 8-12 inches away within optical focus distance
                const targetW = Math.min(dWidth * 0.82, 330);
                const targetH = Math.min(dHeight * 0.68, targetW / 0.714);
                const actualW = targetH * 0.714;
                const x0 = (dWidth - actualW) / 2;
                const y0 = Math.max(55, (dHeight - targetH) / 2 - 25);
                const x1 = x0 + actualW;
                const y1 = y0 + targetH;

                // 1. Draw glowing outer HUD outline (No interior fill)
                ctx.beginPath();
                ctx.roundRect(x0, y0, actualW, targetH, 16);
                ctx.strokeStyle = isCardLocked
                    ? '#10b981'
                    : isProcessingRef.current
                      ? 'rgba(56, 189, 248, 0.75)'
                      : 'rgba(168, 85, 247, 0.45)';
                ctx.lineWidth = isCardLocked
                    ? 3.5
                    : isProcessingRef.current
                      ? 2.5
                      : 1.5;
                ctx.shadowColor = isCardLocked
                    ? '#34d399'
                    : isProcessingRef.current
                      ? '#38bdf8'
                      : '#a855f7';
                ctx.shadowBlur = isCardLocked
                    ? 18
                    : isProcessingRef.current
                      ? 14
                      : 8;
                ctx.stroke();

                // 2. Draw live scanning laser beam inside reticle
                if (!isCardLocked) {
                    const time = performance.now();
                    const cycle = (time % 2200) / 2200;
                    const sweep = Math.sin(cycle * Math.PI);
                    const laserY = y0 + 12 + (targetH - 24) * sweep;

                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(x0, y0, actualW, targetH, 16);
                    ctx.clip();

                    const laserGrad = ctx.createLinearGradient(
                        x0,
                        laserY,
                        x1,
                        laserY,
                    );
                    laserGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
                    laserGrad.addColorStop(
                        0.2,
                        isProcessingRef.current
                            ? 'rgba(56, 189, 248, 0.7)'
                            : 'rgba(192, 132, 252, 0.45)',
                    );
                    laserGrad.addColorStop(
                        0.5,
                        isProcessingRef.current
                            ? 'rgba(255, 255, 255, 0.95)'
                            : 'rgba(224, 231, 255, 0.8)',
                    );
                    laserGrad.addColorStop(
                        0.8,
                        isProcessingRef.current
                            ? 'rgba(56, 189, 248, 0.7)'
                            : 'rgba(192, 132, 252, 0.45)',
                    );
                    laserGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

                    ctx.beginPath();
                    ctx.moveTo(x0, laserY);
                    ctx.lineTo(x1, laserY);
                    ctx.strokeStyle = laserGrad;
                    ctx.lineWidth = isProcessingRef.current ? 3 : 2;
                    ctx.shadowColor = isProcessingRef.current
                        ? '#38bdf8'
                        : '#a855f7';
                    ctx.shadowBlur = isProcessingRef.current ? 12 : 6;
                    ctx.stroke();

                    // Soft laser aura
                    const auraGrad = ctx.createLinearGradient(
                        0,
                        laserY - 12,
                        0,
                        laserY + 12,
                    );
                    auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
                    auraGrad.addColorStop(
                        0.5,
                        isProcessingRef.current
                            ? 'rgba(56, 189, 248, 0.18)'
                            : 'rgba(168, 85, 247, 0.08)',
                    );
                    auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                    ctx.fillStyle = auraGrad;
                    ctx.fillRect(x0, laserY - 12, actualW, 24);

                    ctx.restore();
                }

                // 3. Draw 4 high-contrast corner reticle brackets
                const cornerLen = 32;
                ctx.strokeStyle = isCardLocked
                    ? '#34d399'
                    : isProcessingRef.current
                      ? '#38bdf8'
                      : '#c084fc';
                ctx.lineWidth = isCardLocked
                    ? 4
                    : isProcessingRef.current
                      ? 4
                      : 3.5;
                ctx.shadowBlur = isCardLocked
                    ? 16
                    : isProcessingRef.current
                      ? 14
                      : 10;
                ctx.shadowColor = isCardLocked
                    ? '#34d399'
                    : isProcessingRef.current
                      ? '#38bdf8'
                      : '#a855f7';

                // Top-Left
                ctx.beginPath();
                ctx.moveTo(x0 + cornerLen, y0);
                ctx.lineTo(x0 + 12, y0);
                ctx.quadraticCurveTo(x0, y0, x0, y0 + 12);
                ctx.lineTo(x0, y0 + cornerLen);
                ctx.stroke();

                // Top-Right
                ctx.beginPath();
                ctx.moveTo(x1 - cornerLen, y0);
                ctx.lineTo(x1 - 12, y0);
                ctx.quadraticCurveTo(x1, y0, x1, y0 + 12);
                ctx.lineTo(x1, y0 + cornerLen);
                ctx.stroke();

                // Bottom-Right
                ctx.beginPath();
                ctx.moveTo(x1, y1 - cornerLen);
                ctx.lineTo(x1, y1 - 12);
                ctx.quadraticCurveTo(x1, y1, x1 - 12, y1);
                ctx.lineTo(x1 - cornerLen, y1);
                ctx.stroke();

                // Bottom-Left
                ctx.beginPath();
                ctx.moveTo(x0, y1 - cornerLen);
                ctx.lineTo(x0, y1 - 12);
                ctx.quadraticCurveTo(x0, y1, x0 + 12, y1);
                ctx.lineTo(x0 + cornerLen, y1);
                ctx.stroke();
            }

            animId = requestAnimationFrame(renderOverlay);
        }

        animId = requestAnimationFrame(renderOverlay);

        return () => {
            cancelAnimationFrame(animId);
        };
    }, [cameraActive, isCardLocked]);

    // Reset card locked visual feedback whenever unpaused / resuming
    useEffect(() => {
        if (!isPaused) {
            setIsCardLocked(false);
            setScanStatus('Hold card inside frame');
            candidateRef.current = null;
            isScanningRef.current = false;
            isProcessingRef.current = false;
            setIsProcessingFrame(false);
        }
    }, [isPaused]);

    // Continuous High-Speed OCR Recognition Loop
    useEffect(() => {
        if (!cameraActive || isPaused || !ocrReady || isAiScanning) {
            return;
        }

        setIsCardLocked(false);
        setScanStatus('Hold card inside frame');
        candidateRef.current = null;
        isScanningRef.current = false;
        isProcessingRef.current = false;
        setIsProcessingFrame(false);

        let isRunning = true;
        let timerId: any = null;

        async function scanFrame() {
            if (!isRunning || isPaused || isAiScanning) return;

            if (isScanningRef.current) {
                if (isRunning && !isPaused && !isAiScanning) {
                    timerId = setTimeout(scanFrame, 150);
                }
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const worker = workerRef.current;

            if (
                video &&
                canvas &&
                worker &&
                video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
                video.videoWidth > 0
            ) {
                try {
                    isScanningRef.current = true;

                    // Accurately map the centered HUD reticle on screen to the video coordinates
                    const overlay = overlayCanvasRef.current;
                    const dWidth = overlay?.clientWidth || window.innerWidth;
                    const dHeight = overlay?.clientHeight || window.innerHeight;

                    const targetW = Math.min(dWidth * 0.82, 330);
                    const targetH = Math.min(dHeight * 0.68, targetW / 0.714);
                    const actualW = targetH * 0.714;
                    const x0 = (dWidth - actualW) / 2;
                    const y0 = Math.max(55, (dHeight - targetH) / 2 - 25);

                    const scale = Math.max(
                        dWidth / video.videoWidth,
                        dHeight / video.videoHeight,
                    );
                    const renderedW = video.videoWidth * scale;
                    const renderedH = video.videoHeight * scale;
                    const offsetX = (renderedW - dWidth) / 2;
                    const offsetY = (renderedH - dHeight) / 2;

                    // Add 25% downward padding to ensure collector numbers are never truncated
                    const padBottom = (targetH / scale) * 0.25;
                    const padSides = (actualW / scale) * 0.1;

                    const cropX = Math.max(
                        0,
                        (x0 + offsetX) / scale - padSides,
                    );
                    const cropY = Math.max(0, (y0 + offsetY) / scale);
                    const cropW = Math.min(
                        video.videoWidth - cropX,
                        actualW / scale + padSides * 2,
                    );
                    const cropH = Math.min(
                        video.videoHeight - cropY,
                        targetH / scale + padBottom,
                    );

                    preprocessCanvasForOcr(video, canvas, {
                        x: cropX / video.videoWidth,
                        y: cropY / video.videoHeight,
                        width: cropW / video.videoWidth,
                        height: cropH / video.videoHeight,
                    });

                    // Strict size guard before invoking Tesseract WASM
                    if (
                        canvas.width >= 80 &&
                        canvas.height >= 80 &&
                        workerRef.current
                    ) {
                        isProcessingRef.current = true;
                        setIsProcessingFrame(true);

                        let data: any = null;
                        try {
                            const res = await worker.recognize(canvas);
                            data = res?.data;
                        } finally {
                            isProcessingRef.current = false;
                            setIsProcessingFrame(false);
                        }

                        if (!isRunning || isPaused || isAiScanning) return;

                        const text = data?.text || '';

                        if (text.trim().length > 0) {
                            const result = matchCardFromOcr(text, cards);
                            if (result && result.card) {
                                const matched = result.card;
                                const now = Date.now();

                                console.log('[Scanner Match Candidate]:', {
                                    card: matched.name,
                                    score: result.score,
                                    snippet: text
                                        .slice(0, 60)
                                        .replace(/[\r\n]+/g, ' '),
                                });

                                // If a title has multiple printings in Lorcana (e.g. reprint in Set 4 vs Set 9 Epic #218),
                                // strictly verify the collector number before locking!
                                const titleNorm = matched.name
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, '');
                                const printingsCount = cards.filter(
                                    (c) =>
                                        c.name
                                            .toLowerCase()
                                            .replace(/[^a-z0-9]/g, '') ===
                                        titleNorm,
                                ).length;
                                const isNumberConfirmed = Boolean(
                                    result.score === 100 ||
                                    (result.parsed?.cardNumber &&
                                        result.parsed.cardNumber ===
                                            matched.number) ||
                                    new RegExp(
                                        `(?:^|[^0-9])${matched.number}(?:[^0-9]|$)`,
                                    ).test(text),
                                );

                                // For cards with multiple printings, require confirmed card number before locking!
                                const isHighConfidence =
                                    (printingsCount <= 1 ||
                                        isNumberConfirmed) &&
                                    result.score >= 95;
                                const isCandidateConfirmed =
                                    (printingsCount <= 1 ||
                                        isNumberConfirmed) &&
                                    candidateRef.current &&
                                    candidateRef.current.cardId ===
                                        matched.id &&
                                    now - candidateRef.current.timestamp < 1500;

                                if (isHighConfidence || isCandidateConfirmed) {
                                    candidateRef.current = null;
                                    setIsCardLocked(true);
                                    setScanStatus(`Found: ${matched.name}`);
                                    if (navigator.vibrate) {
                                        navigator.vibrate([40, 30, 40]);
                                    }
                                    const cardPrice = Math.max(
                                        matched.prices?.usd ?? 0,
                                        matched.prices?.usd_foil ?? 0,
                                    );
                                    playCardChime(cardPrice);
                                    onCardDetected(matched, 'ocr');
                                    if (
                                        isRunning &&
                                        !isPaused &&
                                        !isAiScanning
                                    ) {
                                        timerId = setTimeout(scanFrame, 800);
                                    }
                                    return;
                                } else {
                                    candidateRef.current = {
                                        cardId: matched.id,
                                        count: 1,
                                        timestamp: now,
                                    };
                                    if (
                                        printingsCount > 1 &&
                                        !isNumberConfirmed
                                    ) {
                                        setScanStatus(
                                            `Align bottom number for ${matched.name}...`,
                                        );
                                    } else {
                                        setScanStatus(
                                            `Focusing on ${matched.name}...`,
                                        );
                                    }
                                }
                            } else {
                                if (
                                    candidateRef.current &&
                                    Date.now() -
                                        candidateRef.current.timestamp >
                                        1200
                                ) {
                                    candidateRef.current = null;
                                    setScanStatus('Hold card inside frame');
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[OCR Scan Frame Warning]:', e);
                } finally {
                    isScanningRef.current = false;
                    isProcessingRef.current = false;
                    setIsProcessingFrame(false);
                }
            }

            if (isRunning && !isPaused && !isAiScanning) {
                timerId = setTimeout(scanFrame, 280);
            }
        }

        timerId = setTimeout(scanFrame, 300);

        return () => {
            isRunning = false;
            if (timerId) clearTimeout(timerId);
        };
    }, [cameraActive, isPaused, ocrReady, isAiScanning, cards, onCardDetected]);

    return (
        <Box
            onClick={triggerFocus}
            style={{
                position: 'relative',
                width: '100%',
                height: '100dvh',
                overflow: 'hidden',
                backgroundColor: '#05050d',
                cursor: 'pointer',
            }}
        >
            {/* Hidden processing canvas & file input */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    processImageFile(file);
                    e.target.value = '';
                }}
            />

            {/* Main Video Stream */}
            <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: cameraActive ? 'block' : 'none',
                }}
            />

            {/* Real-Time ManaBox Glowing HUD Reticle Overlay */}
            {cameraActive && (
                <canvas
                    ref={overlayCanvasRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 15,
                    }}
                />
            )}

            {/* Camera Permission / Error / Loading Center State */}
            {!cameraActive && (
                <Center
                    style={{
                        position: 'absolute',
                        inset: 0,
                        padding: 24,
                        zIndex: 20,
                    }}
                >
                    <Paper
                        p="xl"
                        radius="lg"
                        style={{
                            maxWidth: 380,
                            textAlign: 'center',
                            backgroundColor: 'rgba(20, 16, 46, 0.96)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                        }}
                    >
                        <Stack align="center" gap="md">
                            <Box
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    backgroundColor: cameraError
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : 'rgba(168, 85, 247, 0.15)',
                                    border: cameraError
                                        ? '1px solid rgba(239, 68, 68, 0.4)'
                                        : '1px solid rgba(168, 85, 247, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {cameraLoading ? (
                                    <Loader size="md" color="violet" />
                                ) : cameraError ? (
                                    <IconAlertCircle
                                        size={32}
                                        color="#ef4444"
                                    />
                                ) : (
                                    <IconCamera size={32} color="#a855f7" />
                                )}
                            </Box>

                            <Text size="md" fw={700} c="white">
                                {cameraLoading
                                    ? 'Initializing Camera...'
                                    : isNotFoundError
                                      ? 'No Camera Detected'
                                      : cameraError
                                        ? 'Camera Access Needed'
                                        : 'Enable Camera Access'}
                            </Text>

                            <Text size="xs" c="gray.4" lh={1.5}>
                                {cameraError
                                    ? cameraError
                                    : 'Grant camera permissions to scan your physical Disney Lorcana cards in real time.'}
                            </Text>

                            <Group justify="center" gap="xs" wrap="wrap">
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'violet', to: 'indigo' }}
                                    radius="xl"
                                    size="sm"
                                    leftSection={
                                        cameraError ? (
                                            <IconRefresh size={16} />
                                        ) : (
                                            <IconCamera size={16} />
                                        )
                                    }
                                    onClick={startCameraStream}
                                    loading={cameraLoading}
                                >
                                    {cameraError
                                        ? 'Retry Camera'
                                        : 'Start Camera'}
                                </Button>

                                <Button
                                    variant="light"
                                    color="teal"
                                    radius="xl"
                                    size="sm"
                                    leftSection={<IconUpload size={16} />}
                                    onClick={openFilePicker}
                                >
                                    Upload Card Photo
                                </Button>
                            </Group>
                        </Stack>
                    </Paper>
                </Center>
            )}

            {/* Floating HUD Status Pill (Top Offset) */}
            {cameraActive && (
                <Box
                    style={{
                        position: 'absolute',
                        top: 'max(68px, calc(env(safe-area-inset-top, 14px) + 54px))',
                        left: 0,
                        right: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        zIndex: 25,
                    }}
                >
                    {isAiScanning ? (
                        <Badge
                            size="md"
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'indigo' }}
                            leftSection={<Loader size={11} color="white" />}
                            style={{
                                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.5)',
                            }}
                        >
                            Analyzing with AI Vision...
                        </Badge>
                    ) : (
                        <Badge
                            size="sm"
                            radius="xl"
                            variant="filled"
                            leftSection={
                                isCardLocked ? (
                                    <Box
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#34d399',
                                            boxShadow: '0 0 8px #34d399',
                                        }}
                                    />
                                ) : isProcessingFrame ? (
                                    <Loader size={10} color="#38bdf8" />
                                ) : (
                                    <IconSparkles size={12} color="#a855f7" />
                                )
                            }
                            style={{
                                backgroundColor: isCardLocked
                                    ? 'rgba(6, 78, 59, 0.92)'
                                    : isProcessingFrame
                                      ? 'rgba(12, 38, 59, 0.94)'
                                      : 'rgba(20, 16, 46, 0.88)',
                                backdropFilter: 'blur(12px)',
                                border: isCardLocked
                                    ? '1px solid rgba(52, 211, 153, 0.6)'
                                    : isProcessingFrame
                                      ? '1px solid rgba(56, 189, 248, 0.6)'
                                      : '1px solid rgba(168, 85, 247, 0.3)',
                                color: isProcessingFrame
                                    ? '#e0f2fe'
                                    : '#ffffff',
                                boxShadow: isCardLocked
                                    ? '0 4px 16px rgba(16, 185, 129, 0.4)'
                                    : isProcessingFrame
                                      ? '0 4px 16px rgba(56, 189, 248, 0.35)'
                                      : '0 4px 14px rgba(0, 0, 0, 0.5)',
                                padding: '6px 14px',
                                height: 'auto',
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            {isCardLocked
                                ? 'Card Detected'
                                : isProcessingFrame
                                  ? 'Reading card...'
                                  : scanStatus}
                        </Badge>
                    )}
                    {!isAiScanning && !isCardLocked && (
                        <Text
                            size="xs"
                            c="rgba(255, 255, 255, 0.75)"
                            style={{
                                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                                marginTop: 4,
                                textAlign: 'center',
                                fontSize: 11,
                                pointerEvents: 'none',
                            }}
                        >
                            Hold 8–12 in. away • Tap to focus
                        </Text>
                    )}
                </Box>
            )}

            {/* Floating Optical/Digital Zoom Selector Pill */}
            {cameraActive && hasZoom && (
                <Box
                    style={{
                        position: 'absolute',
                        bottom: 'max(90px, calc(env(safe-area-inset-bottom, 16px) + 80px))',
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        zIndex: 25,
                    }}
                >
                    <Group
                        gap={4}
                        p={4}
                        style={{
                            backgroundColor: 'rgba(15, 12, 35, 0.88)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: 999,
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
                        }}
                    >
                        {[1, 1.4, 2].map((lvl) => {
                            const active = Math.abs(zoomLevel - lvl) < 0.18;
                            return (
                                <Button
                                    key={lvl}
                                    size="compact-xs"
                                    radius="xl"
                                    variant={active ? 'gradient' : 'subtle'}
                                    gradient={{ from: 'violet', to: 'indigo' }}
                                    c={active ? 'white' : 'gray.4'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetZoom(lvl);
                                    }}
                                    style={{
                                        fontWeight: active ? 700 : 500,
                                        fontSize: 11,
                                        minWidth: 42,
                                    }}
                                >
                                    {lvl === 1.4 ? '1.5×' : `${lvl}×`}
                                </Button>
                            );
                        })}
                    </Group>
                </Box>
            )}
        </Box>
    );
});
