export interface AuthUser {
  email: string;
  displayName: string;
  nicename: string;
}

export interface WpUser {
  id: number;
  username?: string;
  user_nicename?: string;
  /** Custom LMS API */
  display_name?: string;
  /** WordPress REST API alias */
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  url?: string;
  description?: string;
  link?: string;
  slug?: string;
  /** Custom profile picture URL (LMS API) */
  avatar?: string;
  avatar_urls?: Record<string, string>;
  meta?: Record<string, unknown>;
  roles?: string[];
}
