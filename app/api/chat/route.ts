import { NextRequest } from "next/server";

const TARGET_BACKEND_URL = process.env.BACKEND_CHAT_API_URL;

export async function POST(req: NextRequest) {
  if (!TARGET_BACKEND_URL) {
    return new Response("BACKEND_CHAT_API_URL environment variable is not configured in .env.local", {
      status: 500,
    });
  }

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
