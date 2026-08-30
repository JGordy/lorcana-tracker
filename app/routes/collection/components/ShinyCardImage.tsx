import { useState, useRef, useEffect } from 'react';
import type { Card as LorcanaCard } from '../../../types/lorcana';
import { SPECIAL_RARITIES } from '../utils/collectionHelpers';

export interface ShinyCardImageProps {
    card: LorcanaCard;
}

export function ShinyCardImage({ card }: ShinyCardImageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number | null>(null);
    const [tilt, setTilt] = useState({
        rx: 0,
        ry: 0,
        gx: 50,
        gy: 50,
        active: false,
    });

    useEffect(() => {
        return () => {
            if (animFrameRef.current !== null) {
                cancelAnimationFrame(animFrameRef.current);
            }
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (animFrameRef.current !== null)
            cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setTilt({
                rx: (0.5 - y) * 18,
                ry: (x - 0.5) * 18,
                gx: x * 100,
                gy: y * 100,
                active: true,
            });
        });
    };

    const handleMouseLeave = () => {
        if (animFrameRef.current !== null)
            cancelAnimationFrame(animFrameRef.current);
        setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
    };

    const isSpecial = SPECIAL_RARITIES.has(card.rarity);
    const hasHolo = card.rarity === 'Enchanted' || card.rarity === 'Iconic';
    const hasShimmer = card.rarity === 'Epic';

    if (!card.image_url) return null;

    return (
        <div
            ref={containerRef}
            onMouseMove={isSpecial ? handleMouseMove : undefined}
            onMouseLeave={isSpecial ? handleMouseLeave : undefined}
            data-testid="shiny-card-container"
            style={{
                position: 'relative',
                transform: isSpecial
                    ? `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.active ? 1.03 : 1})`
                    : undefined,
                transition: tilt.active
                    ? 'transform 0.05s linear'
                    : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                transformStyle: 'preserve-3d',
                willChange: isSpecial ? 'transform' : undefined,
            }}
        >
            <img
                src={card.image_url}
                alt={card.name}
                style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {hasHolo && (
                <div
                    className="shiny-holo-layer"
                    data-testid="shiny-holo-layer"
                    style={{
                        background: tilt.active
                            ? `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 255, 255, 0.35) 0%, transparent 60%),
                               linear-gradient(${tilt.gx * 0.8 + tilt.gy * 0.8}deg,
                                  rgba(244, 114, 182, 0.18) 0%,
                                  rgba(192, 132, 252, 0.18) 25%,
                                  rgba(96, 165, 250, 0.18) 50%,
                                  rgba(251, 191, 36, 0.18) 75%,
                                  rgba(244, 114, 182, 0.18) 100%)`
                            : undefined,
                        opacity: tilt.active ? 1 : 0,
                    }}
                />
            )}
            {hasShimmer && tilt.active && (
                <div
                    className="shiny-shimmer-layer"
                    data-testid="shiny-shimmer-layer"
                />
            )}
        </div>
    );
}
