import { useState, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/MyGraphPage.css'

// Lazy loading des composants d'onglets
const EchoesTab = lazy(() => import('./graph-tabs/EchoesTab'))
const SignalsTab = lazy(() => import('./graph-tabs/SignalsTab'))
const ResonanceTab = lazy(() => import('./graph-tabs/ResonanceTab'))


const MyGraphPage = () => {
  const { navigateTo } = useRouter()
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'Signals' | 'Resonance'>('Echoes')
  const [expandedTriplet, setExpandedTriplet] = useState<{ msgIndex: number; tripletIndex: number } | null>(null)
  const [expandedSignalTriplet, setExpandedSignalTriplet] = useState<{ tripletId: string } | null>(null)

  return (
    <div className="page">
      <button onClick={() => navigateTo('home-connected')} className="back-button">
        ← Back to Home
      </button>

      <h2 className="section-title">My Graph</h2>

      <div className="tabs">
        {['Echoes', 'Signals', 'Resonance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveGraphTab(tab as any)}
            className={`tab ${activeGraphTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {activeGraphTab === 'Echoes' && (
            <EchoesTab 
              expandedTriplet={expandedTriplet}
              setExpandedTriplet={setExpandedTriplet}
            />
          )}
          {activeGraphTab === 'Signals' && (
            <SignalsTab 
              expandedTriplet={expandedSignalTriplet}
              setExpandedTriplet={setExpandedSignalTriplet}
            />
          )}
          {activeGraphTab === 'Resonance' && <ResonanceTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default MyGraphPage
