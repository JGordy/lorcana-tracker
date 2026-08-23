import { describe, it, expect, vi } from 'vitest';
import { loader } from '../proxy-image';

describe('api/proxy-image loader', () => {
    it('returns 400 if url parameter is missing', async () => {
        const request = new Request('http://localhost:5173/api/proxy-image');
        const response = await loader({
            request,
            params: {},
            context: {},
        } as any);
        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Missing url parameter');
    });

    it('returns 400 if url protocol is not HTTP/HTTPS', async () => {
        const request = new Request(
            'http://localhost:5173/api/proxy-image?url=ftp://example.com/image.png',
        );
        const response = await loader({
            request,
            params: {},
            context: {},
        } as any);
        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Invalid image URL protocol');
    });

    it('proxies remote image successfully with Access-Control-Allow-Origin headers', async () => {
        const fakeImageBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'image/png' }),
            arrayBuffer: () => Promise.resolve(fakeImageBuffer),
        });
        vi.stubGlobal('fetch', mockFetch);

        const request = new Request(
            'http://localhost:5173/api/proxy-image?url=https://api.lorcana.ravensburger.com/images/en/set1/1.jpg',
        );
        const response = await loader({
            request,
            params: {},
            context: {},
        } as any);

        expect(response.status).toBe(200);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Content-Type')).toBe('image/png');

        vi.unstubAllGlobals();
    });
});
