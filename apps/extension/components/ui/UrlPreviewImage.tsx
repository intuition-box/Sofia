import { useUrlPreviewAsync } from "@0xsofia/design-system"
import { useState } from "react"

import { getFaviconUrl } from "~/lib/utils"

/**
 * UrlPreviewImage — the extension's media element for FeedCardView's
 * `renderMedia` slot. Resolves an OpenGraph hero image via the shared
 * `useUrlPreviewAsync` hook (Spotify/Vimeo/SoundCloud oEmbed → universal OG
 * proxy), and falls back to the site favicon on a white pad when no OG image
 * is available (or it fails to load). The OG proxy base comes from
 * `PLASMO_PUBLIC_OG_PROXY_URL`; when unset, only the favicon shows.
 *
 * `className` is supplied by the design-system card (`fc-media-img` for the
 * hero, `fc-xs-thumb-img` for the xs thumb) and carries the positioning/fit
 * contract; the inline `object-fit` here intentionally overrides the DS
 * default (favicons want `contain`, OG images `cover`).
 */
const OG_PROXY_URL = process.env.PLASMO_PUBLIC_OG_PROXY_URL

interface UrlPreviewImageProps {
  url?: string
  domain?: string
  className?: string
  alt?: string
  /** `card` = full-bleed hero (lg/md/sm), `thumb` = compact xs thumbnail.
   *  Drives the favicon padding so the fallback icon stays legible at both
   *  sizes. */
  variant?: "card" | "thumb"
}

const UrlPreviewImage = ({
  url,
  domain,
  className,
  alt,
  variant = "card"
}: UrlPreviewImageProps) => {
  const [ogFailed, setOgFailed] = useState(false)
  const { data: og } = useUrlPreviewAsync(url, OG_PROXY_URL)

  if (og?.url && !ogFailed) {
    return (
      <img
        src={og.url}
        alt={alt || domain || ""}
        className={className}
        style={{ objectFit: "cover" }}
        referrerPolicy="no-referrer"
        onError={() => setOgFailed(true)}
      />
    )
  }

  // Favicon fallback — centered on a white pad so dark/light icons stay visible.
  const favicon = domain
    ? getFaviconUrl(domain, 128)
    : url
      ? getFaviconUrl(url, 128)
      : ""
  if (!favicon) return null

  return (
    <img
      src={favicon}
      alt={alt || domain || ""}
      className={className}
      style={{
        objectFit: "contain",
        padding: variant === "thumb" ? "8px" : "16px",
        background: "#fff"
      }}
      onError={(e) => {
        ;(e.target as HTMLImageElement).style.display = "none"
      }}
    />
  )
}

export default UrlPreviewImage
