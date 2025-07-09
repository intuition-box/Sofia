import ReactDOM from 'react-dom/client'

function PopupApp() {
  return (
    <div>
      <h1>SOFIA Extension</h1>
      <p>Popup de l'extension Chrome</p>
    </div>
  )
}

const root = ReactDOM.createRoot(
  document.getElementById('popup-root') as HTMLElement
)
root.render(<PopupApp />) 