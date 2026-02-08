import { useState } from 'react'
import { markOrderFulfilled } from '../services/orderService'
import './OrdersToFulfill.css'

const todayISO = () => new Date().toISOString().slice(0, 10)

const OrdersToFulfill = ({ orders = [], onRefresh }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [fulfillingId, setFulfillingId] = useState(null)
  const [error, setError] = useState('')
  const [fulfillModalOrder, setFulfillModalOrder] = useState(null)
  const [fulfillDate, setFulfillDate] = useState(todayISO)

  const openFulfillModal = (order) => {
    setError('')
    setFulfillModalOrder(order)
    setFulfillDate(todayISO())
  }

  const closeFulfillModal = () => {
    setFulfillModalOrder(null)
    setFulfillDate(todayISO())
  }

  const handleConfirmFulfilled = async () => {
    if (!fulfillModalOrder) return
    const orderId = (fulfillModalOrder.orderNumber && String(fulfillModalOrder.orderNumber).trim()) || ''
    if (!orderId) return
    setError('')
    setFulfillingId(orderId)
    const result = await markOrderFulfilled(orderId, fulfillDate)
    setFulfillingId(null)
    if (result.ok) {
      closeFulfillModal()
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
                  onClick={() => openFulfillModal(order)}
                  disabled={fulfillingId !== null}
                  title="Mark this order as shipped (set FulfilmentDate)"
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

      {fulfillModalOrder && (
        <div className="fulfill-modal-overlay" onClick={closeFulfillModal}>
          <div className="fulfill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fulfill-modal-header">
              <h3>Mark as fulfilled</h3>
              <button type="button" className="fulfill-modal-close" onClick={closeFulfillModal} aria-label="Close">
                ×
              </button>
            </div>
            <p className="fulfill-modal-order">
              Order #{fulfillModalOrder.orderNumber || 'N/A'}
            </p>
            <div className="fulfill-modal-field">
              <label htmlFor="fulfill-date">Fulfilment date (date shipped)</label>
              <input
                id="fulfill-date"
                type="date"
                value={fulfillDate}
                onChange={(e) => setFulfillDate(e.target.value)}
              />
            </div>
            <div className="fulfill-modal-actions">
              <button type="button" className="fulfill-modal-cancel" onClick={closeFulfillModal}>
                Cancel
              </button>
              <button
                type="button"
                className="mark-fulfilled-button"
                onClick={handleConfirmFulfilled}
                disabled={fulfillingId !== null}
              >
                {fulfillingId ? 'Updating…' : 'Mark as fulfilled'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersToFulfill

