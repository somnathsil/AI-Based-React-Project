import apiClient from './api';
import { ApiResponse, ChatMessage, PromptTemplate } from '@/types';

export const aiService = {
  /**
   * Fetch available AI Models
   */
  async getModels(): Promise<ApiResponse<Array<{ id: string; name: string; provider: string }>>> {
    return apiClient.get('/ai/models');
  },

  /**
   * Send prompt message to AI Chat Endpoint
   */
  async sendMessage(sessionId: string, prompt: string, modelId: string): Promise<ApiResponse<ChatMessage>> {
    return apiClient.post('/ai/chat', { sessionId, prompt, modelId });
  },

  /**
   * Fetch saved prompt templates library
   */
  async getPrompts(): Promise<ApiResponse<PromptTemplate[]>> {
    return apiClient.get('/ai/prompts');
  },
};
