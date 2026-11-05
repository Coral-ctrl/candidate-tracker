export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = "NotFoundError";
  }
}

export class SummaryUnavailableError extends Error {
  constructor() {
    // Deliberately generic: the real cause is logged on the server, never sent to the client
    super("The AI summary is unavailable right now. Please try again.");
    this.name = "SummaryUnavailableError";
  }
}
