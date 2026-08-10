import { BaseEntity } from './common';

export type AiModelProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'custom';

export interface AiModel {
  id: string;
  name: string;
  provider: AiModelProvider;
  contextWindow: number;
  costPer1kTokens: number;
  isStreamingSupported: boolean;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage extends BaseEntity {
  sessionId: string;
  role: ChatRole;
  content: string;
  tokensUsed?: number;
  modelUsed?: string;
}

export interface PromptTemplate extends BaseEntity {
  title: string;
  description: string;
  category: 'coding' | 'writing' | 'marketing' | 'analysis' | 'creative';
  promptText: string;
  variables: string[];
  isPublic: boolean;
}
