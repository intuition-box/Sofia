/**
 * Activity — the team's Skills. A skill is an open container the team builds:
 * anyone can open it, add URLs and tools, and vote on the links. "Add skills"
 * creates a real skill via circle-pro-api; everything lives on the backend.
 * Tools is the team's deduped toolset across every skill. Both read real data.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { Icon } from "../components/Icon"
import { DomainTagByTopic, TagIcon, TopicGlyph } from "../components/Tag"
import { TAG_HUES, topicHue } from "../data/tagStyles"
import { avGrad, hostOf, initials } from "../data/helpers"
import { useComments } from "../hooks/useComments"
import { useAuth } from "../hooks/useAuth"
import { useCircle } from "../hooks/useCircle"
import {
  createSkill,
  getSkills,
  getTeamTools,
  type SkillCard,
  type TeamTool
} from "../services/circleProApi"
import { CommentComposer, isMediaUrl } from "../components/CommentComposer"
import { SkillView } from "./SkillView"
import { toast } from "../lib/toast"
import type { PublicComment } from "../services/circleProApi"

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

interface ActivityProps {
  departmentId: string
}

export function Activity({ departmentId }: ActivityProps) {
  const { authenticated, login, token } = useAuth()
  const { circleId } = useCircle()
  const [skills, setSkills] = useState<SkillCard[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [openEditing, setOpenEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [skillFilter, setSkillFilter] = useState("all")
  const [draft, setDraft] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const t = authenticated ? await token() : null
      setSkills(await getSkills(t, circleId, departmentId))
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }, [authenticated, token, circleId, departmentId])
  useEffect(() => {
    load()
  }, [load])

  const shownSkills =
    skillFilter === "all"
      ? skills
      : skills.filter(
          (s) => (s.topic ?? "").toLowerCase() === skillFilter.toLowerCase()
        )

  const renderSkill = (s: SkillCard, onOpen: (id: string) => void) => (
    <button className="skcard" key={s.id} onClick={() => onOpen(s.id)}>
      <div className="skcard-main">
        <span className="sk-name">{s.name}</span>
        {s.topic ? <DomainTagByTopic id={s.topic} label={s.topic} /> : null}
      </div>
      <SkCardVote base={s.voteCount} />
    </button>
  )

  const openSkill = (id: string) => {
    setOpenEditing(false)
    setOpenId(id)
  }

  const submitCreate = async () => {
    const name = draft.trim()
    if (!name) return
    if (!authenticated) return login()
    try {
      const created = await createSkill(await token(), circleId, {
        name,
        departmentId
      })
      setDraft("")
      setCreating(false)
      await load()
      setOpenEditing(true)
      setOpenId(created.id)
    } catch {
      toast("Could not create skill")
    }
  }

  return (
    <section className="module" id="activity-pro">
      <>
        <div className="mem-filters">
          {["all", "Funding", "Security", "Design"].map((f) => (
            <button
              key={f}
              className={`mem-fil${skillFilter === f ? " active" : ""}`}
              style={
                f === "all"
                  ? undefined
                  : { ["--fc" as string]: TAG_HUES[topicHue(f)].vivid }
              }
              onClick={() => setSkillFilter(f)}>
              {f === "all" ? (
                "All"
              ) : (
                <>
                  <TopicGlyph id={f} /> {f}
                </>
              )}
            </button>
          ))}
          <button
            className="btn btn--quiet btn--sm mem-viewall"
            onClick={() => setShowAll(true)}>
            View all
          </button>
        </div>
        {creating ? (
          <div className="sk-create">
            <input
              className="sk-create-input"
              placeholder="New skill name — e.g. “Design systems”"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCreate()
              }}
            />
            <button
              className="btn btn--outline btn--sm"
              onClick={() => {
                setCreating(false)
                setDraft("")
              }}>
              Cancel
            </button>
            <button className="btn btn--accent btn--sm" onClick={submitCreate}>
              Create
            </button>
          </div>
        ) : null}

        <div className="skcard-grid skcard-grid--compact">
          <button
            className="skcard--create"
            onClick={() => setCreating((v) => !v)}>
            <span className="skcard-create-plus">+</span>
            <span className="skcard-create-label">Add skills</span>
          </button>
          {loading
            ? null
            : shownSkills.slice(0, 8).map((s) => renderSkill(s, openSkill))}
        </div>
      </>

      {openId ? (
        <SkillModal onClose={() => setOpenId(null)}>
          <SkillView
            skillId={openId}
            onClose={() => setOpenId(null)}
            startEditing={openEditing}
          />
        </SkillModal>
      ) : null}

      {showAll ? (
        <SkillModal onClose={() => setShowAll(false)}>
          <div className="va">
            <header className="va-head">
              <h2 className="va-title">All skills</h2>
              <button
                className="skv-icon"
                aria-label="Close"
                onClick={() => setShowAll(false)}>
                <Icon name="close" />
              </button>
            </header>
            <div className="va-body sk-scroll">
              <div className="skcard-grid">
                {shownSkills.map((s) =>
                  renderSkill(s, (id) => {
                    setShowAll(false)
                    openSkill(id)
                  })
                )}
              </div>
            </div>
          </div>
        </SkillModal>
      ) : null}
    </section>
  )
}

/* Attached full-height vote segment on the right edge of a skill card. */
function SkCardVote({ base }: { base: number }) {
  const [on, setOn] = useState(false)
  return (
    <span
      className={`skcard-vote${on ? " on" : ""}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        setOn((v) => !v)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation()
          setOn((v) => !v)
        }
      }}>
      <svg
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
      <span className="btn-vote-n">{base + (on ? 1 : 0)}</span>
    </span>
  )
}

/* Tool grid card — same shell as the skill card (.skcard + attached vote). */
function renderToolCard(t: TeamTool, onOpen: (t: TeamTool) => void) {
  return (
    <div
      className="skcard"
      key={t.name}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(t)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(t)
      }}>
      <div className="skcard-main">
        <span className="sk-name">{t.name}</span>
        <div className="skcard-tools">
          <img
            className="skcard-tool"
            src={`https://www.google.com/s2/favicons?domain=${t.host || hostOf(t.name) || t.name}&sz=64`}
            alt=""
            title={t.name}
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.visibility = "hidden"
            }}
          />
        </div>
        <span className="skcard-sub">{t.count} skills use this</span>
      </div>
      <SkCardVote base={t.count} />
    </div>
  )
}

