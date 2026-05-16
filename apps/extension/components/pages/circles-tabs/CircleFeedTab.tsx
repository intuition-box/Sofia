import { VerbTag } from "@0xsofia/design-system"
import {
  useFindUserPositionsOnTriplesQuery,
  useGetPerspectiveCertsQuery,
  useGetTrustCirclePositionsQuery,
  type GetPerspectiveCertsQuery,
  type GetTrustCirclePositionsQuery
} from "@0xsofia/graphql"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { getAddress } from "viem"

import { useCart, useIntentionCategories, useWalletFromStorage } from "~/hooks"
import { PREDICATE_IDS, SUBJECT_IDS } from "~/lib/config/constants"
import { batchResolveEns, createHookLogger, getFaviconUrl } from "~/lib/utils"
import type { IntentionType } from "~/types/intentionCategories"
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType
} from "~/types/intentionCategories"

import { useRouter } from "../../layout/RouterProvider"
import Avatar from "../../ui/Avatar"
import CategoryCard from "../../ui/CategoryCard"
import CategoryDetailView from "../../ui/CategoryDetailView"
import SofiaLoader from "../../ui/SofiaLoader"

import "../../styles/CircleFeedTab.css"
import "../../styles/CategoryStyles.css"

const logger = createHookLogger("CircleFeedTab")

// Pagination convention shared with the explorer's perspectiveService:
// loop the indexer 1000 rows at a time until a short page comes back,
// hard-capped at 50 pages (50k rows) so a runaway query can't spin.
const PAGE_SIZE = 1000
const MAX_PAGES = 50

