import { VerbTag } from "@0xsofia/design-system"
import {
  useFindUserPositionsOnTriplesQuery,
  useGetPerspectiveCertsQuery,
  useGetTrustCirclePositionsQuery,
  type GetPerspectiveCertsQuery,
  type GetTrustCirclePositionsQuery
} from "@0xsofia/graphql"
import { resolveContextAtom } from "@0xsofia/taxonomy"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getAddress } from "viem"

import {
  getCertificationForUrl,
  useCart,
  useIntentionCategories,
  useUserCertifications,
  useWalletFromStorage
} from "~/hooks"
import { intuitionGraphqlClient } from "~/lib/clients/graphql-client"
import {
  TOPIC_FILTER_OPTIONS,
  VERB_FILTER_OPTIONS
} from "~/lib/config/filterOptions"
import { PREDICATE_IDS, SUBJECT_IDS } from "~/lib/config/constants"
import { batchResolveEns, createHookLogger, getFaviconUrl } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"
import type { IntentionType } from "~/types/intentionCategories"
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType
} from "~/types/intentionCategories"

import { useRouter } from "../../layout/RouterProvider"
import Avatar from "../../ui/Avatar"
import CategoryCard from "../../ui/CategoryCard"
import CategoryDetailView from "../../ui/CategoryDetailView"
import ContextPills from "../../ui/ContextPills"
import FilterDropdown from "../../ui/FilterDropdown"
import SofiaLoader from "../../ui/SofiaLoader"

import "../../styles/CircleFeedTab.css"
import "../../styles/CategoryStyles.css"

const logger = createHookLogger("CircleFeedTab")

// Pagination convention shared with the explorer's perspectiveService:
// loop the indexer 1000 rows at a time until a short page comes back,
// hard-capped at 50 pages (50k rows) so a runaway query can't spin.
const PAGE_SIZE = 1000
const MAX_PAGES = 50

// Predicate labels that count as circle activity — kept identical to the
// explorer's circle feed (sofiaFeedService / circleService) so the two show
// the same data. Includes trusts/distrust: in Sofia those are staked on
// pages/URLs too (e.g. "trusts <site>"), so they belong in the feed.
const PERSPECTIVE_PREDICATE_LABELS: string[] = [
  "visits for work",
  "visits for learning",
  "visits for learning ", // legacy trailing-space variant
  "visits for fun",
  "visits for inspiration",
  "visits for buying",
  "visits for music",
  "trusts",
  "distrust"
]

// Extract domain from URL
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

// Format relative time
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface CircleFeedItem {
  id: string
  tripleTermId: string
  counterTermId: string
  intentionType: IntentionType
  tripleSubject: string
  triplePredicate: string
  tripleObject: string
  pageLabel: string
  pageUrl: string
  domain: string
  memberAddress: string
  memberLabel: string
  memberImage: string
  createdAt: string
}

// A stakeable "in context of" triple nested under a cert. Voting fans out
// across these (explorer parity) — `supportTermId`/`opposeTermId` are the
// context triple's own term_id / counter_term_id, NOT the cert triple's.
interface FeedContext {
  slug: string
  supportTermId: string
  opposeTermId: string
  // Source cert predicate/purpose — kept so the cart item passes the
  // known-predicate check and displays sensibly while depositing on the
  // context vault.
  predicate: string
  purpose: IntentionPurpose | null
}

interface GroupedFeedItem {
  groupKey: string
  pageLabel: string
  pageUrl: string
  domain: string
  memberAddress: string
  memberLabel: string
  memberImage: string
  createdAt: string
  intentions: CircleFeedItem[]
  // Context triples across all the group's intention certs (deduped by
  // vault). Empty → the card falls back to voting the cert triple.
  contexts: FeedContext[]
  // Unique topic/category slugs for the context pills.
  contextSlugs: string[]
}

type ViewState =
  | { type: "feed" }
  | { type: "member-profile"; address: string; label: string; image?: string }
  | { type: "member-category"; address: string; label: string; image?: string }

interface CircleFeedTabProps {
  onViewMembers?: () => void
}

