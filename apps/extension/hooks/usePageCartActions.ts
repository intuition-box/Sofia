/**
 * usePageCartActions — what a user queues for one page, on its market:
 * Recommend (support) / Distrust (oppose), the intention tags (`intent:*`)
 * and the topic tags of the queued Recommend. The cart is the single source
 * of truth. Shared by the Page tab and the Echoes URL rows.
 */
import { intentionTagBySlug, isIntentionTagSlug } from "@0xsofia/taxonomy"
import { useCallback, useMemo, useState } from "react"

import { PAGE_MARKET_PREDICATE } from "~/lib/config/predicateConstants"
import { getFaviconUrl } from "~/lib/utils"
import type { IntentionPurpose } from "~/types/discovery"
import type { IntentionType } from "~/types/intentionCategories"

import { useCart } from "./useCart"

export function usePageCartActions(
  url: string | null,
  title: string | null,
  /** Fired when something was added (e.g. the Page tab's burst animation) */
  onAdded?: () => void
) {
  const cart = useCart()
  // Topic tags picked before anything is queued
  const [draftTopics, setDraftTopics] = useState<string[]>([])

  const recommendItem = useMemo(
    () =>
      cart.items.find(
        (item) =>
          item.url === url &&
          item.predicateName === PAGE_MARKET_PREDICATE &&
          item.side !== "oppose" &&
          !item.voteAction
      ) ?? null,
    [cart.items, url]
  )
  const distrustItem = useMemo(
    () =>
      cart.items.find(
        (item) =>
          item.url === url &&
          item.predicateName === PAGE_MARKET_PREDICATE &&
          item.side === "oppose"
      ) ?? null,
    [cart.items, url]
  )
  const pageItems = useMemo(
    () => (url ? cart.items.filter((item) => item.url === url) : []),
    [cart.items, url]
  )

  /** Queue (or un-queue) Recommend, with the chosen tags */
  const toggleRecommend = useCallback(
    async (extraTags: string[] = []) => {
      if (!url) return
      if (recommendItem && extraTags.length === 0) {
        await cart.removeFromCart(recommendItem.id)
        return
      }
      const added = await cart.addToCart(
        url,
        title,
        PAGE_MARKET_PREDICATE,
        null,
        getFaviconUrl(url, 128),
        [...draftTopics, ...extraTags]
      )
      if (added) onAdded?.()
    },
    [url, title, cart, draftTopics, recommendItem, onAdded]
  )

  /** Queue (or un-queue) Distrust — the oppose side of the same market */
  const toggleDistrust = useCallback(async () => {
    if (!url) return
    if (distrustItem) {
      await cart.removeFromCart(distrustItem.id)
      return
    }
    const added = await cart.addToCart(
      url,
      title,
      "distrust",
      null,
      getFaviconUrl(url, 128)
    )
    if (added) onAdded?.()
  }, [url, title, cart, distrustItem, onAdded])

  /** An intention is a tag on the Recommend (queued first if needed) */
  const toggleIntention = useCallback(
    (purpose: IntentionPurpose) => {
      const slug = `intent:${purpose.replace(/^for_/, "")}`
      if (!intentionTagBySlug(slug)) return
      if (!recommendItem) {
        void toggleRecommend([slug])
        return
      }
      const tags = recommendItem.interestContexts ?? []
      void cart.setItemContexts(
        recommendItem.id,
        tags.includes(slug) ? tags.filter((t) => t !== slug) : [...tags, slug]
      )
    },
    [recommendItem, toggleRecommend, cart]
  )

  /** Intention tags on the queued Recommend, as purposes (`for_work`) */
  const intentions = useMemo<IntentionPurpose[]>(
    () =>
      (recommendItem?.interestContexts ?? [])
        .filter(isIntentionTagSlug)
        .map(
          (slug) =>
            `for_${intentionTagBySlug(slug)!.key as IntentionType}` as IntentionPurpose
        ),
    [recommendItem]
  )

  /** Topic tags: the queued Recommend's, else the draft */
  const topics = useMemo(
    () =>
      recommendItem
        ? (recommendItem.interestContexts ?? []).filter(
            (slug) => !isIntentionTagSlug(slug)
          )
        : draftTopics,
    [recommendItem, draftTopics]
  )

  /** Replace the topic tags — they ride on a Recommend (queued if needed) */
  const setTopics = useCallback(
    (slugs: string[]) => {
      setDraftTopics(slugs)
      if (!url) return
      void cart.updateContextForUrl(url, slugs)
      if (slugs.length > 0 && !recommendItem) {
        void cart
          .addToCart(
            url,
            title,
            PAGE_MARKET_PREDICATE,
            null,
            getFaviconUrl(url, 128),
            slugs
          )
          .then((added) => {
            if (added) onAdded?.()
          })
      }
    },
    [url, title, cart, recommendItem, onAdded]
  )

  return {
    recommendItem,
    distrustItem,
    pageItems,
    toggleRecommend,
    toggleDistrust,
    toggleIntention,
    intentions,
    topics,
    setTopics
  }
}
