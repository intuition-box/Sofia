/**
 * Types simplifiés pour les données d'historique SOFIA
 * Capture uniquement les données essentielles selon spécifications
 */

// Données DOM capturées par le content script
export interface DOMData {
  title: string;              // document.title → Titre de la page
  keywords: string;           // <meta name="keywords"> → Mots-clés SEO
  description: string;        // <meta name="description"> → Description SEO
  ogType: string;            // <meta property="og:type"> → Type de contenu
  h1: string;                // <h1> → Titre principal visible
  url: string;               // URL de la page
  timestamp: number;         // Date/heure de capture
  hasScrolled: boolean;      // Indique si l'utilisateur a scrollé sur la page
}

// Données d'historique Chrome simplifiées
export interface SimplifiedHistoryEntry {
  url: string;                // Adresse complète visitée
  lastVisitTime: number;     // Dernière date de visite (depuis Chrome API)
  visitCount: number;        // Nombre total de visites (depuis Chrome API)  
  timestamp: number;         // Date/heure de l'événement au moment de la capture
  duration?: number;         // Temps passé sur la page (calculé automatiquement)
}

// Données combinées DOM + Historique pour une visite complète
export interface CompleteVisitData {
  domData: DOMData;
  historyData: SimplifiedHistoryEntry;
  capturedAt: number;        // Timestamp de capture combinée
}

// Messages pour communication Chrome Runtime
export interface ChromeMessage {
  type: 'dom-data-captured' | 'visit-started' | 'visit-ended' | 'get-history' | 'clear-data';
  data?: DOMData | SimplifiedHistoryEntry | CompleteVisitData;
  url?: string;
}

// Réponses Chrome Runtime
export interface ChromeResponse {
  success: boolean;
  data?: SimplifiedHistoryEntry[] | CompleteVisitData[];
  error?: string;
}
