/**
 * Base configuration class
 * Shared logic for environment variable configuration and validation
 */
export class BaseConfig {
    protected _validated = false;

    protected getEnv(
        key: string,
        envKey: string,
        defaultValue: string | null = null,
    ): string | null {
        if (!(this as any)[key]) {
            (this as any)[key] = process.env[envKey] || defaultValue;
        }
        return (this as any)[key];
    }

    /**
     * Throw an error if any required variables are missing
     */
    throwIfMissing(
        serviceName: string,
        checks: Array<{ label: string; value: any }>,
    ) {
        const missing = checks
            .filter((check) => !check.value)
            .map((check) => check.label);

        if (missing.length > 0) {
            throw new Error(
                `Missing required ${serviceName} environment variables: ${missing.join(', ')}`,
            );
        }
    }
}
