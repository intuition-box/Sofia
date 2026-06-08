import {
  FeedCardView,
  type FeedCardTopic,
  type FeedCardVerb
} from "@0xsofia/design-system"
import { useFindUserPositionsOnTriplesQuery } from "@0xsofia/graphql"
import { useMemo, useState, type CSSProperties } from "react"
import { getAddress } from "viem"

import {
  getCertificationForUrl,
  useCart,
  useIntentionCategories,
  useUserCertifications,
  useWalletFromStorage
} from "~/hooks"
import {
  contextColor,
  contextIcon,
  contextLabel
} from "~/lib/config/contextDisplay"
import {
  TOPIC_FILTER_OPTIONS,
  VERB_FILTER_OPTIONS
} from "~/lib/config/filterOptions"
import { getFaviconUrl } from "~/lib/utils"
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
import FilterDropdown from "../../ui/FilterDropdown"
import SofiaLoader from "../../ui/SofiaLoader"
import UrlPreviewImage from "../../ui/UrlPreviewImage"
import type { FeedContext, GroupedFeedItem } from "./feedTypes"
import { useCircleFeed } from "./useCircleFeed"

import "../../styles/CircleFeedTab.css"
import "../../styles/CategoryStyles.css"

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

  const checksumAddress = address ? getAddress(address) : ""

  // The trust-circle → cert → feed-item → context data pipeline lives in the
  // hook so this component stays presentational (grouping + filtering +
  // voting + view routing).
  const {
    feedItems,
    trustedWallets,
    walletToLabel,
    walletToImage,
    contextsByCert,
    loading,
    refreshing,
    refresh
  } = useCircleFeed(checksumAddress)

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

  // Refresh feed data (re-runs the trust-circle + cert fetch in the hook)
  const handleRefresh = refresh

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
            const groupVote = votedItems.get(group.groupKey)
            const hasSupported = groupVote === "support"
            const hasOpposed = groupVote === "oppose"
            const inCartSupport = group.intentions.some((i) =>
              isVoteInCart(i.pageUrl, i.triplePredicate, "support")
            )
            const inCartOppose = group.intentions.some((i) =>
              isVoteInCart(i.pageUrl, i.triplePredicate, "oppose")
            )
            // Oppose needs an oppose vault: a context counter term (when
            // tagged) or the cert counter term (fallback).
            const canOppose =
              group.contexts.length > 0
                ? group.contexts.some((c) => c.opposeTermId)
                : group.intentions.some((i) => i.counterTermId)
            const hasVotableTriple = group.intentions.some((i) => i.tripleTermId)

            // Topic/category context pills — the triples a vote stakes on.
            const topics: FeedCardTopic[] = group.contextSlugs.flatMap(
              (slug) => {
                const label = contextLabel(slug)
                return label
                  ? [{ id: slug, label, color: contextColor(slug) }]
                  : []
              }
            )

            // No "in context of" tags yet → show the member's intention verbs
            // so the card isn't blank (these cards vote on the cert triple).
            const verbs: FeedCardVerb[] =
              group.contextSlugs.length > 0
                ? []
                : group.intentions.map((i) => ({
                    label: INTENTION_CONFIG[i.intentionType].label,
                    color: INTENTION_CONFIG[i.intentionType].color
                  }))

            return (
              <FeedCardView
                key={group.groupKey}
                size="sm"
                hideVoteCounts
                handle={group.memberLabel}
                avatarUrl={group.memberImage}
                handleSlot={
                  <span
                    className="fc-handle-link"
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMemberClick(
                        group.memberAddress,
                        group.memberLabel,
                        group.memberImage
                      )
                    }}>
                    {group.memberLabel}
                  </span>
                }
                when={formatTimestamp(group.createdAt)}
                title={group.pageLabel}
                url={group.pageUrl}
                domain={group.domain}
                verbs={verbs}
                topics={topics}
                up={0}
                down={0}
                userUp={hasSupported || inCartSupport}
                userDown={hasOpposed || inCartOppose}
                canUp={hasVotableTriple && !(hasOpposed || inCartOppose)}
                canDown={
                  hasVotableTriple &&
                  canOppose &&
                  !(hasSupported || inCartSupport)
                }
                onVote={
                  hasVotableTriple
                    ? (side) => {
                        if (!address) return
                        addVotesToCart(
                          group,
                          side === "support" ? "Support" : "Oppose"
                        )
                      }
                    : undefined
                }
                onOpen={() =>
                  window.open(group.pageUrl, "_blank", "noopener,noreferrer")
                }
                renderMedia={(ctx) => (
                  <UrlPreviewImage
                    url={ctx.url}
                    domain={ctx.domain}
                    className={ctx.className}
                    variant={ctx.variant}
                    alt={ctx.title}
                  />
                )}
                renderTopic={(t) => (
                  <span
                    className="sf-topic-pill"
                    style={{ "--pill-color": t.color } as CSSProperties}>
                    <span
                      className="material-symbols-outlined sf-topic-pill-glyph"
                      aria-hidden>
                      {contextIcon(t.id)}
                    </span>
                    {t.label}
                  </span>
                )}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CircleFeedTab
