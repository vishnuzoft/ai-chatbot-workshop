# AI Chatbot

A chat application built with Next.js, React, and Tailwind CSS. It connects to a conversational backend using Server-Sent Events (SSE) to stream responses in real-time.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set your backend endpoint in `.env.local`:

```env
BACKEND_CHAT_API_URL=https://your-agent-backend-url/api/agent/chat
NEXT_PUBLIC_CHAT_API_URL=/api/chat
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```text
├── app/
│   ├── api/chat/route.ts   # Server-side proxy route for backend streaming
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles
│   └── page.tsx            # Main chat interface and state management
├── components/
│   ├── ChatHeader.tsx      # Top navigation and controls
│   ├── ChatInput.tsx       # Message input and send controls
│   ├── ChatMessage.tsx     # Message item with formatting
│   └── Sidebar.tsx         # Conversation history and session navigation
├── services/
│   └── chatService.ts      # SSE stream consumer and parser
└── types/
    └── chat.ts             # Message and session type definitions
```

## How It Works

- The frontend sends chat messages to `/api/chat`.
- The Next.js API route (`app/api/chat/route.ts`) proxies the request to the backend agent server, avoiding cross-origin (CORS) issues in the browser.
- `services/chatService.ts` reads the incoming `ReadableStream` chunk-by-chunk using `TextDecoder`, parses the SSE stream, and updates the chat UI as tokens arrive.