const CircleFeedTab = ({ onViewMembers }: CircleFeedTabProps = {}) => {
  const { navigateTo } = useRouter()
  const { walletAddress: address } = useWalletFromStorage()
  const [activeFilter, setActiveFilter] = useState<"all" | IntentionType>("all")
  const [topicFilter, setTopicFilter] = useState<string>("all")

  // On-chain "in context of" topics — same source the explorer feed and
  // EchoesTab use, so the Verb + Topic filters stay coherent everywhere.
  const { certifications } = useUserCertifications(address)
  const [viewState, setViewState] = useState<ViewState>({ type: "feed" })
  const [feedItems, setFeedItems] = useState<CircleFeedItem[]>([])
  const [trustedWallets, setTrustedWallets] = useState<string[]>([])
  const [walletToLabel, setWalletToLabel] = useState(
    () => new Map<string, string>()
  )
  const [walletToImage, setWalletToImage] = useState(
    () => new Map<string, string>()
  )

  const checksumAddress = address ? getAddress(address) : ""

  // Step 1: Get followed accounts.
  //
  // `GetTrustCirclePositions` has `$offset` but no `$limit` — the
  // indexer's default page cap silently truncated big trust circles to
  // the first page, so members past it never produced feed rows. We now
  // page by offset (same PAGE_SIZE / MAX_PAGES convention as Step 2)
  // until a short page comes back, accumulating every member triple.
  const [trustCircleLoading, setTrustCircleLoading] = useState(false)
  const [trustCircleFetching, setTrustCircleFetching] = useState(false)

  const refetchTrustCircle = useCallback(async () => {
    if (!checksumAddress) {
      setTrustedWallets([])
      setTrustCircleLoading(false)
      setTrustCircleFetching(false)
      return
    }
    setTrustCircleFetching(true)
    setTrustCircleLoading((prev) => prev || trustedWallets.length === 0)

    const rawTriples: NonNullable<GetTrustCirclePositionsQuery["triples"]> = []
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = await useGetTrustCirclePositionsQuery.fetcher({
          subjectId: SUBJECT_IDS.I,
          predicateId: PREDICATE_IDS.TRUSTS,
          addresses: checksumAddress,
          offset: page * PAGE_SIZE,
          positionsOrderBy: [{ shares: "desc" }]
        })()
        const rows = data?.triples ?? []
        rawTriples.push(...rows)
        if (rows.length < PAGE_SIZE) break
      }
    } catch (err) {
      // Keep whatever member pages already loaded — partial circle is
      // far better than blanking the feed entirely.
      logger.error("Trust circle pagination failed", err)
    }

    const wallets: string[] = []
    const labelMap = new Map<string, string>()
    const imageMap = new Map<string, string>()

    for (const triple of rawTriples) {
      // Only include if user has positive shares (not untrusted)
      const hasPositiveShares = triple.term?.vaults?.some((v) =>
        v.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)
      )
      if (!hasPositiveShares) continue

      const accounts = triple.object?.accounts || []
      const label = triple.object?.label || ""

      for (const account of accounts) {
        if (account?.id) {
          try {
            // Indexer matches account ids in EIP-55 checksum case;
            // keep a lowercase mirror for the client-side filter.
            const checksumWallet = getAddress(account.id)
            wallets.push(checksumWallet)
            wallets.push(checksumWallet.toLowerCase())
            labelMap.set(
              checksumWallet.toLowerCase(),
              account.label || label || checksumWallet
            )
            if (account.image) {
              imageMap.set(checksumWallet.toLowerCase(), account.image)
            }
          } catch {
            continue
          }
        }
      }
    }

    setTrustedWallets([...new Set(wallets)])
    setWalletToLabel(labelMap)
    setWalletToImage(imageMap)
    setTrustCircleLoading(false)
    setTrustCircleFetching(false)

    // Batch-resolve ENS names + avatars for wallets with raw address labels
    const addressesToResolve = [...labelMap.entries()]
      .filter(
        ([, label]) => !label || label.startsWith("0x") || label.includes("...")
      )
      .map(([wallet]) => wallet)

    if (addressesToResolve.length > 0) {
      batchResolveEns(addressesToResolve).then((ensResults) => {
        for (const [addr, ens] of ensResults) {
          if (ens.name) labelMap.set(addr, ens.name)
          if (ens.avatar) imageMap.set(addr, ens.avatar)
        }
        setWalletToLabel(new Map(labelMap))
        setWalletToImage(new Map(imageMap))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checksumAddress])

  useEffect(() => {
    refetchTrustCircle()
  }, [refetchTrustCircle])

  // Step 2: Get ALL certifications from trusted wallets — triples, not
  // events.
  //
  // This is the same data path the explorer uses
  // (`perspectiveService.fetchPerspectiveCertifications` →
  // `GetPerspectiveCerts`): query the `visits_for_*` cert triples
  // directly, filtered to triples where one of our trusted wallets holds
  // shares > 0. The old `GetSofiaTrustedActivity` events query routed
  // through the Sofia proxy and structurally missed every non-proxy /
  // out-of-filter certification — that whole code path is gone.
  //
  // Paginated 1000 rows at a time (PAGE_SIZE / MAX_PAGES) with
  // incremental display: each page is mapped and pushed into feedItems
  // immediately so the feed paints progressively and is never blank
  // while later pages stream in. A failed page keeps everything already
  // loaded.
  const [rawCertTriples, setRawCertTriples] = useState<
    NonNullable<GetPerspectiveCertsQuery["triples"]>
  >([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsFetching, setEventsFetching] = useState(false)

  const refetchEvents = useCallback(async () => {
    if (trustedWallets.length === 0) {
      setRawCertTriples([])
      setEventsLoading(false)
      setEventsFetching(false)
      return
    }

    // Indexer stores account ids in EIP-55 checksum case; a lowercase
    // `_in` filter silently matches nothing. Checksum the list before
    // the network call (the trustedWallets state already carries a
    // lowercase mirror used by the client-side certifier filter below).
    const checksumWallets: string[] = []
    for (const w of trustedWallets) {
      try {
        checksumWallets.push(getAddress(w))
      } catch {
        // Skip the lowercase mirror entries / bad ids — getAddress
        // throws on a non-checksum string. Deduped right after.
      }
    }
    const uniqueChecksum = [...new Set(checksumWallets)]
    if (uniqueChecksum.length === 0) {
      setRawCertTriples([])
      setEventsLoading(false)
      setEventsFetching(false)
      return
    }

    setEventsFetching(true)
    setEventsLoading((prev) => prev || rawCertTriples.length === 0)

    const acc: NonNullable<GetPerspectiveCertsQuery["triples"]> = []
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = await useGetPerspectiveCertsQuery.fetcher({
          wallets: uniqueChecksum,
          predicateLabels: PERSPECTIVE_PREDICATE_LABELS,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE
        })()
        const rows = data?.triples ?? []
        acc.push(...rows)
        // Incremental display: paint each page as it lands so the feed
        // grows in front of the user and is never blank. A heavy later
        // page must never wipe what's already shown.
        setRawCertTriples([...acc])
        setEventsLoading(false)
        if (rows.length < PAGE_SIZE) break
      }
    } catch (err) {
      // Keep whatever pages already loaded instead of wiping the feed.
      logger.error("Perspective certs pagination failed", err)
      if (acc.length > 0) setRawCertTriples([...acc])
    } finally {
      setEventsLoading(false)
      setEventsFetching(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trustedWallets])

  useEffect(() => {
    refetchEvents()
  }, [refetchEvents])

  // Step 3: Map cert triples → feed items.
  //
  // A triple can carry several certifiers (one position row per trusted
  // wallet that staked on it) — emit one CircleFeedItem per (triple,
  // certifier) so the existing `pageUrl::memberAddress` grouping keeps
  // working and every member's mark is attributed. Kept separate from
  // the fetch so ENS label/avatar resolution re-maps the labels without
  // re-hitting the network.
  useEffect(() => {
    if (rawCertTriples.length === 0) {
      setFeedItems([])
      return
    }

    const lowerWalletSet = new Set(trustedWallets.map((w) => w.toLowerCase()))
    const items: CircleFeedItem[] = []

    for (const triple of rawCertTriples) {
      const predicateLabel = triple.predicate?.label
      if (!predicateLabel) continue

      const intentionType = predicateLabelToIntentionType(predicateLabel)
      if (!intentionType) continue

      const obj = triple.object
      const pageLabel = obj?.label || ""
      const pageUrl =
        obj?.value?.thing?.url ||
        (pageLabel.startsWith("http") ? pageLabel : `https://${pageLabel}`)
      const domain = getDomain(pageUrl)
      const tripleTermId = triple.term_id || ""
      const counterTermId = triple.counter_term_id || ""
      const createdAt = triple.created_at ? String(triple.created_at) : ""

      // positions are already server-filtered to "shares > 0" for our
      // wallet set; every account_id here is a relevant certifier.
      for (const position of triple.positions ?? []) {
        const memberAddress = position.account_id
        if (!memberAddress) continue
        const addrKey = memberAddress.toLowerCase()
        if (!lowerWalletSet.has(addrKey)) continue

        items.push({
          id: `${tripleTermId}::${addrKey}`,
          tripleTermId,
          counterTermId,
          intentionType,
          tripleSubject: "I",
          triplePredicate: predicateLabel,
          tripleObject: pageLabel,
          pageLabel: pageLabel || domain,
          pageUrl,
          domain,
          memberAddress,
          memberLabel: walletToLabel.get(addrKey) || memberAddress,
          memberImage: walletToImage.get(addrKey) || "",
          createdAt
        })
      }
    }

    setFeedItems(items)
  }, [rawCertTriples, trustedWallets, walletToLabel, walletToImage])

  // Step 3b: Fetch the "in context of" triples nested under each cert.
  //
  // The explorer's circle feed votes on these context triples (one stakeable
  // triple per topic/category the cert was tagged with), not on the cert
  // triple itself. We query every cert term_id at once, then map each
  // context triple back to its cert so a card can fan a vote out across all
  // its contexts. Same paginated convention as the cert fetch.
  const [contextsByCert, setContextsByCert] = useState(
    () => new Map<string, FeedContext[]>()
  )

  useEffect(() => {
    if (rawCertTriples.length === 0) {
      setContextsByCert(new Map())
      return
    }

    // certTermId → its predicate/purpose, so a context vote can carry a
    // known predicate for the cart while depositing on the context vault.
    const certMeta = new Map<
      string,
      { predicate: string; purpose: IntentionPurpose | null }
    >()
    for (const triple of rawCertTriples) {
      const termId = triple.term_id
      const predicate = triple.predicate?.label
      if (!termId || !predicate) continue
      const intentionType = predicateLabelToIntentionType(predicate)
      certMeta.set(termId, {
        predicate,
        purpose: intentionType
          ? INTENTION_CONFIG[intentionType].intentionPurpose
          : null
      })
    }

    const certTermIds = [...certMeta.keys()]
    if (certTermIds.length === 0) {
      setContextsByCert(new Map())
      return
    }

    const CONTEXT_QUERY = `
      query GetFeedContextTriples(
        $subjectTermIds: [String!]!
        $limit: Int!
        $offset: Int!
      ) {
        triples(
          where: {
            subject_id: { _in: $subjectTermIds }
            predicate: { label: { _eq: "in context of" } }
          }
          limit: $limit
          offset: $offset
          order_by: { term_id: asc }
        ) {
          term_id
          counter_term_id
          subject_id
          object { term_id }
        }
      }
    `

    interface ContextRow {
      term_id?: string
      counter_term_id?: string
      subject_id?: string
      object?: { term_id?: string }
    }

    let cancelled = false

    const run = async () => {
      const rows: ContextRow[] = []
      try {
        for (let page = 0; page < MAX_PAGES; page++) {
          const data = (await intuitionGraphqlClient.request(CONTEXT_QUERY, {
            subjectTermIds: certTermIds,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE
          })) as { triples?: ContextRow[] }
          const pageRows = data?.triples ?? []
          rows.push(...pageRows)
          if (pageRows.length < PAGE_SIZE) break
        }
      } catch (err) {
        logger.error("Feed context triples fetch failed", err)
      }
      if (cancelled) return

      const map = new Map<string, FeedContext[]>()
      for (const row of rows) {
        const certTermId = row.subject_id
        const supportTermId = row.term_id
        const objectTermId = row.object?.term_id
        if (!certTermId || !supportTermId || !objectTermId) continue

        const node = resolveContextAtom(objectTermId)
        if (!node?.slug) continue

        const meta = certMeta.get(certTermId)
        if (!meta) continue

        const ctx: FeedContext = {
          slug: node.slug,
          supportTermId,
          opposeTermId: row.counter_term_id ?? "",
          predicate: meta.predicate,
          purpose: meta.purpose
        }
        const list = map.get(certTermId)
        if (list) list.push(ctx)
        else map.set(certTermId, [ctx])
      }
      setContextsByCert(map)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [rawCertTriples])

  // Group feed items by pageUrl + memberAddress to avoid duplicate cards
  const groupedItems = useMemo(() => {
    const groups = new Map<string, GroupedFeedItem>()

    for (const item of feedItems) {
      const key = `${item.pageUrl}::${item.memberAddress.toLowerCase()}`
      const existing = groups.get(key)

      if (existing) {
        // Only add if this intention type isn't already present
        if (
          !existing.intentions.some(
            (i) => i.intentionType === item.intentionType
          )
        ) {
          existing.intentions.push(item)
        }
        // Keep the most recent createdAt
        if (item.createdAt > existing.createdAt) {
          existing.createdAt = item.createdAt
        }
      } else {
        groups.set(key, {
          groupKey: key,
          pageLabel: item.pageLabel,
          pageUrl: item.pageUrl,
          domain: item.domain,
          memberAddress: item.memberAddress,
          memberLabel: item.memberLabel,
          memberImage: item.memberImage,
          createdAt: item.createdAt,
          intentions: [item],
          contexts: [],
          contextSlugs: []
        })
      }
    }

    // Attach the context triples for each group by unioning the contexts of
    // all its intention certs (deduped by support vault — distinct certs
    // produce distinct context triples, so this only collapses exact repeats).
    for (const group of groups.values()) {
      const contexts: FeedContext[] = []
      const seenVaults = new Set<string>()
      for (const intention of group.intentions) {
        for (const ctx of contextsByCert.get(intention.tripleTermId) ?? []) {
          if (seenVaults.has(ctx.supportTermId)) continue
          seenVaults.add(ctx.supportTermId)
          contexts.push(ctx)
        }
      }
      group.contexts = contexts
      group.contextSlugs = [...new Set(contexts.map((c) => c.slug))]
    }

    // Most recent first (the query returns term_id order, not chronological),
    // so the newest circle activity surfaces at the top like the explorer.
    return [...groups.values()].sort((a, b) => {
      const ta = Date.parse(a.createdAt)
      const tb = Date.parse(b.createdAt)
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
      if (Number.isNaN(ta)) return 1
      if (Number.isNaN(tb)) return -1
      return tb - ta
    })
  }, [feedItems, contextsByCert])

  // Filter grouped items by verb (intention type) then by topic. Topic now
  // keeps groups whose own cert contexts carry the selected slug (the card's
  // real "in context of" tags), falling back to the viewer's certifications
  // for cards whose contexts haven't loaded yet.
  const filteredItems = useMemo(() => {
    let result = groupedItems
    if (activeFilter !== "all") {
      result = result.filter((group) =>
        group.intentions.some((i) => i.intentionType === activeFilter)
      )
    }
    if (topicFilter !== "all") {
      result = result.filter((group) => {
        if (group.contextSlugs.length > 0) {
          return group.contextSlugs.includes(topicFilter)
        }
        const entry = getCertificationForUrl(certifications, group.pageUrl)
        return entry?.interestContexts?.includes(topicFilter) ?? false
      })
    }
    return result
  }, [groupedItems, activeFilter, topicFilter, certifications])

  // Step 4: Check the user's existing positions on the feed's stakeable
  // triples. We query both the cert term_ids (fallback cards) and every
  // context support term_id, and map each back to its group so a thumb
  // lights when the user already staked on any of a card's contexts.
  const { allTripleIds, termIdToGroupKey } = useMemo(() => {
    const ids = new Set<string>()
    const toGroup = new Map<string, string>()
    for (const group of groupedItems) {
      if (group.contexts.length > 0) {
        for (const ctx of group.contexts) {
          if (!ctx.supportTermId) continue
          ids.add(ctx.supportTermId)
          toGroup.set(ctx.supportTermId, group.groupKey)
        }
      } else {
        for (const intention of group.intentions) {
          if (!intention.tripleTermId) continue
          ids.add(intention.tripleTermId)
          toGroup.set(intention.tripleTermId, group.groupKey)
        }
      }
    }
    return { allTripleIds: [...ids], termIdToGroupKey: toGroup }
  }, [groupedItems])

  const { data: userPositionsData } = useFindUserPositionsOnTriplesQuery(
    {
      termIds: allTripleIds,
      addresses: checksumAddress,
      limit: 500
    },
    {
      enabled: allTripleIds.length > 0 && !!checksumAddress,
      refetchOnWindowFocus: false
    }
  )

  // Build map: groupKey → 'support' | 'oppose' (from on-chain + local votes)
  const [localVotes, setLocalVotes] = useState(
    () => new Map<string, "support" | "oppose">()
  )

  const votedItems = useMemo(() => {
    const map = new Map<string, "support" | "oppose">()

    // On-chain positions (support on term vault, oppose on counter_term vault)
    if (userPositionsData?.triples) {
      for (const triple of userPositionsData.triples) {
        const groupKey = termIdToGroupKey.get(triple.term_id ?? "")
        if (!groupKey) continue
        const hasSupport = triple.positions?.some(
          (p) => p.shares && BigInt(p.shares) > 0n
        )
        const hasOppose = triple.counter_term?.vaults?.some((v) =>
          v.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)
        )
        // Don't downgrade an already-recorded support to nothing if another
        // of the card's triples has no position.
        if (hasSupport) map.set(groupKey, "support")
        else if (hasOppose && !map.has(groupKey)) map.set(groupKey, "oppose")
      }
    }

    // Merge local votes (override on-chain if just voted)
    for (const [groupKey, vote] of localVotes) {
      map.set(groupKey, vote)
    }

    return map
  }, [userPositionsData, termIdToGroupKey, localVotes])

  // Member profile: use useIntentionCategories with member's wallet
  const memberWallet =
    viewState.type === "member-profile" || viewState.type === "member-category"
      ? viewState.address
      : undefined
  const {
    categories: memberCategories,
    selectedCategory: memberSelectedCategory,
    loading: memberCategoriesLoading,
    selectCategory: memberSelectCategory
  } = useIntentionCategories(memberWallet)

  // Cart-based vote system
  const { addVoteToCart, isVoteInCart } = useCart()

  // One-click vote (explorer parity) — no intention picker. A click fans the
  // vote out across every "in context of" triple of the card, depositing on
  // each context vault. Cards without contexts fall back to the cert triple
  // so older un-tagged marks stay votable.
  const addVotesToCart = (
    group: GroupedFeedItem,
    action: "Support" | "Oppose"
  ) => {
    const voteAction =
      action === "Support" ? ("support" as const) : ("oppose" as const)
    const favicon = getFaviconUrl(group.domain, 64)

    // (vaultId, predicate, purpose) tuples to add — one per context, or the
    // cert triples when the card has no contexts.
    const targets: {
      vaultId: string
      predicate: string
      purpose: IntentionPurpose | null
    }[] = []

    if (group.contexts.length > 0) {
      for (const ctx of group.contexts) {
        const vaultId =
          action === "Support" ? ctx.supportTermId : ctx.opposeTermId
        if (!vaultId) continue
        targets.push({
          vaultId,
          predicate: ctx.predicate,
          purpose: ctx.purpose
        })
      }
    } else {
      for (const item of group.intentions) {
        const vaultId =
          action === "Support" ? item.tripleTermId : item.counterTermId
        if (!vaultId) continue
        const intentionType = predicateLabelToIntentionType(
          item.triplePredicate
        )
        targets.push({
          vaultId,
          predicate: item.triplePredicate,
          purpose: intentionType
            ? INTENTION_CONFIG[intentionType].intentionPurpose
            : null
        })
      }
    }

    if (targets.length === 0) return

    Promise.all(
      targets.map((t) =>
        addVoteToCart(
          group.pageUrl,
          group.pageLabel,
          t.predicate,
          t.purpose,
          favicon,
          voteAction,
          t.vaultId
        )
      )
    ).then((results) => {
      if (results.some(Boolean)) {
        setLocalVotes((prev) =>
          new Map(prev).set(group.groupKey, voteAction)
        )
      }
    })
  }

  const handleSupport = (e: React.MouseEvent, group: GroupedFeedItem) => {
    e.stopPropagation()
    if (!address) return
    addVotesToCart(group, "Support")
  }

  const handleOppose = (e: React.MouseEvent, group: GroupedFeedItem) => {
    e.stopPropagation()
    if (!address) return
    addVotesToCart(group, "Oppose")
  }

  const loading = trustCircleLoading || eventsLoading
  const refreshing = trustCircleFetching || eventsFetching

  // Refresh feed data
  const handleRefresh = () => {
    refetchTrustCircle()
    refetchEvents()
  }

  // Handle member click
  const handleMemberClick = (
    memberAddress: string,
    memberLabel: string,
    memberImage?: string
  ) => {
    navigateTo("user-profile", {
      termId: "",
      label: memberLabel,
      image: memberImage,
      walletAddress: memberAddress,
      initialTab: "bookmarks"
    })
  }

  // Handle category click in member profile
  const handleMemberCategoryClick = (categoryId: IntentionType) => {
    if (viewState.type === "member-profile") {
      memberSelectCategory(categoryId)
      setViewState({ ...viewState, type: "member-category" })
    }
  }

  // Handle back
  const handleBack = () => {
    if (viewState.type === "member-category") {
      memberSelectCategory(null)
      setViewState({
        type: "member-profile",
        address: viewState.address,
        label: viewState.label,
        image: viewState.image
      })
    } else {
      setViewState({ type: "feed" })
    }
  }

  // No wallet
  if (!address) {
    return (
      <div className="circle-feed-tab">
        <div className="circle-empty">
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to see your Trust Circle's activity.</p>
        </div>
      </div>
    )
  }

  // Member category detail view
  if (viewState.type === "member-category" && memberSelectedCategory) {
    return (
      <div className="circle-feed-tab">
        <CategoryDetailView
          category={memberSelectedCategory}
          onBack={handleBack}
        />
      </div>
    )
  }

  // Member profile view
  if (viewState.type === "member-profile") {
    return (
      <div className="circle-feed-tab">
        <div className="circle-member-header">
          <button className="circle-back-btn" onClick={handleBack}>
            Back
          </button>
          <Avatar
            imgSrc={viewState.image}
            name={viewState.address}
            avatarClassName="circle-member-avatar"
            size="medium"
          />
          <h3 className="circle-member-name">{viewState.label}</h3>
        </div>

        {memberCategoriesLoading ? (
          <div className="circle-loading">
            <SofiaLoader size={150} />
          </div>
        ) : (
          <div className="circle-categories-grid">
            {memberCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => handleMemberCategoryClick(category.id)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Main feed view
  return (
    <div className="circle-feed-tab">
      {/* Members bar — clickable summary that opens the full members list */}
      {onViewMembers && trustedWallets.length > 0 && (
        <button
          type="button"
          className="circle-members-bar"
          onClick={onViewMembers}
          aria-label="View all trust circle members">
          <div className="circle-members-bar-stack" aria-hidden="true">
            {trustedWallets.slice(0, 4).map((wallet) => (
              <div key={wallet} className="circle-members-avatar-slot">
                <Avatar
                  imgSrc={walletToImage.get(wallet)}
                  name={walletToLabel.get(wallet) || wallet}
                  avatarClassName="circle-members-avatar"
                  size="small"
                />
              </div>
            ))}
          </div>
          <span className="circle-members-bar-count">
            {trustedWallets.length} member
            {trustedWallets.length === 1 ? "" : "s"}
          </span>
          <span className="circle-members-bar-cta">view all →</span>
        </button>
      )}

      {/* Header row: Filter label aligned with refresh action */}
      <div className="circle-top-bar">
        <div className="circle-top-header">
          <span className="circle-filter-label">Filter</span>
          <div className="circle-top-actions">
            <button
              className="circle-go-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh feed"
              aria-label="Refresh feed">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={
                  refreshing
                    ? { animation: "spin 0.8s linear infinite" }
                    : undefined
                }>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>
          </div>
        </div>
        {/* Verb + Topic filter dropdowns — same coherent system as
            EchoesTab / BookmarkTab and the explorer circles feed. Topic
            uses the on-chain "in context of" data from
            useUserCertifications. */}
        <div className="echoes-filter-row">
          <FilterDropdown
            label="Intention"
            value={activeFilter}
            onChange={(id) => setActiveFilter(id as "all" | IntentionType)}
            options={VERB_FILTER_OPTIONS}
          />
          <FilterDropdown
            label="Topics"
            value={topicFilter}
            onChange={setTopicFilter}
            options={TOPIC_FILTER_OPTIONS}
            wide
          />
        </div>
      </div>

      {/* Loading */}
      {loading && feedItems.length === 0 && (
        <div className="circle-loading">
          <SofiaLoader size={150} />
        </div>
      )}

      {/* Empty: no trust circle */}
      {!loading && trustedWallets.length === 0 && (
        <div className="circle-empty">
          <h3>No Trust Circle</h3>
          <p>Add people to your Trust Circle to see their discoveries.</p>
        </div>
      )}

      {/* Empty: no intention certifications */}
      {!loading && trustedWallets.length > 0 && feedItems.length === 0 && (
        <div className="circle-empty">
          <h3>No Marks Yet</h3>
          <p>Your circle hasn't Marked any pages yet.</p>
        </div>
      )}

      {/* Empty: no results for filter */}
      {!loading && feedItems.length > 0 && filteredItems.length === 0 && (
        <div className="circle-empty">
          <p>
            No {INTENTION_CONFIG[activeFilter as IntentionType]?.label || ""}{" "}
            Marks from your circle.
          </p>
        </div>
      )}

      {/* Feed grid */}
      {filteredItems.length > 0 && (
        <div className="circle-grid">
          {filteredItems.map((group) => {
            return (
              <div
                key={group.groupKey}
                className="circle-card"
                onClick={() =>
                  window.open(group.pageUrl, "_blank", "noopener,noreferrer")
                }>
                {/* Header: ENS avatar + name + date (explorer FeedCard look) */}
                <div className="circle-card-hd">
                  <button
                    type="button"
                    className="circle-card-member"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMemberClick(
                        group.memberAddress,
                        group.memberLabel,
                        group.memberImage
                      )
                    }}>
                    <Avatar
                      imgSrc={group.memberImage}
                      name={group.memberLabel}
                      avatarClassName="circle-card-avatar"
                      size="small"
                    />
                    <span className="circle-card-hd-id">
                      <span className="circle-card-handle">
                        {group.memberLabel}
                      </span>
                      <span className="circle-card-when">
                        {formatTimestamp(group.createdAt)}
                      </span>
                    </span>
                  </button>
                </div>

                {/* Middle: favicon + site name */}
                <div className="circle-card-mid">
                  <img
                    src={getFaviconUrl(group.domain, 64)}
                    alt=""
                    className="circle-card-favicon"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                  <span className="circle-card-title">{group.pageLabel}</span>
                </div>

                {/* Footer: context pills, then votes */}
                <div className="circle-card-footer">
                  <div className="circle-intention-badges">
                    {group.contextSlugs.length > 0 ? (
                      // Topic/category context pills — the triples a vote
                      // actually stakes on (explorer parity).
                      <ContextPills slugs={group.contextSlugs} />
                    ) : (
                      // No "in context of" tags yet → show the member's
                      // intention badges so the card isn't blank (these cards
                      // vote on the cert triple).
                      group.intentions.map((intention) => (
                        <VerbTag
                          key={intention.intentionType}
                          intent={intention.intentionType}
                          label={INTENTION_CONFIG[intention.intentionType].label}
                        />
                      ))
                    )}
                  </div>
                  {group.intentions.some((i) => i.tripleTermId) &&
                    (() => {
                      const groupVote = votedItems.get(group.groupKey)
                      const hasSupported = groupVote === "support"
                      const hasOpposed = groupVote === "oppose"
                      const inCartSupport = group.intentions.some((i) =>
                        isVoteInCart(i.pageUrl, i.triplePredicate, "support")
                      )
                      const inCartOppose = group.intentions.some((i) =>
                        isVoteInCart(i.pageUrl, i.triplePredicate, "oppose")
                      )
                      // Oppose needs an oppose vault: a context counter term
                      // (when tagged) or the cert counter term (fallback).
                      const canOppose =
                        group.contexts.length > 0
                          ? group.contexts.some((c) => c.opposeTermId)
                          : group.intentions.some((i) => i.counterTermId)
                      // Disable if already voted the opposite on-chain or in cart
                      const supportDisabled = hasOpposed || inCartOppose
                      const opposeDisabled =
                        hasSupported || inCartSupport || !canOppose

                      return (
                        <div className="circle-card-actions">
                          <button
                            className={`circle-action-btn circle-support-btn ${hasSupported || inCartSupport ? "voted" : ""}`}
                            onClick={(e) => handleSupport(e, group)}
                            disabled={supportDisabled}
                            title={
                              inCartSupport ? "In cart" : "Support this Mark"
                            }
                            aria-label="Support">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true">
                              <path d="M7 10v12" />
                              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L15 2c1.1 0 2 .9 2 2v1.88Z" />
                            </svg>
                          </button>
                          <button
                            className={`circle-action-btn circle-oppose-btn ${hasOpposed || inCartOppose ? "voted" : ""}`}
                            onClick={(e) => handleOppose(e, group)}
                            disabled={opposeDisabled}
                            title={
                              inCartOppose ? "In cart" : "Oppose this Mark"
                            }
                            aria-label="Oppose">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true">
                              <path d="M17 14V2" />
                              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L9 22c-1.1 0-2-.9-2-2v-1.88Z" />
                            </svg>
                          </button>
                        </div>
                      )
                    })()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CircleFeedTab
