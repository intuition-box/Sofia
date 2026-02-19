/**
 * Certification Helpers
 * Shared logic for certification type mappings and effective status resolution.
 * Extracted from GroupDetailView and useGroupOnChainCertifications.
 *
 * Related files:
 * - components/ui/GroupDetailView.tsx
 * - hooks/useGroupOnChainCertifications.ts
 */

import type { IntentionPurpose } from "~types/discovery"
import type { CertificationType } from "~/lib/services"
import type { GroupUrlRecord } from "~types/database"
import type { UrlCertificationStatus } from "~/hooks"

/** Map IntentionPurpose prefix to CertificationType */
export const intentionToCertification: Record<
  IntentionPurpose,
  CertificationType
> = {
  for_work: "work",
  for_learning: "learning",
  for_fun: "fun",
  for_inspiration: "inspiration",
  for_buying: "buying",
  for_music: "music"
}

/** Map trust predicate labels to certification type strings */
export const trustToCertification: Record<string, string> = {
  trusts: "trusted",
  distrust: "distrusted"
}

/**
 * Get effective certification status for a URL.
 * Pipeline 2 (useGroupOnChainCertifications) is preferred,
 * with Pipeline 1 (urlRecord.onChainCertification) as fallback.
 */
export function getEffectiveCertStatus(
  urlRecord: GroupUrlRecord,
  onChainStatus: UrlCertificationStatus | undefined
): { isCertified: boolean; labels: string[] } {
  if (onChainStatus?.isCertifiedOnChain) {
    return {
      isCertified: true,
      labels: onChainStatus.allCertificationLabels || []
    }
  }
  if (urlRecord.isOnChain && urlRecord.onChainCertification) {
    return {
      isCertified: true,
      labels: [urlRecord.onChainCertification]
    }
  }
  return { isCertified: false, labels: [] }
}
