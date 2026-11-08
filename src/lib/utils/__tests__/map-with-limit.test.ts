import { describe, expect, it } from "vitest";
import { mapWithLimit } from "@/lib/utils/map-with-limit";

describe("mapWithLimit", () => {
  it("keeps results in item order", async () => {
    const results = await mapWithLimit([30, 5, 15], 3, async (delay) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return delay * 2;
    });
    expect(results).toEqual([60, 10, 30]);
  });

  it("never runs more tasks than the limit at once", async () => {
    let running = 0;
    let peak = 0;
    await mapWithLimit([0, 1, 2, 3, 4, 5, 6], 3, async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
    });
    expect(peak).toBe(3);
  });

  it("handles an empty list", async () => {
    expect(await mapWithLimit([], 4, async (item) => item)).toEqual([]);
  });
});
