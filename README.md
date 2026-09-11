# AI Chatbot Workshop - 4th Year B.Tech Hands-on Lab 🚀

A modern, ChatGPT-like conversational web application built with **Next.js**, **Tailwind CSS**, and pure **Server-Sent Events (SSE)** streaming. Designed specifically for university hands-on workshops without relying on heavy external AI SDKs.

---

## 🎯 Workshop Objective

Students learn how real-world LLM and AI Agent streaming works over HTTP by consuming a streaming SSE backend using the standard **Web Streams API** (`fetch`, `ReadableStream`, and `TextDecoder`).

### 📡 Backend API Endpoint

```bash
curl -N -X POST "http://192.168.68.111:8070/api/agent/chat" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"What AI events are there?","session_id":null}'
```

- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: text/event-stream`
- **Request Body**:
  ```json
  {
    "message": "What AI events are there?",
    "session_id": null
  }
  ```
- **Response Format**: Chunks of Server-Sent Events (`data: ...\n\n`) streamed incrementally.

---

## 🛠️ Project Structure

```text
ai-chatbot-sample/
├── app/
│   ├── layout.tsx         # Root layout with dark mode
│   ├── globals.css        # Custom scrollbar & ChatGPT theme styling
│   └── page.tsx           # Main page orchestrating chat state & send button
├── components/
│   ├── Sidebar.tsx        # Chat sessions history & New Chat button
│   ├── ChatHeader.tsx     # Session ID badge, SSE inspector toggle & actions
│   ├── ChatMessage.tsx    # Message bubble with code blocks, avatars & copy
│   ├── ChatInput.tsx      # Auto-resizing input box with Send & Stop buttons
│   ├── EmptyState.tsx     # ChatGPT-like welcome screen & quick prompts
│   └── DebugConsole.tsx   # Live on-screen SSE Stream Inspector for learning
├── services/
│   └── chatService.ts     # Core SSE streaming consumer & decoder
├── types/
│   └── chat.ts            # Message, ChatSession, and Log types
├── public/                # Static assets
├── .env.local             # Backend API URL configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <YOUR_REPO_URL>
cd ai-chatbot-sample
npm install
```

### 2. Configure Backend URL
Check `.env.local`:
```env
NEXT_PUBLIC_CHAT_API_URL=http://192.168.68.111:8070/api/agent/chat
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧑‍💻 Student Hands-on Tasks

### Task 1: Inspect the Streaming Service
Open [`services/chatService.ts`](services/chatService.ts) to see how:
1. `fetch()` sends the POST request with `Accept: text/event-stream`.
2. `response.body.getReader()` gets the binary stream.
3. `TextDecoder` decodes incoming `Uint8Array` bytes into text chunks.
4. SSE lines (`data: ...`) are parsed and emitted to `onToken()` in real time.

### Task 2: Observe Live Logs
- Open your browser's Developer Tools (`F12` -> **Console**). Every chunk is logged with `[SSE RAW]` and `[SSE PARSED]`.
- Or click the **"SSE Logs"** button in the top header to view the live streaming frames right inside the application!

### Task 3: Challenge Exercise (For Students)
Try modifying [`app/page.tsx`](app/page.tsx) inside `handleSend()` to:
1. Add custom headers (e.g. auth token or student ID).
2. Format assistant code snippets with syntax highlighting.
3. Add a message character counter or prompt history navigation.

---

## 🎨 Features
- **ChatGPT-Style Layout**: Sleek dark aesthetic with collapsible sidebar and history.
- **Pure Native Streaming**: Zero dependencies on Vercel AI SDK — 100% native Web APIs.
- **Session Continuity**: Retains `session_id` across turns if returned by backend.
- **Stop Generation**: Uses `AbortController` to cancel ongoing streams instantly.
- **Starter Prompts**: Includes *"What AI events are there?"* for immediate one-click testing.
