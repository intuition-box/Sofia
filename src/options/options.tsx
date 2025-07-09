import ReactDOM from 'react-dom/client'

function OptionsApp() {
  return (
    <div>
      <h1>SOFIA Extension - Options</h1>
      <p>Page de configuration de l'extension</p>
    </div>
  )
}

const root = ReactDOM.createRoot(
  document.getElementById('options-root') as HTMLElement
)
root.render(<OptionsApp />) 