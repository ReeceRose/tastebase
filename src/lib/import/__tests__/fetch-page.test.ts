import { afterEach, describe, expect, it, vi } from "vitest";

const lookupMock = vi.hoisted(() => vi.fn());
vi.mock("node:dns/promises", () => ({ lookup: lookupMock }));

import {
  fetchRecipePage,
  isBlockedAddress,
  PageFetchError,
  parseImportUrl,
} from "@/lib/import/fetch-page";

afterEach(() => {
  vi.restoreAllMocks();
  lookupMock.mockReset();
});

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.20.0.5",
    "192.168.1.10",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:192.168.1.1",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(["93.184.216.34", "2606:4700::6810:85e5"])(
    "allows public address %s",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );
});

describe("parseImportUrl", () => {
  it("rejects non-http protocols and embedded credentials", () => {
    expect(() => parseImportUrl("file:///etc/passwd")).toThrow(PageFetchError);
    expect(() => parseImportUrl("https://user:pass@example.com")).toThrow(
      PageFetchError,
    );
    expect(() => parseImportUrl("not a url")).toThrow(PageFetchError);
  });
});

describe("fetchRecipePage", () => {
  it("refuses hosts that resolve to private addresses", async () => {
    lookupMock.mockResolvedValue([{ address: "192.168.1.5", family: 4 }]);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(fetchRecipePage("https://nas.example.com/")).rejects.toThrow(
      "local or private",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("re-checks the destination of a redirect", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/admin" },
      }),
    );

    await expect(fetchRecipePage("https://example.com/r")).rejects.toThrow(
      "local or private",
    );
  });

  it("returns the HTML of a public page", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html><body>Soup</body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const page = await fetchRecipePage("https://example.com/soup");
    expect(page.url).toBe("https://example.com/soup");
    expect(page.html).toContain("Soup");
  });

  it("explains paywalled or login-protected pages", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Subscribe", { status: 403 }),
    );

    await expect(fetchRecipePage("https://example.com/paid")).rejects.toThrow(
      "paywall",
    );
  });
});
