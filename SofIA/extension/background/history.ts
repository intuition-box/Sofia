import { HistoryManager } from "~lib/history";


export async function handlePageDuration(data: any, historyManager: HistoryManager): Promise<void> {
  await historyManager.recordPageDuration(data.url, data.duration, data.timestamp);
}