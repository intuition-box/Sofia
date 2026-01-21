import type { PlasmoMessage } from "~types/messaging";

export type RawMessage = {
  text: string;
  thought?: string;
  actions?: string[];
};

export interface MessageData {
  type:
  | "PAGE_DATA"
  | "PAGE_DURATION"
  | "SCROLL_DATA"
  | "TEST_MESSAGE"
  | "GET_TRACKING_STATS"
  | "EXPORT_TRACKING_DATA"
  | "CLEAR_TRACKING_DATA"
  | "CONNECT_TO_METAMASK"
  | "GET_METAMASK_ACCOUNT"
  | "METAMASK_RESULT"
  | "AGENT_RESPONSE"
  | "GET_TAB_ID"
  | "GET_BOOKMARKS"
  | "GET_HISTORY"
  | "STORE_BOOKMARK_TRIPLETS"
  | "CONNECT_DISCORD"
  | "CONNECT_X"
  | "STORE_DETECTED_TRIPLETS"
  | "UPDATE_ECHO_BADGE" 
  | "TRIPLET_PUBLISHED"
  | "TRIPLETS_DELETED"
  | "INITIALIZE_BADGE"
  | "START_PULSE_ANALYSIS";
  data: any;
  pageLoadTime?: number;
  tabId?: number;
  text?: string;
  timestamp?: number;
  clientId?: string;
}


export interface PageData {
  url: string;
  title?: string;
  keywords?: string;
  description?: string;
  ogType?: string;
  h1?: string;
  hasScrolled?: boolean;
  timestamp: number;
  duration?: number; 
  tabId?: number;
  attentionScore? :number
}

export interface PageStats {
  visitCount: number;
  totalDuration: number;
}

export type ChromeMessage = MessageData | PlasmoMessage;
