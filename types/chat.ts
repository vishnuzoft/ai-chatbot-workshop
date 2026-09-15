export interface ToolCallInfo {
  name: string;
  args?: any;
  state: 'running' | 'done';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  error?: boolean;
  toolCall?: ToolCallInfo;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  backendSessionId: string | null;
  createdAt: number;
  updatedAt: number;
}
