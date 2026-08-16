import { describe, it, expect, beforeEach } from "vitest";
import { BaseConfig } from "./base";

class TestConfig extends BaseConfig {
  get endpoint() {
    return this.getEnv("_endpoint", "TEST_ENDPOINT", "http://default.com");
  }

  get requiredSecret() {
    return this.getEnv("_secret", "TEST_SECRET");
  }

  validate() {
    this.throwIfMissing("TestService", [
      { label: "TEST_SECRET", value: this.requiredSecret },
    ]);
  }
}

describe("BaseConfig", () => {
  beforeEach(() => {
    delete process.env.TEST_ENDPOINT;
    delete process.env.TEST_SECRET;
  });

  it("should return default value when env variable is not set", () => {
    const config = new TestConfig();
    expect(config.endpoint).toBe("http://default.com");
  });

  it("should read environment variable when defined", () => {
    process.env.TEST_ENDPOINT = "https://custom.endpoint.com";
    const config = new TestConfig();
    expect(config.endpoint).toBe("https://custom.endpoint.com");
  });

  it("should throw descriptive error when required variables are missing", () => {
    const config = new TestConfig();
    expect(() => config.validate()).toThrow(
      "Missing required TestService environment variables: TEST_SECRET"
    );
  });

  it("should pass validation when required variables are present", () => {
    process.env.TEST_SECRET = "super-secret-key";
    const config = new TestConfig();
    expect(() => config.validate()).not.toThrow();
  });
});
