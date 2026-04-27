import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince, safeNumber } from "./utils"

const BASE = "https://pub.orcid.org/v3.0"

export const fetchOrcidSignals: SignalFetcher = async (
  token,
  userId,
  ctx
): Promise<PlatformMetrics> => {
  // ORCID's token response includes the orcid iD as `orcid` — it is passed to the
  // fetcher via `userId`. Without it we cannot query the record.
  if (!userId) {
    throw new Error("ORCID iD (userId) is required to fetch metrics")
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  }

  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  const recordRes = await safeFetch(`${BASE}/${userId}/record`, headers)
  const record = await recordRes.json()

  const works = safeNumber(
    record["activities-summary"]?.works?.group?.length
  )
  const fundings = safeNumber(
    record["activities-summary"]?.fundings?.group?.length
  )
  const peerReviews = safeNumber(
    record["activities-summary"]?.["peer-reviews"]?.group?.length
  )
  const educations = safeNumber(
    record["activities-summary"]?.educations?.["affiliation-group"]?.length
  )
  const employments = safeNumber(
    record["activities-summary"]?.employments?.["affiliation-group"]?.length
  )

  const worksDetailed = await safe(
    async () => {
      const res = await safeFetch(`${BASE}/${userId}/works`, headers)
      const data = await res.json()
      return Array.isArray(data.group) ? data.group.length : 0
    },
    works,
    "orcid_works"
  )

  const createdMs = safeNumber(
    record.history?.["submission-date"]?.value
  )
  const anciennete = createdMs
    ? monthsSince(new Date(createdMs).toISOString())
    : 0

  return {
    works: worksDetailed,
    peer_reviews: peerReviews,
    fundings: fundings,
    educations: educations,
    employments: employments,
    anciennete_mois: anciennete,
    is_verified_email: record.history?.["verified-email"] ? 1 : 0,
    is_verified_primary_email: record.history?.["verified-primary-email"]
      ? 1
      : 0,
  }
}
