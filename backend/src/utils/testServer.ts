import type { Express } from "express";

/** Starts the app on a free port, runs `run` with its base URL, and ALWAYS shuts the server down. */
export async function withServer(
  app: Express,
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = app.listen(0); // port 0 = let the OS pick a free port
  try {
    const { port } = server.address() as { port: number };
    await run(`http://localhost:${port}`);
  } finally {
    server.close(); // runs even if an assertion inside `run` throws
  }
}
