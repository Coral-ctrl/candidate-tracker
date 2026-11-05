// The ONLY file allowed to import the Anthropic SDK (see CLAUDE.md)
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildUserMessage,
  SUMMARY_JSON_SCHEMA,
  SYSTEM_PROMPT,
} from "./summary.prompt";
import type { SummaryProvider } from "./summary.types";

const MODEL = "claude-haiku-5-5"; // why Haiku: see ADR-003

export class AnthropicSummaryProvider implements SummaryProvider {
  private readonly client: Anthropic;

  // `fetchOverride` lets tests supply canned API responses, with no network and no cost
  constructor(apiKey: string, fetchOverride?: typeof fetch) {
    this.client = new Anthropic({
      apiKey,
      timeout: 20_000, // milliseconds. The default is 10 minutes, far too long for someone waiting on a page
      maxRetries: 1, // the SDK retries rate limits, server errors and timeouts by itself
      ...(fetchOverride ? { fetch: fetchOverride } : {}),
    });
  }

  async summarize(resumeText: string): Promise<unknown> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4096, // thinking counts towards this, so leave room beyond the short answer
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SUMMARY_JSON_SCHEMA },
      },
      // No `tools`: the worst a successful injection can do is produce misleading text
      messages: [
        { role: "user", content: buildUserMessage(resumeText, randomUUID()) },
      ],
    });

    // Check this before reading the content: a refusal or a cut-off reply may not match the schema
    if (response.stop_reason !== "end_turn") {
      throw new Error(`Model stopped early: ${response.stop_reason}`);
    }

    // content is a list of block types (thinking comes first), so find the text block
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock) {
      throw new Error("Model returned no text");
    }

    return JSON.parse(textBlock.text); // a parse failure is caught by the service like any other failure
  }
}