// Predicate labels that count as a "certification" — identical set to
// the explorer's `PERSPECTIVE_PREDICATE_LABELS`. Trust/distrust are
// intentionally excluded: those are people-to-people signals, not URL
// claims. Label-based (not id-based) so Music + Buying are included.
const PERSPECTIVE_PREDICATE_LABELS: string[] = [
  "visits for work",
  "visits for learning",
  "visits for learning ", // legacy trailing-space variant
  "visits for fun",
  "visits for inspiration",
  "visits for buying",
  "visits for music"
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
  const [filtersExpanded, setFiltersExpanded] = useState(false)
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
          intentions: [item]
        })
      }
    }

    return [...groups.values()]
  }, [feedItems])

  // Filter grouped items by active category
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return groupedItems
    return groupedItems.filter((group) =>
      group.intentions.some((i) => i.intentionType === activeFilter)
    )
  }, [groupedItems, activeFilter])

  // Step 4: Check user's existing positions on feed triples (support/oppose state)
  const allTripleIds = useMemo(() => {
    const ids = feedItems.map((item) => item.tripleTermId).filter(Boolean)
    return [...new Set(ids)]
  }, [feedItems])

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

  // Build map: itemId → 'support' | 'oppose' (from on-chain + local votes)
  const [localVotes, setLocalVotes] = useState(
    () => new Map<string, "support" | "oppose">()
  )

  const votedItems = useMemo(() => {
    const map = new Map<string, "support" | "oppose">()

    // On-chain positions (support on term vault, oppose on counter_term vault)
    if (userPositionsData?.triples) {
      for (const triple of userPositionsData.triples) {
        const hasSupport = triple.positions?.some(
          (p) => p.shares && BigInt(p.shares) > 0n
        )
        const hasOppose = triple.counter_term?.vaults?.some((v) =>
          v.positions?.some((p) => p.shares && BigInt(p.shares) > 0n)
        )

        const feedItem = feedItems.find(
          (item) => item.tripleTermId === triple.term_id
        )
        if (feedItem) {
          if (hasSupport) map.set(feedItem.id, "support")
          else if (hasOppose) map.set(feedItem.id, "oppose")
        }
      }
    }

    // Merge local votes (override on-chain if just voted)
    for (const [id, vote] of localVotes) {
      map.set(id, vote)
    }

    return map
  }, [userPositionsData, feedItems, localVotes])

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

  // Intention picker state (shown when a grouped card has multiple intentions)
  const [intentionPickerGroup, setIntentionPickerGroup] =
    useState<GroupedFeedItem | null>(null)
  const [intentionPickerAction, setIntentionPickerAction] = useState<
    "Support" | "Oppose"
  >("Support")

  const addVoteToCartFromItem = (
    item: CircleFeedItem,
    action: "Support" | "Oppose"
  ) => {
    const voteAction =
      action === "Support" ? ("support" as const) : ("oppose" as const)
    const vaultId =
      action === "Support" ? item.tripleTermId : item.counterTermId
    if (!vaultId) return

    // addVoteToCart expects an IntentionPurpose (for_work, for_learning, …),
    // not an IntentionType (which also covers trusted/distrusted votes that
    // have no purpose). Map via INTENTION_CONFIG so trusted/distrusted resolve
    // to null instead of failing the cart contract.
    const intentionType = predicateLabelToIntentionType(item.triplePredicate)
    const purpose = intentionType
      ? INTENTION_CONFIG[intentionType].intentionPurpose
      : null
    addVoteToCart(
      item.pageUrl,
      item.pageLabel,
      item.triplePredicate,
      purpose,
      getFaviconUrl(item.domain, 64),
      voteAction,
      vaultId
    ).then((added) => {
      if (added) {
        // Track local vote state for UI feedback
        setLocalVotes((prev) => new Map(prev).set(item.id, voteAction))
      }
    })
  }

  const handleSupport = (e: React.MouseEvent, group: GroupedFeedItem) => {
    e.stopPropagation()
    if (!address) return
    if (group.intentions.length === 1) {
      addVoteToCartFromItem(group.intentions[0], "Support")
    } else {
      setIntentionPickerGroup(group)
      setIntentionPickerAction("Support")
    }
  }

  const handleOppose = (e: React.MouseEvent, group: GroupedFeedItem) => {
    e.stopPropagation()
    if (!address) return
    if (group.intentions.length === 1) {
      addVoteToCartFromItem(group.intentions[0], "Oppose")
    } else {
      setIntentionPickerGroup(group)
      setIntentionPickerAction("Oppose")
    }
  }

  const handleIntentionPick = (item: CircleFeedItem) => {
    addVoteToCartFromItem(item, intentionPickerAction)
    setIntentionPickerGroup(null)
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
        {(() => {
          const intentionEntries = Object.entries(INTENTION_CONFIG) as [
            IntentionType,
            { label: string; color: string }
          ][]
          const visibleEntries = filtersExpanded
            ? intentionEntries
            : intentionEntries.slice(0, 3)
          const hiddenCount = intentionEntries.length - visibleEntries.length
          return (
            <div className="circle-category-chips">
              <button
                className={`circle-chip ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}>
                All
              </button>
              {visibleEntries.map(([type, config]) => (
                <button
                  key={type}
                  className={`circle-chip ${activeFilter === type ? "active" : ""}`}
                  onClick={() => setActiveFilter(type)}>
                  <span
                    className="circle-chip-dot"
                    aria-hidden="true"
                    style={{ background: config.color }}
                  />
                  {config.label}
                </button>
              ))}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  className="circle-chip circle-chip-more"
                  onClick={() => setFiltersExpanded(true)}>
                  +{hiddenCount} more
                </button>
              )}
              {filtersExpanded && intentionEntries.length > 3 && (
                <button
                  type="button"
                  className="circle-chip circle-chip-more"
                  onClick={() => setFiltersExpanded(false)}>
                  Show less
                </button>
              )}
            </div>
          )
        })()}
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
                {/* Header: favicon + badges */}
                <div className="circle-card-header">
                  <img
                    src={getFaviconUrl(group.domain, 64)}
                    alt=""
                    className="circle-card-favicon"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                  <div className="circle-intention-badges">
                    {group.intentions.map((intention) => (
                      <VerbTag
                        key={intention.intentionType}
                        intent={intention.intentionType}
                        label={INTENTION_CONFIG[intention.intentionType].label}
                      />
                    ))}
                  </div>
                </div>

                {/* Page title */}
                <div className="circle-card-title">{group.pageLabel}</div>

                {/* Footer: member + votes + time */}
                <div className="circle-card-footer">
                  <span
                    className="circle-card-member-name"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMemberClick(
                        group.memberAddress,
                        group.memberLabel,
                        group.memberImage
                      )
                    }}>
                    {group.memberLabel}
                  </span>
                  {group.intentions.some((i) => i.tripleTermId) &&
                    (() => {
                      const hasSupported = group.intentions.some(
                        (i) => votedItems.get(i.id) === "support"
                      )
                      const hasOpposed = group.intentions.some(
                        (i) => votedItems.get(i.id) === "oppose"
                      )
                      const inCartSupport = group.intentions.some((i) =>
                        isVoteInCart(i.pageUrl, i.triplePredicate, "support")
                      )
                      const inCartOppose = group.intentions.some((i) =>
                        isVoteInCart(i.pageUrl, i.triplePredicate, "oppose")
                      )
                      // Disable if already voted the opposite on-chain or in cart
                      const supportDisabled = hasOpposed || inCartOppose
                      const opposeDisabled =
                        hasSupported ||
                        inCartSupport ||
                        !group.intentions.some((i) => i.counterTermId)

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
                  <span className="circle-card-time">
                    {formatTimestamp(group.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Intention picker overlay (when card has multiple intentions) — portaled to body */}
      {intentionPickerGroup &&
        createPortal(
          <div
            className="circle-picker-overlay"
            onClick={() => setIntentionPickerGroup(null)}>
            <div
              className="circle-picker-modal"
              onClick={(e) => e.stopPropagation()}>
              <div className="circle-picker-title">
                {intentionPickerAction} which intention?
              </div>
              <div className="circle-picker-options">
                {intentionPickerGroup.intentions.map((intention) => {
                  const config = INTENTION_CONFIG[intention.intentionType]
                  const isDisabled =
                    intentionPickerAction === "Oppose" &&
                    !intention.counterTermId
                  return (
                    <button
                      key={intention.intentionType}
                      className="circle-picker-option"
                      style={
                        {
                          "--picker-color": config.color
                        } as React.CSSProperties
                      }
                      disabled={isDisabled}
                      onClick={() => handleIntentionPick(intention)}>
                      <span
                        className="circle-intention-badge"
                        style={{
                          backgroundColor: `${config.color}20`,
                          color: config.color
                        }}>
                        {config.label}
                      </span>
                      <span className="circle-picker-label">
                        {intentionPickerGroup.pageLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default CircleFeedTab