interface ToolsProps {
  departmentId: string
}

export function Tools({ departmentId }: ToolsProps) {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [tools, setTools] = useState<TeamTool[]>([])
  const [loading, setLoading] = useState(true)
  const [openTool, setOpenTool] = useState<TeamTool | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [skill, setSkill] = useState("all")

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const t = authenticated ? await token() : null
        const res = await getTeamTools(t, circleId, departmentId)
        if (alive) setTools(res)
      } catch {
        if (alive) setTools([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [authenticated, token, circleId, departmentId])

  const skillFilters = Array.from(new Set(tools.flatMap((t) => t.skills)))
  const shownTools =
    skill === "all" ? tools : tools.filter((t) => t.skills.includes(skill))

  const addCard = (
    <button className="skcard--create" onClick={() => toast("Add a tool")}>
      <span className="skcard-create-plus">+</span>
      <span className="skcard-create-label">Add a tool</span>
    </button>
  )

  return (
    <section className="module">
      <div className="mem-filters">
        <button
          className={`mem-fil${skill === "all" ? " active" : ""}`}
          onClick={() => setSkill("all")}>
          All
        </button>
        {skillFilters.map((f) => (
          <button
            key={f}
            className={`mem-fil${skill === f ? " active" : ""}`}
            style={{ ["--fc" as string]: TAG_HUES[topicHue(f)].vivid }}
            onClick={() => setSkill(f)}>
            <TopicGlyph id={f} /> {f}
          </button>
        ))}
        <button
          className="btn btn--quiet btn--sm mem-viewall"
          onClick={() => setShowAll(true)}>
          View all
        </button>
      </div>

      <div className="skcard-grid skcard-grid--compact">
        {addCard}
        {loading
          ? null
          : shownTools.slice(0, 3).map((t) => renderToolCard(t, setOpenTool))}
      </div>

      {openTool ? (
        <SkillModal onClose={() => setOpenTool(null)}>
          <ToolView tool={openTool} onClose={() => setOpenTool(null)} />
        </SkillModal>
      ) : null}

      {showAll ? (
        <SkillModal onClose={() => setShowAll(false)}>
          <div className="va">
            <header className="va-head">
              <h2 className="va-title">All tools</h2>
              <button
                className="skv-icon"
                aria-label="Close"
                onClick={() => setShowAll(false)}>
                <Icon name="close" />
              </button>
            </header>
            <div className="va-body sk-scroll">
              <div className="skcard-grid">
                {addCard}
                {shownTools.map((t) =>
                  renderToolCard(t, (tool) => {
                    setShowAll(false)
                    setOpenTool(tool)
                  })
                )}
              </div>
            </div>
          </div>
        </SkillModal>
      ) : null}
    </section>
  )
}

/* Tool detail — a simple real view: the tool, its host, and the skills that
   lean on it, with the comments rail on the right. */
function ToolView({ tool, onClose }: { tool: TeamTool; onClose: () => void }) {
  const {
    items: comments,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    canWrite,
    add
  } = useComments(`tool:${tool.name}`)
  const host = tool.host || hostOf(tool.name)
  const abs = host.startsWith("http") ? host : `https://${host}`

  return (
    <div className="skv">
      <header className="skv-topbar">
        <div className="psk-head">
          <span className="psk-author-av">
            <img
              src={`https://www.google.com/s2/favicons?domain=${host || tool.name}&sz=64`}
              alt=""
              loading="lazy"
            />
          </span>
          <div className="psk-author-meta">
            <div className="psk-author-name">{tool.name}</div>
            <div className="psk-author-sub mono">{host}</div>
          </div>
        </div>
        <div className="skv-topbar-right">
          <button className="skv-icon" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </header>

      <div className="skv-body">
        <div className="skv-main sk-scroll tld-main">
          <h1 className="skv-title">{tool.name}</h1>
          {host ? (
            <p className="psk-desc">
              <a href={abs} target="_blank" rel="noopener noreferrer">
                {host}
              </a>
            </p>
          ) : null}

          <div className="psk-sec-head">
            <span className="psk-sec-title">Used by {tool.count} skills</span>
            <span className="psk-sec-n mono">{tool.skills.length}</span>
          </div>
          {tool.skills.length ? (
            <div className="tld-list">
              {tool.skills.map((s) => (
                <div className="tld-row" key={s}>
                  <div className="tld-row-main">
                    <span className="tld-row-ic">
                      <TagIcon name="award" color="currentColor" size={16} />
                    </span>
                    <span className="tld-row-id">
                      <span className="tld-row-name">{s}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sk-empty mono">No skills use this yet.</p>
          )}
        </div>

        <aside className="skv-rail">
          <div className="skv-rail-head">
            <span className="skv-tab on">
              {loading
                ? "Comments"
                : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="skv-rail-scroll sk-scroll">
            {loading ? (
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

/* Centered dialog with a blurred backdrop — opens a skill without losing the
   grid behind it. Escape or backdrop click closes. */
function SkillModal({
  onClose,
  children
}: {
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div className="skmodal" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="skmodal-card skmodal-card--skv"
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
