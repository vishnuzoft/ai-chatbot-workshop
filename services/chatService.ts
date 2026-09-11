export interface StreamChatOptions {
  message: string;
  sessionId?: string | null;
  apiUrl?: string;
  signal?: AbortSignal;
  onToken: (token: string) => void;
  onSessionId?: (sessionId: string) => void;
}

/**
 * Sends user message to backend and streams the response.
 *
 * TODO (Workshop Task):
 * Implement this function to:
 * 1. Send a POST request to `apiUrl` with `Accept: text/event-stream`.
 * 2. Get the stream reader (`response.body.getReader()`) and `TextDecoder`.
 * 3. Read chunks in a `while (true)` loop.
 * 4. Parse incoming SSE frames (`event: delta` and `data: {"content": "..."}`).
 * 5. Invoke `onToken(token)` for each incoming text piece.
 */
export async function streamAgentChat({
  message,
  sessionId = null,
  apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL!,
  signal,
  onToken,
  onSessionId,
}: StreamChatOptions): Promise<string> {
  // TODO: Implement the streaming fetch and reader loop here

  return "";
}
