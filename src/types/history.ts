export interface NavigationEntry {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: number;
  visitDuration?: number;
  category?: string;
  isPrivate?: boolean;
  referrer?: string;
  tabId?: number;
}

export interface HistoryData {
  entries: NavigationEntry[];
  totalVisits: number;
  lastUpdated: number;
  settings: HistorySettings;
  statistics: HistoryStatistics;
}

export interface HistorySettings {
  isTrackingEnabled: boolean;
  excludedDomains: string[];
  maxEntries: number;
  retentionDays: number;
  includePrivateMode: boolean;
}

export interface HistoryStatistics {
  topDomains: DomainStat[];
  dailyVisits: number;
  weeklyVisits: number;
  averageSessionTime: number;
  categoriesDistribution: CategoryStat[];
}

export interface DomainStat {
  domain: string;
  visits: number;
  totalTime: number;
  percentage: number;
}

export interface CategoryStat {
  category: string;
  visits: number;
  percentage: number;
}

export interface HistoryFilter {
  startDate?: number;
  endDate?: number;
  domain?: string;
  category?: string;
  minDuration?: number;
  searchQuery?: string;
}
