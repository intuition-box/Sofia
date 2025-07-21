import type { PlasmoMessage } from "~types/messaging";

export type RawMessage = {
  text: string;
  thought?: string;
  actions?: string[];
};

export type AgentMessagePayload = {
  channel_id: string;
  server_id: string;
  author_id: string;
  content: string;
  source_type: string;
  raw_message: RawMessage;
  metadata?: Record<string, any>;
};

export interface MessageData {
  type:
  | "PAGE_DATA"
  | "PAGE_DURATION"
  | "SCROLL_DATA"
  | "TEST_MESSAGE"
  | "BEHAVIOR_DATA"
  | "GET_TRACKING_STATS"
  | "EXPORT_TRACKING_DATA"
  | "CLEAR_TRACKING_DATA"
  | "CONNECT_TO_METAMASK"
  | "GET_METAMASK_ACCOUNT"
  | "METAMASK_RESULT"
  | "AGENT_RESPONSE";
  data: any;
  pageLoadTime?: number;
}

export interface BehaviorData {
  url: string;
  videoPlayed?: boolean;
  videoDuration?: number;
  audioPlayed?: boolean;
  audioDuration?: number;
  articleRead?: boolean;
  title?: string;
  readTime?: number;
  timestamp: number;
}

export interface BehaviorRecord {
  type: 'video' | 'audio' | 'article';
  label: string;
  duration: number;
  timestamp: number;
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
}

export interface PageStats {
  visitCount: number;
  totalDuration: number;
}

export type ChromeMessage = MessageData | PlasmoMessage;