/**
 * SkillView — the public skill surface, backed by circle-pro-api. Loads a
 * skill's detail (URLs + votes + tools), lets members add resources (via the
 * bookmark picker), attach tools, and vote on links; the real comment thread
 * lives in the right rail. Reads are public; writes require auth.
 *
 * Tags use the LOCAL tag components (DomainTagByTopic) so the domain tag carries
 * the correct Nordic styles.
 */
import { useCallback, useEffect, useState } from "react"
import { Icon } from "../components/Icon"
import { DomainTagByTopic } from "../components/Tag"
import { avGrad, hostOf, initials } from "../data/helpers"
import { useAuth } from "../hooks/useAuth"
import { useComments } from "../hooks/useComments"
import {
  addSkillTool,
  addSkillUrl,
  getSkill,
  voteSkillUrl,
  type PublicComment,
  type SkillDetail
} from "../services/circleProApi"
import { CommentComposer, isMediaUrl } from "../components/CommentComposer"
import { BookmarkPicker } from "../components/BookmarkPicker"
import { toast } from "../lib/toast"

/** Extract a YouTube video id from common URL shapes. */
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  )
  return m ? m[1] : null
}

/** Classify a resource by its URL → label + accent (matches the design sheet). */
function resType(url: string): { label: string; color: string } {
  const h = hostOf(url)
  if (youtubeId(url)) return { label: "Video", color: "#E0483B" }
  if (/github\.com/.test(h)) return { label: "Repo · file", color: "#3B6FE0" }
  if (/\.skill$/.test(url)) return { label: "Skill", color: "#4F46E5" }
  if (/(\.md|\.pdf|docs?\.|notion\.|hackmd\.)/.test(url))
    return { label: "Doc", color: "#C9821F" }
  return { label: "Article", color: "#C9821F" }
}

const descFor = (name: string) =>
  `The resources and tools the team actually reaches for to run ${name.toLowerCase()}. Anyone can pick it up and run it.`

/** A few sensible default steps so a fresh skill's read view isn't empty. */
const defaultSteps = (name: string): string[] => [
  `Frame the goal of ${name.toLowerCase()} in one sentence.`,
  "Gather the resources below before you start.",
  "Run it, then share what you learned back here."
]

