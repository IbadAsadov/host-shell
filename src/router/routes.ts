// Route path constants — single source of truth for all navigation.
// Import here rather than hard-coding strings throughout the codebase.
export const ROUTES = {
  ROOT: "/",
  AUTH: {
    ROOT: "/auth",
    LOGIN: "/auth/login",
  },
  DASHBOARD: {
    ROOT: "/dashboard",
  },
  NOT_FOUND: "*",
} as const;
