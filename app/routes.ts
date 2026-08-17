import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/home.tsx'),
    route('decks', 'routes/decks.tsx'),
    route('collection', 'routes/collection.tsx'),
    route('verify', 'routes/verify.tsx'),
    route('logout', 'routes/logout.tsx'),
] satisfies RouteConfig;
