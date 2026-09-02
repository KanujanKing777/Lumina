export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type ReflectionMode = 'reflect' | 'brainstorm' | 'summarize' | 'action_plan';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface InteractionEntry {
  id?: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  initialPrompt: string;
  messages: ChatMessage[];
  summary?: string;
  keyInsights?: string[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  modelUsed?: string;
}

export interface GeminiReflectRequest {
  prompt: string;
  history?: ChatMessage[];
  mode?: ReflectionMode;
  contextTitle?: string;
}

export interface GeminiReflectResponse {
  success: boolean;
  reply?: string;
  summary?: string;
  keyInsights?: string[];
  suggestedTags?: string[];
  modelUsed?: string;
  error?: string;
}
