import { useState, useCallback } from "react"
import xIcon from "../ui/social/x.svg"
import { createHookLogger } from "~/lib/utils"

const logger = createHookLogger("ShareCertificationButton")
const OG_BASE_URL = "https://sofia-og.vercel.app"

interface ShareCertificationButtonProps {
  pageUrl: string
  pageTitle: string | null
  userStatus: "Pioneer" | "Explorer" | "Contributor" | null
  userRank: number | null
  totalPositions: number
  disabled?: boolean
}

const ShareCertificationButton = ({
  pageUrl,
  pageTitle,
  userStatus,
  userRank,
  totalPositions,
  disabled = false
}: ShareCertificationButtonProps) => {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = useCallback(async () => {
    if (isSharing || disabled || !userStatus) return

    const win = window.open("about:blank", "_blank")

    setIsSharing(true)
    try {
      const res = await fetch(
        `${OG_BASE_URL}/api/share/certification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageUrl,
            pageTitle: pageTitle || pageUrl,
            status: userStatus,
            rank: userRank,
            totalCertifiers: totalPositions
          })
        }
      )

      const { url: shareUrl } = await res.json()

      const title = pageTitle || pageUrl
      const tweetText =
        `I just certified "${title}" as ${userStatus}` +
        ` #${userRank} on @0xSofia`

      const intentUrl =
        `https://twitter.com/intent/tweet?text=` +
        `${encodeURIComponent(tweetText)}` +
        `&url=${encodeURIComponent(shareUrl)}`

      if (win) {
        win.location.href = intentUrl
      } else {
        window.open(intentUrl, "_blank")
      }
    } catch (err) {
      logger.error("Failed to create share link", err)
      if (win) win.close()
    } finally {
      setIsSharing(false)
    }
  }, [
    isSharing,
    disabled,
    pageUrl,
    pageTitle,
    userStatus,
    userRank,
    totalPositions
  ])

  return (
    <button
      className="share-certification-btn"
      onClick={handleShare}
      disabled={disabled || isSharing || !userStatus}
    >
      <img
        src={xIcon}
        alt="X"
        className="share-certification-btn__icon"
      />
      {isSharing ? "Sharing..." : "Share"}
    </button>
  )
}

export default ShareCertificationButton
