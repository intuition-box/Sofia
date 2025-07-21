import { HistoryManager } from "~lib/history";
import { handlePageData, handlePageDuration } from "./history";
import { handleBehaviorData } from "./behavior";
import { connectToMetamask, getMetamaskConnection } from "./metamask";
import type { ChromeMessage } from "./types";

export function setupMessageHandlers(historyManager: HistoryManager): void {
  chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'TEST_MESSAGE':
        break;

      case 'PAGE_DATA':
        handlePageData(message.data, message.pageLoadTime || Date.now(), historyManager);
        break;

      case 'PAGE_DURATION':
        handlePageDuration(message.data, historyManager);
        break;

      case 'SCROLL_DATA':
        historyManager.recordScrollEvent(message.data.url);
        break;

      case 'BEHAVIOR_DATA':
        handleBehaviorData(message.data, historyManager);
        break;

      case 'CONNECT_TO_METAMASK':
        connectToMetamask()
          .then(result => {
            chrome.runtime.sendMessage({
              type: 'METAMASK_RESULT',
              data: result
            }).catch(() => {
              console.log('Background: Impossible d\'envoyer le résultat MetaMask');
            });
          })
          .catch(error => {
            console.error('Background: Erreur de connexion MetaMask:', error);
            chrome.runtime.sendMessage({
              type: 'METAMASK_RESULT',
              data: {
                success: false,
                error: error.message
              }
            }).catch(() => {
              console.log('Background: Impossible d\'envoyer l\'erreur MetaMask');
            });
          });
        break;

      case 'GET_METAMASK_ACCOUNT':
        const connection = getMetamaskConnection();
        if (connection?.account) {
          sendResponse({
            success: true,
            account: connection.account,
            chainId: connection.chainId
          });
        } else {
          sendResponse({
            success: false,
            error: 'Aucune connexion MetaMask trouvée'
          });
        }
        break;

      case 'GET_TRACKING_STATS':
        try {
          const globalStats = historyManager.getGlobalStats();
          const recentVisits = historyManager.getRecentVisits(5);

          sendResponse({
            success: true,
            data: {
              totalPages: globalStats.totalUrls,
              totalVisits: globalStats.totalVisits,
              totalTime: globalStats.totalTimeSpent,
              mostVisitedUrl: globalStats.mostVisitedUrl,
              recentVisits
            }
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: 'Erreur lors du chargement des statistiques'
          });
        }
        break;

      case 'EXPORT_TRACKING_DATA':
        try {
          const data = historyManager.exportHistory();
          sendResponse({
            success: true,
            data
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: 'Erreur lors de l\'export'
          });
        }
        break;

      case 'CLEAR_TRACKING_DATA':
        historyManager.clearAll().then(() => {
          sendResponse({
            success: true
          });
        }).catch((error) => {
          sendResponse({
            success: false,
            error: 'Erreur lors du nettoyage'
          });
        });
        return true;
    }

    sendResponse({ success: true });
    return true;
  });
}