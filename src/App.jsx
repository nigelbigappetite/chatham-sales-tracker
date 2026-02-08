import { useState, useEffect } from 'react'
import { fetchSheetData } from './services/sheetsService'
import Dashboard from './components/Dashboard'
import CreateOrderModal from './components/CreateOrderModal'
import './App.css'

const DARK_MODE_KEY = 'wingverse-order-tracker-dark'

function App() {
  const [orders, setOrders] = useState([])
  const [settlements, setSettlements] = useState([])
  const [setupData, setSetupData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(DARK_MODE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(DARK_MODE_KEY, String(darkMode))
    } catch (_) {}
  }, [darkMode])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch orders from orders_raw tab
      const ordersData = await fetchSheetData('orders_raw')
      setOrders(ordersData)
      
      // Fetch settlement data from Chatham_Settlement tab
      const settlementData = await fetchSheetData('Chatham_Settlement')
      setSettlements(settlementData)
      
      // Fetch setup data for product name mapping
      try {
        const setup = await fetchSheetData('Setup')
        console.log('Setup data loaded:', setup.length, 'rows')
        if (setup.length > 0) {
          console.log('First setup row:', setup[0])
          console.log('First setup row keys:', Object.keys(setup[0]))
          console.log('First 5 setup rows:', setup.slice(0, 5).map(row => {
            const keys = Object.keys(row)
            return {
              rowIndex: setup.indexOf(row),
              keys: keys,
              sampleValues: keys.slice(0, 5).map(k => ({ [k]: row[k] }))
            }
          }))
        }
        setSetupData(setup)
      } catch (setupError) {
        console.warn('Could not load Setup tab:', setupError)
        // Continue without setup data - will use fallback
        setSetupData([])
      }
    } catch (err) {
      console.error('Error loading data:', err)
      const errorMessage = err.message || 'Unknown error'
      setError(`Failed to load data: ${errorMessage}. Please make sure:
        1. The Google Sheet is publicly accessible (Share → Anyone with the link can view)
        2. The sheet tabs are named exactly: "orders_raw", "Chatham_Settlement", and "Setup"
        3. Check the browser console for more details`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading from Wingverse...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadData} className="retry-button">Retry</button>
      </div>
    )
  }

  return (
    <div className="App">
      <header className="app-header">
        <img src="/wingverse logo transparent.png" alt="Wingverse Logo" className="logo" />
        <h1>Wingverse order tracker</h1>
        <button
          type="button"
          onClick={() => setDarkMode((d) => !d)}
          className="theme-toggle"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <button type="button" onClick={() => setShowCreateOrder(true)} className="create-order-button">
          Create order
        </button>
        <button onClick={loadData} className="refresh-button">Refresh Data</button>
      </header>
      <Dashboard orders={orders} settlements={settlements} setupData={setupData} />
      {showCreateOrder && (
        <CreateOrderModal
          onClose={() => setShowCreateOrder(false)}
          onSuccess={loadData}
          setupData={setupData}
        />
      )}
    </div>
  )
}

export default App

