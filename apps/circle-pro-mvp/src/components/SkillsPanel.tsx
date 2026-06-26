/**
 * SkillsPanel — the team's Skills as open containers (the mock's model): list of
 * skills (cards with link + vote counts) → "Create new"; open a skill to add
 * URLs (votable) and tools. Used in the DepartmentView Skills tab. Real backend.
 */
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Plus, ThumbsUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCircle } from '../hooks/useCircle'
import { hostOf } from '../data/helpers'
import {
  getSkills,
  createSkill,
  getSkill,
  addSkillUrl,
  voteSkillUrl,
  addSkillTool,
  type SkillCard,
  type SkillDetail,
} from '../services/circleProApi'
import { toast } from '../lib/toast'

export function SkillsPanel({ departmentId }: { departmentId: string }) {
  const { authenticated, token, login } = useAuth()
  const { circleId } = useCircle()
  const [skills, setSkills] = useState<SkillCard[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const tok = useCallback(async () => (authenticated ? await token() : null), [authenticated, token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSkills(await getSkills(await tok(), circleId, departmentId))
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }, [tok, circleId, departmentId])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    const n = name.trim()
    if (!n) return
    if (!authenticated) return login()
    try {
      const s = await createSkill(await token(), circleId, { name: n, departmentId })
      setName('')
      await load()
      setOpenId(s.id)
    } catch {
      toast('Could not create the skill')
    }
  }

  if (openId) return <SkillView skillId={openId} onBack={() => { setOpenId(null); void load() }} />

  return (
    <div className="sk">
      <div className="sk-create">
        <input
          className="sk-create-input"
          placeholder="New skill (e.g. ZK proving, Funding)…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') create()
          }}
        />
        <button type="button" className="btn btn-sm btn-accent" onClick={create}>
          <Plus size={14} /> Create
        </button>
      </div>

      {loading ? (
        <div className="tm-empty">Loading skills…</div>
      ) : !skills.length ? (
        <div className="tm-empty">No skills yet — create the first container above.</div>
      ) : (
        <div className="sk-grid">
          {skills.map((s) => (
            <button type="button" className="sk-card" key={s.id} onClick={() => setOpenId(s.id)}>
              <span className="sk-card-name">{s.name}</span>
              <span className="sk-card-meta mono">
                {s.urlCount} link{s.urlCount === 1 ? '' : 's'} · {s.voteCount} vote{s.voteCount === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SkillView({ skillId, onBack }: { skillId: string; onBack: () => void }) {
  const { authenticated, token, login } = useAuth()
  const [skill, setSkill] = useState<SkillDetail | null>(null)
  const [url, setUrl] = useState('')
  const [tool, setTool] = useState('')

  const tok = useCallback(async () => (authenticated ? await token() : null), [authenticated, token])
  const load = useCallback(async () => {
    try {
      setSkill(await getSkill(await tok(), skillId))
    } catch {
      setSkill(null)
    }
  }, [tok, skillId])
  useEffect(() => {
    load()
  }, [load])

  const requireAuth = () => {
    if (!authenticated) {
      login()
      return false
    }
    return true
  }

  const addUrl = async () => {
    const u = url.trim()
    if (!u) return
    if (!requireAuth()) return
    try {
      await addSkillUrl(await token(), skillId, { url: u })
      setUrl('')
      await load()
    } catch {
      toast('Could not add the link')
    }
  }
  const vote = async (urlId: string) => {
    if (!requireAuth()) return
    try {
      await voteSkillUrl(await token(), skillId, urlId)
      await load()
    } catch {
      toast('Could not vote')
    }
  }
  const addTool = async () => {
    const t = tool.trim()
    if (!t) return
    if (!requireAuth()) return
    try {
      await addSkillTool(await token(), skillId, { name: t })
      setTool('')
      await load()
    } catch {
      toast('Could not add the tool')
    }
  }

  if (!skill) return <div className="tm-empty">Loading…</div>

  return (
    <div className="skv">
      <header className="skv-head">
        <button type="button" className="dv-back" onClick={onBack}>
          <ArrowLeft size={14} /> Skills
        </button>
        <h2 className="skv-title">{skill.name}</h2>
      </header>

      <div className="skv-add">
        <input
          className="skv-input"
          placeholder="Add a link (https://…)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addUrl()
          }}
        />
        <button type="button" className="btn btn-sm btn-accent" onClick={addUrl}>
          Add link
        </button>
      </div>

      {skill.urls.length ? (
        <div className="skv-urls">
          {skill.urls.map((u) => (
            <div className="skv-url" key={u.id}>
              <button
                type="button"
                className={`skv-vote${u.votedByMe ? ' on' : ''}`}
                onClick={() => vote(u.id)}>
                <ThumbsUp size={13} />
                <b className="tnum">{u.voteCount}</b>
              </button>
              <a className="skv-url-link" href={u.url} target="_blank" rel="noreferrer">
                <img className="skv-fav" src={`https://www.google.com/s2/favicons?domain=${hostOf(u.url)}&sz=64`} alt="" />
                <span className="skv-url-title">{u.title}</span>
                <span className="skv-url-host mono">{hostOf(u.url)}</span>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="tm-empty">No links yet — add the first one above.</div>
      )}

      <div className="skv-tools">
        <div className="skv-tools-head">Tools</div>
        <div className="skv-tools-row">
          {skill.tools.map((t) => (
            <span className="skv-tool" key={t.id}>
              <img src={`https://www.google.com/s2/favicons?domain=${t.host || hostOf(t.name) || t.name}&sz=64`} alt="" />
              {t.name}
            </span>
          ))}
          <input
            className="skv-tool-input"
            placeholder="+ tool"
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTool()
            }}
          />
        </div>
      </div>
    </div>
  )
}
