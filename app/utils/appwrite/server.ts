import { Client, Account, Databases, Users } from 'node-appwrite';
import { appwriteConfig } from './config';

// Cookie configuration
const COOKIE_NAME = 'appwrite-session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Serialize a session secret into a Set-Cookie header string
 */
export function serializeSessionCookie(secret: string): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const parts = [
        `${COOKIE_NAME}=${secret}`,
        `Max-Age=${COOKIE_MAX_AGE}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
    ];

    if (isProduction) {
        parts.push('Secure');
    }

    return parts.join('; ');
}

/**
 * Serialize cookie deletion header
 */
export function serializeDeleteSessionCookie(): string {
    return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

/**
 * Parse the session secret from a request's Cookie header
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));

    if (!sessionCookie) return null;

    return sessionCookie.substring(COOKIE_NAME.length + 1);
}

/**
 * Creates an Appwrite client configured with a user session from Request cookie
 * Use this in loaders and actions to query on behalf of the authenticated user
 */
export function createSessionClient(request: Request) {
    const client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId);

    const cookieHeader = request.headers.get('Cookie');
    const session = parseSessionCookie(cookieHeader);

    if (session) {
        client.setSession(session);
    }

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get client() {
            return client;
        },
    };
}

/**
 * Creates an Appwrite client configured with a specific session secret
 */
export function createSessionClientFromSecret(secret: string) {
    const client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId)
        .setSession(secret);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get client() {
            return client;
        },
    };
}

/**
 * Creates an admin Appwrite client (for server-side system operations)
 */
export function createAdminClient() {
    const client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId);

    if (appwriteConfig.apiKey) {
        client.setKey(appwriteConfig.apiKey);
    }

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get users() {
            return new Users(client);
        },
        get client() {
            return client;
        },
    };
}
