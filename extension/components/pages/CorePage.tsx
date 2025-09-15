import { useState, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy loading des composants d'onglets
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const SignalsTab = lazy(() => import('./core-tabs/SignalsTab'))
const PulseTab = lazy(() => import('./core-tabs/PulseTab'))


const CorePage = () => {
  const { navigateTo } = useRouter()
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'Signals' | 'Pulse'>('Echoes')
  const [expandedTriplet, setExpandedTriplet] = useState<{ msgIndex: number; tripletIndex: number } | null>(null)
  const [expandedSignalTriplet, setExpandedSignalTriplet] = useState<{ tripletId: string } | null>(null)

  return (
    <div className={`page ${activeGraphTab === 'Pulse' ? 'pulse-active' : ''}`}>
      <div className="tabs">
        {['Echoes', 'Signals', 'Pulse'].map(tab => (
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
          {activeGraphTab === 'Pulse' && <PulseTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default CorePage
