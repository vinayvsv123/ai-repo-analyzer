import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
     <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-black text-white">
      <App />
     </div>
    </BrowserRouter>
  </React.StrictMode>,
)
