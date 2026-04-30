/**
 * Types for SOFIA history tracking system
 */

// Session data for tracking user engagement (used by VisitData)
export interface SessionData {
  timestamp: number;
  duration: number;
  scrollEvents: number;
}

// Visit data with session tracking
export interface VisitData {
  url: string;
  title: string;
  keywords: string;
  description: string;
  ogType: string;
  h1: string;
  visitCount: number;
  lastVisitTime: number;
  firstVisitTime: number;
  totalDuration: number;
  sessions: SessionData[];
  behaviors?: {
    type: string;
    label?: string;
    duration?: number;
    timestamp: number;
  }[];
}
