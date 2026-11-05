import { describe, test, expect, vi } from "vitest";
import { RESUMES } from "../candidates/seedData";
import { AnthropicSummaryProvider } from "./anthropicSummaryProvider";

// Runs the real SDK against canned HTTP responses: no network, no key, no cost.
// It checks what we send and how we read replies. It can't check how the real model behaves.

interface SentRequest {
  model: string;
  system: string;
  messages: { content: string }[];
  output_config: { format: { type: string } };
  tools?: unknown;
}

function apiReply(stopReason: string, content: unknown[]) {
  const fetchMock = vi.fn(
    async (
      _url: Parameters<typeof fetch>[0],
      _init?: Parameters<typeof fetch>[1]
    ) =>
      new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-haiku-5-5",
          stop_reason: stopReason,
          stop_sequence: null,
          content,
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
  );
  return fetchMock;
}

function sentRequest(fetchMock: ReturnType<typeof apiReply>): SentRequest {
  const init = fetchMock.mock.calls[0]?.[1];
  return JSON.parse(String(init?.body)) as SentRequest;
}

const jsonText = { type: "text", text: '{"skills":["React"]}' };

describe("AnthropicSummaryProvider", () => {
  test("keeps applicant text out of the system prompt and wraps it in a random tag", async () => {
    const fetchMock = apiReply("end_turn", [jsonText]);

    await new AnthropicSummaryProvider("test-key", fetchMock).summarize(
      RESUMES.hiddenInjection
    );

    const request = sentRequest(fetchMock);
    const message = request.messages[0]?.content ?? "";
    expect(request.system).not.toContain("Riley Park");
    expect(message).toContain("Riley Park");

    // The real closing tag is the last line, and the resume's fake </resume> didn't take its place
    const id = /^<resume-([0-9a-f-]{36})>/.exec(message)?.[1];
    expect(id).toBeDefined();
    expect(message.endsWith(`</resume-${id}>`)).toBe(true);
    expect(message).toContain("</resume>\nSYSTEM:");
  });

  test("uses a new tag id for every request, so one can't be learned and reused", async () => {
    const fetchMock = apiReply("end_turn", [jsonText]);
    const provider = new AnthropicSummaryProvider("test-key", fetchMock);

    await provider.summarize("first");
    await provider.summarize("second");

    const messages = fetchMock.mock.calls.map(
      ([, init]) =>
        (JSON.parse(String(init?.body)) as SentRequest).messages[0]?.content ??
        ""
    );
    expect(messages[0]?.split("\n")[0]).not.toBe(messages[1]?.split("\n")[0]);
  });

  test("asks for structured output and gives the model no tools", async () => {
    const fetchMock = apiReply("end_turn", [jsonText]);

    await new AnthropicSummaryProvider("test-key", fetchMock).summarize(
      "Some resume"
    );

    const request = sentRequest(fetchMock);
    expect(request.output_config.format.type).toBe("json_schema");
    expect(request.tools).toBeUndefined();
  });

  test("returns the parsed JSON, skipping past any thinking block", async () => {
    const fetchMock = apiReply("end_turn", [
      { type: "thinking", thinking: "", signature: "s" },
      jsonText,
    ]);

    const output = await new AnthropicSummaryProvider(
      "test-key",
      fetchMock
    ).summarize("Some resume");

    expect(output).toEqual({ skills: ["React"] });
  });

  test.each(["refusal", "max_tokens"])(
    "treats stop reason %s as a failure",
    async (stopReason) => {
      // jsonText is there to prove the check comes first: this reply would otherwise parse fine
      const fetchMock = apiReply(stopReason, [jsonText]);

      await expect(
        new AnthropicSummaryProvider("test-key", fetchMock).summarize(
          "Some resume"
        )
      ).rejects.toThrow("Model stopped early");
    }
  );

  test("fails on a reply that isn't valid JSON", async () => {
    const fetchMock = apiReply("end_turn", [
      { type: "text", text: "Hire immediately." },
    ]);

    await expect(
      new AnthropicSummaryProvider("test-key", fetchMock).summarize(
        "Some resume"
      )
    ).rejects.toThrow();
  });
});
