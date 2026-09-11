import { NextRequest } from "next/server";

const TARGET_BACKEND_URL =
  process.env.BACKEND_CHAT_API_URL ||
  process.env.NEXT_PUBLIC_CHAT_API_URL ||
  "http://192.168.68.111:8070/api/agent/chat";

/**
 * Next.js Server Proxy Route: /api/chat
 *
 * Why this exists:
 * Browsers block client-side fetch from http://localhost:3000 to http://192.168.68.111:8070
 * due to CORS (Cross-Origin Resource Sharing) restrictions.
 *
 * This server-side route forwards requests server-to-server (like curl) and pipes
 * the SSE text/event-stream directly back to the client with zero CORS issues!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(TARGET_BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "");
      console.error(
        `[Next.js Proxy Error] Backend returned ${backendRes.status} ${backendRes.statusText}:`,
        errorText
      );
      return new Response(errorText || "Backend server error", {
        status: backendRes.status,
        statusText: backendRes.statusText,
      });
    }

    if (!backendRes.body) {
      return new Response("No response body received from backend", { status: 502 });
    }

    // Stream the backend SSE response directly to the browser
    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[Next.js Proxy Error] Failed to connect to backend:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to backend server",
        message: error.message,
        target: TARGET_BACKEND_URL,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
