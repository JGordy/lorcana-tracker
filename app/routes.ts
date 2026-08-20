import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/home.tsx'),
    route('decks', 'routes/decks/decks.tsx'),
    route('my-decks', 'routes/my-decks.tsx'),
    route('collection', 'routes/collection/collection.tsx'),
    route('verify', 'routes/verify.tsx'),
    route('logout', 'routes/logout.tsx'),
] satisfies RouteConfig;
