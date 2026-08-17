import { describe, it, expect, beforeEach } from 'vitest';
import { appwriteConfig } from './config';

describe('AppwriteConfig', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    it('should have sensible default values', () => {
        expect(appwriteConfig.endpoint).toBeDefined();
        expect(appwriteConfig.projectId).toBeDefined();
        expect(appwriteConfig.databaseId).toBeDefined();
    });

    it('should detect when Appwrite is configured', () => {
        expect(appwriteConfig.isConfigured).toBe(true);
    });

    it('should validate required variables without API key by default', () => {
        expect(() => appwriteConfig.validate(false)).not.toThrow();
    });
});
