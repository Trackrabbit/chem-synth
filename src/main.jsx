import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LabProvider } from './context/LabProvider';
import { AuthProvider} from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LabProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LabProvider>
  </React.StrictMode>,
)