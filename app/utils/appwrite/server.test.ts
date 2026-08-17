import { describe, it, expect } from 'vitest';
import {
    serializeSessionCookie,
    serializeDeleteSessionCookie,
    parseSessionCookie,
} from './server';

describe('Appwrite Server Cookie Utilities', () => {
    const sampleSecret = 'session_jwt_secret_token_12345';

    it('should serialize a session cookie with HttpOnly and Lax attributes', () => {
        const cookieHeader = serializeSessionCookie(sampleSecret);
        expect(cookieHeader).toContain(`appwrite-session=${sampleSecret}`);
        expect(cookieHeader).toContain('HttpOnly');
        expect(cookieHeader).toContain('Path=/');
        expect(cookieHeader).toContain('SameSite=Lax');
    });

    it('should serialize cookie deletion header with Max-Age=0', () => {
        const deleteCookie = serializeDeleteSessionCookie();
        expect(deleteCookie).toContain('appwrite-session=');
        expect(deleteCookie).toContain('Max-Age=0');
        expect(deleteCookie).toContain('HttpOnly');
    });

    it('should parse session secret from cookie header', () => {
        const cookieHeader = `theme=dark; appwrite-session=${sampleSecret}; other=val`;
        const parsed = parseSessionCookie(cookieHeader);
        expect(parsed).toBe(sampleSecret);
    });

    it('should return null if cookie header is missing or does not contain session', () => {
        expect(parseSessionCookie(null)).toBeNull();
        expect(parseSessionCookie('theme=dark; token=xyz')).toBeNull();
    });
});
