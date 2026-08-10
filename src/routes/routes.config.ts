export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  AI_CHAT: '/ai-chat',
  PROMPTS: '/prompts',
  HISTORY: '/history',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
} as const;

export type RouteKey = keyof typeof ROUTES;
