/**
 * Message passing types for Chrome extension communication
 * Background script, content script, and popup communication
 */

import type { DOMData, SimplifiedHistoryEntry, CompleteVisitData } from './history';

// Chrome runtime messages
export interface ChromeMessage {
  type: 'dom-data-captured' | 'visit-started' | 'visit-ended' | 'get-history' | 'clear-data' | 'open_sidepanel';
  data?: DOMData | SimplifiedHistoryEntry | CompleteVisitData;
  url?: string;
}

// Chrome runtime responses
export interface ChromeResponse {
  success: boolean;
  data?: SimplifiedHistoryEntry[] | CompleteVisitData[];
  error?: string;
}

// Extended message types for plasmo environment
export interface PlasmoMessage {
  type: 'GET_TAB_ID' | 'PAGE_DATA' | 'PAGE_DURATION' | 'SCROLL_DATA' | 'TEST_MESSAGE' | 'CONNECT_TO_METAMASK' | 'GET_METAMASK_ACCOUNT' | 'START_PULSE_ANALYSIS';
  data: {
    title?: string;
    keywords?: string;
    description?: string;
    ogType?: string;
    h1?: string;
    url?: string;
    timestamp?: number;
    duration?: number;
  };
  pageLoadTime?: number;
}

// Console display data for debugging
export interface ConsoleDisplayData {
  title: string;
  keywords: string;
  description: string;
  ogType: string;
  h1: string;
  url: string;
  lastVisitTime: string;
  visitCount: number;
  timestamp: string;
  duration: string;
  scrollActivity: string;
}