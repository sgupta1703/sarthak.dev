import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, readTheme } from './site/themes'

applyTheme(readTheme())
createRoot(document.getElementById('root')).render(<App />)
