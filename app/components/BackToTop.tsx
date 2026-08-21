import { Affix, Button, Transition } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { IconArrowUp } from '@tabler/icons-react';

interface BackToTopProps {
    threshold?: number;
}

export function BackToTop({ threshold = 300 }: BackToTopProps) {
    const [scroll, scrollTo] = useWindowScroll();

    return (
        <Affix position={{ bottom: 24, right: 24 }} zIndex={99}>
            <Transition transition="slide-up" mounted={scroll.y > threshold}>
                {(transitionStyles) => (
                    <Button
                        aria-label="Back to top"
                        leftSection={<IconArrowUp size={16} />}
                        variant="gradient"
                        gradient={{ from: 'violet.7', to: 'indigo.7' }}
                        size="sm"
                        radius="xl"
                        style={{
                            ...transitionStyles,
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            boxShadow:
                                '0 8px 20px -4px rgba(124, 58, 237, 0.45), 0 2px 8px rgba(0, 0, 0, 0.6)',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                        onClick={() => scrollTo({ y: 0 })}
                    >
                        Back to Top
                    </Button>
                )}
            </Transition>
        </Affix>
    );
}
