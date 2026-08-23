import type { LoaderFunctionArgs } from 'react-router';

/**
 * Server-side image proxy loader to bypass browser CORS restrictions
 * when generating canvas exports / data URLs for external CDN card images.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const requestUrl = new URL(request.url);
    const imageUrl = requestUrl.searchParams.get('url');

    if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    // Only allow HTTP/HTTPS URLs
    if (!/^https?:\/\//i.test(imageUrl)) {
        return new Response('Invalid image URL protocol', { status: 400 });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            return new Response(
                `Failed to fetch remote image: ${response.status}`,
                {
                    status: response.status,
                },
            );
        }

        const contentType =
            response.headers.get('content-type') || 'image/jpeg';
        const imageBuffer = await response.arrayBuffer();

        return new Response(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
        });
    } catch (error) {
        console.error('Error proxying image in api/proxy-image:', error);
        return new Response('Internal error proxying image', { status: 500 });
    }
}
