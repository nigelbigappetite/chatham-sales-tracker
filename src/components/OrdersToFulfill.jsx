import { useState } from 'react'
import './OrdersToFulfill.css'

const OrdersToFulfill = ({ orders = [] }) => {
  const [isOpen, setIsOpen] = useState(true)

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

