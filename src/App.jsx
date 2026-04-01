import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/navbar'
import Dashboard from './components/Dashboard'
import { Toaster } from 'react-hot-toast'

function App() {
  const [isDark, setIsDark] = useState(false)

  const toggleDarkMode = () => {
      setIsDark(!isDark)
  }

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Toaster position="top-right" 
               toastOptions={{ 
                style: {
                  background: 'var(--card)',
                  color: 'var(--card-foreground)',
                  border: '1px solid var(--border)'
                } 
              }} 
      />
      <Navbar isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <Dashboard isDark={isDark} />
    </div>
  )
}

export default App