const shortWallet = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`

/* Read-only real comment row (matches PostDetail's visual language). */
function PublicCommentRow({ c }: { c: PublicComment }) {
  if (c.deleted) {
    return (
      <div className="pc pc--deleted">
        <span className="pc-av pc-av--ghost" />
        <div className="pc-main">
          <p className="pc-text pc-text--muted">comment deleted</p>
        </div>
      </div>
    )
  }
  return (
    <div className="pc">
      <span
        className="pc-av"
        style={{ background: avGrad(c.author.avatarSeed) }}>
        {initials(c.author.displayName)}
      </span>
      <div className="pc-main">
        <div className="pc-head">
          <span className="pc-who">{c.author.displayName}</span>
          <span className="pc-handle mono">@{c.author.handle}</span>
          {c.edited ? <span className="pc-edited mono">edited</span> : null}
        </div>
        {isMediaUrl(c.text ?? "") ? (
          <img className="pc-gif" src={c.text ?? ""} alt="" />
        ) : (
          <p className="pc-text">{c.text}</p>
        )}
      </div>
    </div>
  )
}

interface SkillViewProps {
  skillId: string
  onClose: () => void
  startEditing?: boolean
}

export function SkillView({
  skillId,
  onClose,
  startEditing = false
}: SkillViewProps) {
  const { authenticated, login, token } = useAuth()
  const [detail, setDetail] = useState<SkillDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [bkPick, setBkPick] = useState(startEditing)
  const [voted, setVoted] = useState(false)
  const [copied, setCopied] = useState(false)
  const {
    items: comments,
    loading: commentsLoading,
    loadingMore,
    hasMore,
    loadMore,
    canWrite,
    add
  } = useComments(`skill:${skillId}`)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const t = authenticated ? await token() : null
      setDetail(await getSkill(t, skillId))
    } catch {
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [authenticated, token, skillId])
  useEffect(() => {
    load()
  }, [load])

  const onUse = () => {
    setCopied(true)
    toast("Skill copied to clipboard")
    setTimeout(() => setCopied(false), 1700)
  }

  const onVote = async (urlId: string) => {
    if (!authenticated) return login()
    try {
      await voteSkillUrl(await token(), skillId, urlId)
      await load()
    } catch {
      toast("Could not vote")
    }
  }

  const onAddUrl = async (url: string, title: string) => {
    if (!authenticated) {
      setBkPick(false)
      return login()
    }
    try {
      await addSkillUrl(await token(), skillId, { url, title })
      setBkPick(false)
      await load()
    } catch {
      toast("Could not add resource")
    }
  }

  const onAddTool = async () => {
    if (!authenticated) return login()
    const name = window.prompt("Tool name")?.trim()
    if (!name) return
    try {
      await addSkillTool(await token(), skillId, { name })
      await load()
    } catch {
      toast("Could not add tool")
    }
  }

  const author = detail?.createdBy ?? "the team"
  const urls = detail
    ? [...detail.urls].sort((a, b) => b.voteCount - a.voteCount)
    : []
  const steps = detail ? defaultSteps(detail.name) : []

  return (
    <div className="skv">
      <header className="skv-topbar">
        <div className="psk-head">
          <span
            className="psk-author-av"
            style={{ background: avGrad(initials(author).charCodeAt(0) % 6) }}>
            {initials(author)}
          </span>
          <div className="psk-author-meta">
            <div className="psk-author-name">{shortWallet(author)}</div>
            <div className="psk-author-sub mono">Skill owner</div>
          </div>
        </div>
        <div className="skv-topbar-right">
          <div className="psk-use-wrap">
            <div className="psk-use">
              <button className="psk-use-main" onClick={onUse}>
                Use this skill
              </button>
              <button
                className={`psk-use-vote${voted ? " on" : ""}`}
                aria-pressed={voted}
                onClick={() => setVoted((v) => !v)}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="m6 15 6-6 6 6" />
                </svg>
                {(detail?.urls.length ?? 0) + (voted ? 1 : 0)}
              </button>
            </div>
            {copied ? (
              <span className="psk-copied">Copied to clipboard ✓</span>
            ) : null}
          </div>
          <button
            className="skv-icon btn-icon"
            aria-label="Close"
            onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll">
          {loading || !detail ? (
            <p className="sk-empty mono">Loading…</p>
          ) : (
            <>
              <h1 className="skv-title">{detail.name}</h1>
              <p className="psk-desc">{descFor(detail.name)}</p>

              {detail.topic ? (
                <>
                  <div className="psk-sec-head">
                    <span className="psk-sec-title">Tags</span>
                  </div>
                  <div className="psk-tags">
                    <DomainTagByTopic id={detail.topic} label={detail.topic} />
                  </div>
                </>
              ) : null}

              <div className="psk-sec-head">
                <span className="psk-sec-title">Tools</span>
                <span className="psk-sec-n mono">{detail.tools.length}</span>
              </div>
              <div className="psk-tools">
                {detail.tools.map((t) => (
                  <span className="psk-tool" key={t.id}>
                    <img
                      className="psk-tool-fav"
                      src={`https://www.google.com/s2/favicons?domain=${t.host || hostOf(t.name) || t.name}&sz=64`}
                      alt=""
                      loading="lazy"
                    />
                    {t.name}
                  </span>
                ))}
                <button
                  className="btn-add btn-add--chip"
                  onClick={onAddTool}>
                  ＋ Add tool
                </button>
              </div>

              <div className="psk-sec-head">
                <span className="psk-sec-title">Resources</span>
                <span className="psk-sec-n mono">{urls.length}</span>
              </div>
              {urls.length ? (
                <div className="tld-list">
                  {urls.map((x) => {
                    const abs = x.url.startsWith("http")
                      ? x.url
                      : `https://${x.url}`
                    const host = hostOf(x.url)
                    const t = resType(x.url)
                    return (
                      <div className="tld-row" key={x.id}>
                        <a
                          className="tld-row-main"
                          href={abs}
                          target="_blank"
                          rel="noopener noreferrer">
                          <span className="tld-row-ic">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                              alt=""
                              loading="lazy"
                            />
                          </span>
                          <span className="tld-row-id">
                            <span className="tld-row-name">{x.title}</span>
                            <span className="tld-row-sub mono">
                              <span
                                className="psk-res-type"
                                style={{ color: t.color }}>
                                {t.label}
                              </span>{" "}
                              · {host}
                            </span>
                          </span>
                        </a>
                        <button
                          className={`tld-vote${x.votedByMe ? " on" : ""}`}
                          aria-pressed={x.votedByMe}
                          onClick={() => onVote(x.id)}>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            strokeLinejoin="round">
                            <path d="m6 15 6-6 6 6" />
                          </svg>
                          <span className="tnum">{x.voteCount}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="sk-empty mono">
                  No resources yet — add the first one.
                </p>
              )}

              {bkPick ? (
                <BookmarkPicker onPick={onAddUrl} onClose={() => setBkPick(false)} />
              ) : (
                <button
                  className="btn-add btn-add--row"
                  onClick={() => setBkPick(true)}>
                  ＋ Add a link, doc, repo or skill
                </button>
              )}

              <div className="psk-sec-head psk-sec-head--steps">
                <span className="psk-sec-title">Steps</span>
              </div>
              <ol className="psk-steps">
                {steps.map((s, i) => (
                  <li className="psk-step" key={i}>
                    <span className="psk-step-n mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="psk-step-t">{s}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <aside className="skv-rail">
          <div className="skv-rail-head">
            <span className="skv-tab on">
              {commentsLoading
                ? "Comments"
                : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="skv-rail-scroll sk-scroll">
            {commentsLoading ? (
              <p className="sk-empty mono">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="sk-empty mono">No comments yet.</p>
            ) : (
              comments.map((c) => <PublicCommentRow key={c.id} c={c} />)
            )}
            {hasMore ? (
              <button
                className="btn btn--outline btn--sm pc-more"
                disabled={loadingMore}
                onClick={loadMore}>
                {loadingMore ? "Loading…" : "Load more comments"}
              </button>
            ) : null}
          </div>
          <div className="skv-composer">
            {canWrite ? (
              <CommentComposer onSend={(content) => void add(content)} />
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
