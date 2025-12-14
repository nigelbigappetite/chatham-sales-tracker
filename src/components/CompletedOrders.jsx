import { useState } from 'react'
import './CompletedOrders.css'

const CompletedOrders = ({ orders = [] }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="completed-orders">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <h2>Completed Orders</h2>
        <div className="header-right">
          <div className="order-count-badge completed">{orders.length}</div>
          <span className="collapse-icon">{isOpen ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isOpen && (
        <>
          {orders.length === 0 ? (
            <p className="empty-state">No completed orders yet</p>
          ) : (
            <div className="orders-list">
          {orders.slice(0, 50).map((order, index) => (
            <div key={index} className="order-card completed">
              <div className="order-header">
                <span className="order-number">#{order.orderNumber || 'N/A'}</span>
                <span className="order-date">{order.orderDate || 'No date'}</span>
              </div>
              <div className="fulfilled-badge">
                Fulfilled: {order.fulfilledDate || 'N/A'}
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
            </div>
          ))}
          {orders.length > 50 && (
            <p className="more-orders">Showing 50 most recent of {orders.length} completed orders</p>
          )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CompletedOrders

