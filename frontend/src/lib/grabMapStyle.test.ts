import { describe, expect, it } from "vitest";
import { styleWithApiBaseUrl } from "@/lib/grabMapStyle";

describe("GrabMaps style URL normalization", () => {
  it("points backend-relative tile URLs at the configured API base URL", () => {
    const style = {
      version: 8,
      sources: {
        grabmaptiles: {
          type: "vector",
          tiles: ["/api/map/tiles/v2/vector/karta-v3/{z}/{x}/{y}.pbf"]
        },
        other: {
          type: "vector",
          tiles: ["https://example.test/tiles/{z}/{x}/{y}.pbf"]
        }
      },
      layers: []
    };

    expect(styleWithApiBaseUrl(style, "http://localhost:8010")).toEqual({
      version: 8,
      sources: {
        grabmaptiles: {
          type: "vector",
          tiles: ["http://localhost:8010/api/map/tiles/v2/vector/karta-v3/{z}/{x}/{y}.pbf"]
        },
        other: {
          type: "vector",
          tiles: ["https://example.test/tiles/{z}/{x}/{y}.pbf"]
        }
      },
      layers: []
    });
  });
});
