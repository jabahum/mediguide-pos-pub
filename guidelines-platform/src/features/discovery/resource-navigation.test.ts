import { describe, expect, it, vi } from "vitest";

import {
  confirmExternalResource,
  isExternalResourceRoute,
} from "./resource-navigation";

describe("discovery resource navigation", () => {
  it("recognizes only valid HTTPS external routes", () => {
    expect(isExternalResourceRoute("https://www.who.int/publications")).toBe(true);
    expect(isExternalResourceRoute("http://example.test")).toBe(false);
    expect(isExternalResourceRoute("/guidelines/123")).toBe(false);
    expect(isExternalResourceRoute("not a url")).toBe(false);
  });

  it("requires explicit confirmation", () => {
    const reject = vi.fn(() => false);
    expect(confirmExternalResource(reject)).toBe(false);
    expect(reject).toHaveBeenCalledOnce();
  });
});
