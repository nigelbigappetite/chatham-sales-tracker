import { useState } from 'react'
import './AllOrders.css'

const AllOrders = ({ orders = [] }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="all-orders">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <h2>All Orders</h2>
        <div className="header-right">
          <div className="order-count-badge">{orders.length || 0}</div>
          <span className="collapse-icon">{isOpen ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isOpen && (
        <>
          {!orders || orders.length === 0 ? (
            <p className="empty-state">No orders found</p>
          ) : (
            <div className="orders-list">
        {orders.map((order, index) => {
          // Check if fulfilled date exists and is not "N/A"
          const fulfilledDateStr = order?.fulfilledDate ? String(order.fulfilledDate).trim() : ''
          const hasFulfilledDate = fulfilledDateStr !== '' && fulfilledDateStr !== 'N/A' && fulfilledDateStr.toLowerCase() !== 'na'
          const statusClass = hasFulfilledDate ? 'completed' : 'pending'
            
            return (
              <div key={index} className={`order-card ${statusClass}`}>
                <div className="order-header">
                  <span className="order-number">#{order.orderNumber || 'N/A'}</span>
                  <span className={`status-badge ${statusClass}`}>
                    {hasFulfilledDate ? 'Completed' : 'Pending'}
                  </span>
                </div>
                <div className="order-dates">
                  <span className="order-date">Order Date: {order.orderDate || 'N/A'}</span>
                  {hasFulfilledDate && (
                    <span className="fulfilled-date">Fulfilled: {order.fulfilledDate}</span>
                  )}
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
            )
          })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AllOrders

