import type { ErrorRequestHandler } from "express";
import { NotFoundError, ValidationError } from "../utils/errors";

/**
 * Express recognises an error handler by it having FOUR parameters (err, req, res, next),
 * so `_next` must stay in the signature even though we never call it.
 * It must also be registered LAST, after all routes.
 */
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next
) => {
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  // express.json() throws a SyntaxError when the body isn't valid JSON.
  // Without this branch the client would get an HTML error page instead of JSON.
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: "Request body is not valid JSON" });
    return;
  }

  // express.json() refuses bodies over its limit (100kb by default). A big file upload makes this
  // a normal thing to happen, so it deserves a clear answer rather than a 500.
  if (error instanceof Error && error.name === "PayloadTooLargeError") {
    res.status(413).json({ error: "Request body is too large" });
    return;
  }

  // Anything else is a bug or an outage (e.g. the database dropped).
  // Log the details for us, but send the client a generic message: internal errors can leak
  // information (stack traces, query details) that we don't want to expose.
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
