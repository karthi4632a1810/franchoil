import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ✅ 2. Lazy-load non-critical scripts after app is stable
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./nonCritical.js') // load extra logic only when browser is free
  })
} else {
  // Fallback if requestIdleCallback is not supported
  setTimeout(() => import('./nonCritical.js'), 2000)
}

// ✅ 3. (Optional) Clear old IndexedDB when testing Lighthouse
// if (import.meta.env.DEV) {
//   indexedDB.databases?.().then(dbs => {
//     dbs.forEach(db => indexedDB.deleteDatabase(db.name))
//   })
// }