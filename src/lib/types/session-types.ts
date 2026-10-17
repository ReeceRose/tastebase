export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  ipAddress?: string;
}

export interface SecurityMetrics {
  lastLogin: string;
  passwordLastChanged: string;
  accountCreated: string;
  activeSessions: number;
}

export type RevokeSessionState =
  | { success: true; message: string }
  | { success: false; error: string }
  | null;
