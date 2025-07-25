import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useAgentMessages } from '../../hooks/useAgentMessages'
import { Storage } from '@plasmohq/storage'
import LiquidGlass from '../ui/LiquidGlass'
import '../styles/Global.css'
import '../styles/MyGraphPage.css'

const storage = new Storage()

interface Message {
  role: 'user' | 'sofia'
  content: { text: string }
  created_at: number
}

interface ParsedSofiaMessage {
  atoms: string[]
  triplets: string[]
  intention: string
  created_at: number
}

function parseSofiaMessage(text: string, created_at: number): ParsedSofiaMessage {
  console.log("🔍 Parsing message text:", text)

  const atomsMatch = text.match(/✅ Atoms\s*:\s*((?:- .*?)(?=🧩|🧠|🎯|$))/)
  const tripletsMatch = text.match(/🧩 Triplets\s*:\s*((?:- .*?)(?=🧠|🎯|$))/)
  const intentionMatch = text.match(/🎯 Intention\s*:\s*(.*)/)

  const extractList = (block: string | undefined) =>
    block?.split(/- /)
      .map((line) => line.trim())
      .filter((line) => !!line) || []

  const atoms = extractList(atomsMatch?.[1])
  const triplets = extractList(tripletsMatch?.[1])
  const intention = intentionMatch?.[1]?.trim() || ''

  console.log("🧠 Extracted Atoms:", atoms)
  console.log("📎 Extracted Triplets:", triplets)
  console.log("🎯 Extracted Intention:", intention)

  return { atoms, triplets, intention, created_at }
}



const MyGraphPage = () => {
  const { navigateTo } = useRouter()
  const { triplets } = useAgentMessages()
  const [activeGraphTab, setActiveGraphTab] = useState<'my-echos' | 'my-triples'>('my-echos')
  const [parsedMessages, setParsedMessages] = useState<ParsedSofiaMessage[]>([])

  useEffect(() => {
    async function loadMessages() {
      try {
        const raw = await storage.get("sofiaMessages")
        if (!raw) return

        const messages: Message[] = JSON.parse(raw)
        const parsed = messages
          .filter((m) => m.role === 'sofia')
          .map((m) => parseSofiaMessage(m.content.text, m.created_at))

        setParsedMessages(parsed)
      } catch (e) {
        console.error('❌ Failed to load sofiaMessages from storage:', e)
      }
    }

    loadMessages()
  }, [])

  return (
    <div className="page">
      <button onClick={() => navigateTo('home-connected')} className="back-button">
        ← Back to Home
      </button>

      <h2 className="section-title">My Graph</h2>

      <div className="tabs">
        <button
          onClick={() => setActiveGraphTab('my-echos')}
          className={`tab ${activeGraphTab === 'my-echos' ? 'active' : ''}`}
        >
          My Echo's
        </button>
        <button
          onClick={() => setActiveGraphTab('my-triples')}
          className={`tab ${activeGraphTab === 'my-triples' ? 'active' : ''}`}
        >
          My Triples
        </button>
      </div>

      <div className="page-content">
        {activeGraphTab === 'my-echos' && (
          <div className="triples-container">
            <h3 className="subsection-title">My Echo's</h3>
            {parsedMessages.length > 0 ? (
              parsedMessages.map((entry, index) => (
                <div key={index} className="triplet-block">
                  <p className="timestamp">
                    <strong>Timestamp :</strong>{" "}
                    {new Date(entry.created_at).toLocaleString("fr-FR")}
                  </p>

                  <h4>Atoms</h4>
                  {entry.atoms.length > 0 ? (
                    <ul>{entry.atoms.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  ) : (
                    <p><em>(aucun atom trouvé)</em></p>
                  )}

                  <h4>Triplets</h4>
                  {entry.triplets.length > 0 ? (
                    <ul>{entry.triplets.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  ) : (
                    <p><em>(aucun triplet trouvé)</em></p>
                  )}

                  <h4>Intention</h4>
                  <p>{entry.intention || <em>(pas d'intention détectée)</em>}</p>

                  {index < parsedMessages.length - 1 && (
                    <LiquidGlass height="2px" className="triple-separator" />
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No SofIA messages received yet</p>
                <p className="empty-subtext">They will appear automatically when received</p>
              </div>
            )}
          </div>
        )}

        {activeGraphTab === 'my-triples' && (
          <div className="triples-container">
            <h3 className="subsection-title">Blockchain Triplets</h3>
            <div className="empty-state">
              <p>No triples registered yet</p>
              <p className="empty-subtext">
                Your validated triplets will appear here once stored on-chain
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyGraphPage
