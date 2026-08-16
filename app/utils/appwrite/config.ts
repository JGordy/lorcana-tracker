import { BaseConfig } from "../config/base";

/**
 * Appwrite configuration module
 * Single source of truth for Appwrite environment variables (Server-side)
 */
class AppwriteConfig extends BaseConfig {
  private _endpoint: string | null = null;
  private _projectId: string | null = null;
  private _apiKey: string | null = null;
  private _databaseId: string | null = null;

  get endpoint(): string {
    return this.getEnv("_endpoint", "APPWRITE_ENDPOINT", "https://nyc.cloud.appwrite.io/v1")!;
  }

  get projectId(): string {
    return this.getEnv("_projectId", "APPWRITE_PROJECT_ID", "6a7f77c600230abc9a94")!;
  }

  get apiKey(): string | null {
    return this.getEnv("_apiKey", "APPWRITE_API_KEY");
  }

  get databaseId(): string {
    return this.getEnv("_databaseId", "APPWRITE_DATABASE_ID", "6a7f7ac20002f14ace29")!;
  }

  get isConfigured(): boolean {
    return !!this.projectId && this.projectId !== "PLACEHOLDER";
  }

  /**
   * Validate that required environment variables are set
   */
  validate(requireApiKey = false) {
    const checks: Array<{ label: string; value: any }> = [
      { label: "APPWRITE_ENDPOINT", value: this.endpoint },
      { label: "APPWRITE_PROJECT_ID", value: this.projectId },
    ];

    if (requireApiKey) {
      checks.push({ label: "APPWRITE_API_KEY", value: this.apiKey });
    }

    this.throwIfMissing("Appwrite", checks);
    this._validated = true;
  }
}

export const appwriteConfig = new AppwriteConfig();
