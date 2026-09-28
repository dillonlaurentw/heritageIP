import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Server-only. The key is read from ANTHROPIC_API_KEY and never reaches the browser.
let client: Anthropic | null = null;

export function anthropic() {
  client ??= new Anthropic({ timeout: 120_000, maxRetries: 2 });
  return client;
}
