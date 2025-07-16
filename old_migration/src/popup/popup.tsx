import { PopupApp } from './PopupApp';
import ReactDOM from 'react-dom/client';
import '../index.css';

// Export du composant pour Fast Refresh
export { PopupApp };

// Montage de l'application
const container = document.getElementById('popup-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<PopupApp />);
}
