import { describe, test, expect } from "vitest";
import { createApp } from "./app";

describe("GET /api/health", () => {
  test("reports database status from the injected dependency", async () => {
    // A fake dependency: no real database needed
    const app = createApp({ isDatabaseConnected: () => false });

    const server = app.listen(0); // port 0 = let the OS pick a free port
    const { port } = server.address() as { port: number };
    const response = await fetch(`http://localhost:${port}/api/health`);
    server.close();

    expect(await response.json()).toEqual({
      status: "ok",
      database: "disconnected",
    });
  });
});
