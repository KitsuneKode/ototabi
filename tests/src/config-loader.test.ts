import { ConfigLoader } from "@ototabi/common/config-loader";
import { describe, expect, test } from "bun:test";

describe("ConfigLoader", () => {
  test("should load configurations correctly from schema mapping functions", () => {
    const schema = {
      port: () => 8080,
      env: () => "test-env",
    };

    const loader = ConfigLoader.getInstance(schema, "unit-test-1");
    expect(loader.getConfig("port")).toBe(8080);
    expect(loader.getConfig("env")).toBe("test-env");
  });

  test("should cache and return the same configuration instance for the same key identifier", () => {
    const schema1 = {
      value: () => "val-1",
    };
    const schema2 = {
      value: () => "val-2",
    };

    const firstInstance = ConfigLoader.getInstance(schema1, "unit-test-2");
    const secondInstance = ConfigLoader.getInstance(schema2, "unit-test-2");

    // Since the key 'unit-test-2' is the same, they must return the exact same instance, ignoring schema2
    expect(firstInstance).toBe(secondInstance);
    expect(secondInstance.getConfig("value")).toBe("val-1");
  });

  test("should throw error when validate is invoked with a key that is undefined/null", () => {
    const schema = {
      host: () => undefined as unknown as string,
      port: () => 8080,
    };

    const loader = ConfigLoader.getInstance(schema, "unit-test-3");

    // Validating 'port' should pass
    expect(() => loader.validate(["port"])).not.toThrow();

    // Validating 'host' which is undefined must throw an error
    expect(() => loader.validate(["host"])).toThrow(
      'Configuration key "host" is required but not provided.',
    );
  });

  test("should return all configs correctly", () => {
    const schema = {
      a: () => 1,
      b: () => "two",
    };
    const loader = ConfigLoader.getInstance(schema, "unit-test-4");
    expect(loader.getAllConfigs()).toEqual({ a: 1, b: "two" });
  });
});
