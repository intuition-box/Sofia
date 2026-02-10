import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://sofia-og.vercel.app/s/*"],
  all_frames: false,
  run_at: "document_idle"
}

// Detect Sofia share page and enable deep linking into the extension
const profileEl = document.getElementById("sofia-profile-data")
if (profileEl) {
  const wallet = profileEl.dataset.wallet || ""
  const name = profileEl.dataset.name || ""

  if (wallet) {
    // Send profile data to background to store navigation intent
    chrome.runtime.sendMessage(
      { type: "DEEP_LINK_PROFILE", data: { wallet, name } },
      (response) => {
        if (chrome.runtime.lastError || !response?.success) return

        // Extension is installed and intent stored — replace CTA button
        const cta = document.getElementById("sofia-cta") as HTMLAnchorElement | null
        if (cta) {
          cta.removeAttribute("href")
          cta.textContent = "Open in Sofia"
          cta.style.cursor = "pointer"
          cta.addEventListener("click", (e) => {
            e.preventDefault()
            chrome.runtime.sendMessage({ type: "open_sidepanel" })
          })
        }
      }
    )
  }
}
