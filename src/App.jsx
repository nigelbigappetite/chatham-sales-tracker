import { useState, useEffect } from 'react'
import { fetchSheetData } from './services/sheetsService'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [orders, setOrders] = useState([])
  const [settlements, setSettlements] = useState([])
  const [setupData, setSetupData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

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
        <h1>Wingverse fulfillment tracker</h1>
        <button onClick={loadData} className="refresh-button">Refresh Data</button>
      </header>
      <Dashboard orders={orders} settlements={settlements} setupData={setupData} />
    </div>
  )
}

export default App

