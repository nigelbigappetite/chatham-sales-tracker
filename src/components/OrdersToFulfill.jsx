import { useState } from 'react'
import { markOrderFulfilled } from '../services/orderService'
import './OrdersToFulfill.css'

const OrdersToFulfill = ({ orders = [], onRefresh }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [fulfillingId, setFulfillingId] = useState(null)
  const [error, setError] = useState('')

  const handleMarkFulfilled = async (order) => {
    const orderId = (order.orderNumber && String(order.orderNumber).trim()) || ''
    if (!orderId) return
    setError('')
    setFulfillingId(orderId)
    const today = new Date().toISOString().slice(0, 10)
    const result = await markOrderFulfilled(orderId, today)
    setFulfillingId(null)
    if (result.ok) {
      onRefresh?.()
    } else {
      setError(result.message || 'Failed to mark as fulfilled')
    }
  }

  return (
    <div className="orders-to-fulfill">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <h2>Orders to Fulfill</h2>
        <div className="header-right">
          <div className="order-count-badge">{orders.length}</div>
          <span className="collapse-icon">{isOpen ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isOpen && (
        <>
          {error && <p className="orders-to-fulfill-error" role="alert">{error}</p>}
          {orders.length === 0 ? (
            <p className="empty-state">No orders pending fulfillment</p>
          ) : (
            <div className="orders-list">
          {orders.map((order, index) => (
            <div key={index} className="order-card">
              <div className="order-header">
                <span className="order-number">#{order.orderNumber || 'N/A'}</span>
                <span className="order-date">{order.orderDate || 'No date'}</span>
              </div>
              {order.products && order.products.length > 0 && (
                <div className="order-products">
                  {order.products.map((product, pIndex) => (
                    <div key={pIndex} className="product-item">
                      <span className="product-name">{product.name}</span>
                      <span className="product-qty">Qty: {product.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
              {order.totalQuantity > 0 && (
                <div className="order-total-quantity">Total Qty: {order.totalQuantity}</div>
              )}
              <div className="order-card-actions">
                <button
                  type="button"
                  className="mark-fulfilled-button"
                  onClick={() => handleMarkFulfilled(order)}
                  disabled={fulfillingId !== null}
                  title="Mark this order as shipped (sets FulfilmentDate to today)"
                >
                  {fulfillingId === String(order.orderNumber || '') ? 'Updating…' : 'Mark as fulfilled'}
                </button>
              </div>
            </div>
          ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default OrdersToFulfill

