// Background service worker — the whole gesture in one place: a right-click
// "Add to team" menu with one entry per team. Clicking captures the page (or
// the right-clicked link) and saves it. Infra-free for the PoC; the backend +
// payment delegation plug in at `saveBookmark`.
import { TEAMS } from "~lib/teams"
import { saveBookmark } from "~lib/bookmarks"

const PARENT_ID = "add-to-team"
const CONTEXTS: chrome.contextMenus.ContextType[] = ["page", "link", "selection"]

// Build the menu tree: a parent "Add to team" with a child per team.
function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: PARENT_ID,
      title: "Add to team",
      contexts: CONTEXTS
    })
    for (const team of TEAMS) {
      chrome.contextMenus.create({
        id: `team:${team.id}`,
        parentId: PARENT_ID,
        title: team.label,
        contexts: CONTEXTS
      })
    }
  })
}

chrome.runtime.onInstalled.addListener(buildMenus)
chrome.runtime.onStartup.addListener(buildMenus)

// Flash a ✓ on the toolbar icon as save feedback.
function flashBadge() {
  chrome.action.setBadgeBackgroundColor({ color: "#ffc6b0" })
  chrome.action.setBadgeText({ text: "✓" })
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1600)
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const id = info.menuItemId
  if (typeof id !== "string" || !id.startsWith("team:")) return

  const teamId = id.slice("team:".length)
  const team = TEAMS.find((t) => t.id === teamId)

  // A right-clicked link wins over the page itself.
  const url = info.linkUrl || info.pageUrl || tab?.url
  if (!url) return
  const title = info.linkUrl ? info.linkUrl : tab?.title || url

  void saveBookmark({
    url,
    title,
    teamId,
    teamLabel: team?.label ?? teamId,
    addedAt: Date.now()
  }).then(flashBadge)
})
