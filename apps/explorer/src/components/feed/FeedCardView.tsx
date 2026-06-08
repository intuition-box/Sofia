/**
 * FeedCardView (explorer adapter) — wraps the shared
 * `@0xsofia/design-system` FeedCardView, injecting the explorer's slots:
 *  - `renderMedia` → the OG `UrlPreview` (hero / xs thumb)
 *  - `renderTopic` → the explorer `TopicPill`
 *
 * The card layout + the lg/md/sm/xs size system live in the design system
 * now; this file only supplies the explorer-specific bits so every existing
 * call-site keeps importing `@/components/feed/FeedCardView` (default +
 * types) unchanged.
 */
import {
  FeedCardView as DSFeedCardView,
  type FeedCardViewProps,
  type FeedMediaContext,
  type FeedCardTopic,
} from '@0xsofia/design-system'
import { UrlPreview } from '@/components/UrlPreview'
import { TopicPill } from '@/components/profile/FeedPills'

export type {
  FeedCardSize,
  FeedCardVerb,
  FeedCardTopic,
  FeedMediaContext,
  FeedCardViewProps,
} from '@0xsofia/design-system'

function defaultRenderMedia(ctx: FeedMediaContext) {
  // UrlPreview owns the OG/thumb resolution (sync favicon → async OG proxy).
  // It always renders `variant="card"`; the DS-provided `className`
  // (`fc-media-img` for the hero, `fc-xs-thumb-img` for the xs thumb) carries
  // the right positioning/fit.
  return (
    <UrlPreview
      variant="card"
      url={ctx.url}
      domain={ctx.domain}
      className={ctx.className}
      alt={ctx.title || ctx.domain}
    />
  )
}

function defaultRenderTopic(t: FeedCardTopic) {
  return (
    <TopicPill
      topicId={t.glyphTopicId ?? t.id}
      color={t.color || 'var(--ds-muted)'}
      label={t.label}
    />
  )
}

export default function FeedCardView(props: FeedCardViewProps) {
  // Don't inject the OG media when the caller supplies its own `thumbnailSrc`
  // (WeightModal / ProfileDrawer pass a favicon/asset and must NOT trigger an
  // OG fetch). A caller-provided `renderMedia` always wins.
  const renderMedia =
    props.renderMedia ?? (props.thumbnailSrc ? undefined : defaultRenderMedia)
  return (
    <DSFeedCardView
      {...props}
      renderMedia={renderMedia}
      renderTopic={props.renderTopic ?? defaultRenderTopic}
    />
  )
}
