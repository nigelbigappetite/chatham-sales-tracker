import { useState } from 'react'
import './PayoutSummary.css'

const PayoutSummary = ({ payouts = [] }) => {
  const [isOpen, setIsOpen] = useState(true)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  return (
    <div className="payout-summary">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <h2>Monthly Payout Summary</h2>
        <span className="collapse-icon">{isOpen ? '▼' : '▶'}</span>
      </div>
      
      {isOpen && (
        <>
          <p className="payout-rate">Rate: £0.70 per sauce pack</p>
          
          {payouts.length === 0 ? (
            <p className="empty-state">No payout data available</p>
          ) : (
            <div className="payouts-list">
          {payouts.map((payout, index) => (
            <div key={index} className="payout-card">
              <div className="payout-header">
                <h3>{payout.month}</h3>
                <div className="payout-totals">
                  <div className="total-item">
                    <span className="label">Total Packs:</span>
                    <span className="value">{isNaN(payout.totalPacks) ? '0' : payout.totalPacks.toFixed(0)}</span>
                  </div>
                  <div className="total-item highlight">
                    <span className="label">Total Payout:</span>
                    <span className="value">{isNaN(payout.totalPayout) ? formatCurrency(0) : formatCurrency(payout.totalPayout)}</span>
                  </div>
                </div>
              </div>
              
              {payout.orders.length > 0 && (
                <div className="payout-orders">
                  <h4>Breakdown ({payout.orders.length} entries)</h4>
                  <div className="orders-grid">
                    {payout.orders.map((order, orderIndex) => (
                      <div key={orderIndex} className="payout-order-item">
                        <span className="order-packs">{isNaN(order.packs) ? '0' : order.packs} pack{(isNaN(order.packs) ? 0 : order.packs) !== 1 ? 's' : ''}</span>
                        <span className="order-payout">{isNaN(order.payout) ? formatCurrency(0) : formatCurrency(order.payout)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PayoutSummary

