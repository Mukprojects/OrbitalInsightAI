// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    PASSWORD: '/auth/password',
  },
  
  // Satellites
  SATELLITES: {
    BASE: '/satellites',
    SEARCH: '/satellites/search/query',
    STATS: '/satellites/stats/overview',
    TRACK: (id: string) => `/satellites/${id}/track`,
    POSITIONS: (id: string) => `/satellites/${id}/positions`,
    USER_TRACKED: '/satellites/user/tracked',
  },
  
  // Space Weather
  WEATHER: {
    CURRENT: '/weather/current',
    HISTORY: '/weather/history',
    STATS: '/weather/stats',
    ALERTS: '/weather/alerts',
    FORECAST: '/weather/forecast',
  },
  
  // Debris
  DEBRIS: {
    BASE: '/debris',
    SEARCH: '/debris/search/query',
    STATS: '/debris/stats/overview',
    DECAYS: '/debris/decays/upcoming',
    RISKS: '/debris/risks/collisions',
    POSITIONS: (id: string) => `/debris/${id}/positions`,
  },
  
  // Launches
  LAUNCHES: {
    BASE: '/launches',
    SEARCH: '/launches/search/query',
    STATS: '/launches/stats/overview',
    UPCOMING: '/launches/upcoming/next',
    RECENT: '/launches/recent/completed',
  },
  
  // Alerts
  ALERTS: {
    BASE: '/alerts',
    STATS: '/alerts/stats/overview',
    CRITICAL: '/alerts/critical/recent',
    READ_ALL: '/alerts/read/all',
    BULK_DELETE: '/alerts/bulk/delete',
    READ: (id: string) => `/alerts/${id}/read`,
    UNREAD: (id: string) => `/alerts/${id}/unread`,
  },
  
  // Analytics
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    SATELLITES: '/analytics/satellites',
    RISKS: '/analytics/risks',
    WEATHER: '/analytics/weather',
    ENGAGEMENT: '/analytics/engagement',
    PERFORMANCE: '/analytics/performance',
  },
  
  // Users
  USERS: {
    PREFERENCES: '/users/preferences',
    DASHBOARD: '/users/dashboard',
    SESSIONS: '/users/sessions',
    ADMIN: {
      USERS: '/users/admin/users',
      STATS: '/users/admin/stats',
      STATUS: (id: string) => `/users/admin/users/${id}/status`,
      ROLE: (id: string) => `/users/admin/users/${id}/role`,
    },
  },
};

export default API_CONFIG;