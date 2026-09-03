import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/home/home.tsx'),
    route('decks', 'routes/decks/decks.tsx'),
    route('my-decks', 'routes/my-decks/my-decks.tsx'),
    route('collection', 'routes/collection/collection.tsx'),
    route('verify', 'routes/verify/verify.tsx'),
    route('logout', 'routes/logout/logout.tsx'),
    route('api/proxy-image', 'routes/api/proxy-image.ts'),
    route('api/health', 'routes/api/health.ts'),
] satisfies RouteConfig;
