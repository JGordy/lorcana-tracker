import {
    useLoaderData,
    useSubmit,
    useFetcher,
    useNavigate,
    useSearchParams,
} from 'react-router';
import { useState, useMemo } from 'react';
import { Container } from '@mantine/core';

import { loader } from './loader';
import { action } from './action';
import { processMyDecks } from './utils/myDecksHelpers';
import { buildCardsLookup } from '../../utils/deck';
import { useMyDecksActions } from './hooks/useMyDecksActions';
import { useMyDecksImport } from './hooks/useMyDecksImport';
import { MyDecksHeader } from './components/MyDecksHeader';

export { loader, action };

export function meta() {
    return [{ title: 'My Personal Decks | GlimmerForge' }];
}

export default function MyDecks() {
    const { decks, cards, user, sort } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(
        () => searchParams.get('q') || '',
    );

    const { localDecks } = useMyDecksActions({
        decks,
        cards,
        user,
        submit,
        fetcher,
    });

    const { setImportModalOpen } = useMyDecksImport({
        cards,
        submit,
        userId: user?.$id,
    });

    const cardsLookup = useMemo(() => buildCardsLookup(cards), [cards]);

    const _processedDecks = useMemo(() => {
        return processMyDecks(localDecks, searchQuery, cardsLookup);
    }, [localDecks, searchQuery, cardsLookup]);

    const totalDecksCount = localDecks.length;
    const readyToPlayCount = localDecks.filter(
        (d) =>
            d.progress.ownedCount >= d.progress.totalCount &&
            d.progress.totalCount > 0,
    ).length;
    const inProgressCount = totalDecksCount - readyToPlayCount;

    return (
        <Container size="xl" py="xl">
            <MyDecksHeader
                totalDecksCount={totalDecksCount}
                readyToPlayCount={readyToPlayCount}
                inProgressCount={inProgressCount}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                    setSearchQuery(q);
                    setSearchParams(
                        (prev) => {
                            const next = new URLSearchParams(prev);
                            if (q.trim()) next.set('q', q.trim());
                            else next.delete('q');
                            return next;
                        },
                        { replace: true },
                    );
                }}
                sort={sort}
                navigate={navigate}
                user={user}
                onOpenCreateModal={() => {}}
                onOpenImportModal={() => setImportModalOpen(true)}
            />
        </Container>
    );
}
