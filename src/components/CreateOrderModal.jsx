import { useState, useMemo } from 'react'
import { appendOrder } from '../services/orderService'
import './CreateOrderModal.css'

// Build list of { sku, productName } from Setup sheet data (same column detection as Dashboard)
function getSkuOptions(setupData) {
  if (!setupData || setupData.length === 0) return []
  const options = []
  let skuCol = null
  let productCol = null

  for (let i = 0; i < Math.min(15, setupData.length); i++) {
    const row = setupData[i]
    const values = Object.values(row).map((v) => (v || '').toString().trim().toLowerCase())
    if (values.includes('sku') && values.some((v) => v === 'product' || v.includes('product'))) {
      for (const [key, val] of Object.entries(row)) {
        const v = (val || '').toString().trim().toLowerCase()
        if (v === 'sku') skuCol = key
        if (v === 'product' || v.includes('product')) productCol = key
      }
      for (let j = i + 1; j < setupData.length; j++) {
        const item = setupData[j]
        const sku = (item[skuCol] || '').toString().trim()
        const product = (item[productCol] || '').toString().trim()
        if (sku && product && sku.toLowerCase() !== 'sku' && product.toLowerCase() !== 'product') {
          options.push({ sku, productName: product })
        }
      }
      break
    }
  }

  if (options.length === 0 && setupData.length > 0) {
    const keys = Object.keys(setupData[0] || {})
    const skuKey = keys.find((k) => k.toLowerCase().trim() === 'sku')
    const productKey = keys.find((k) => k.toLowerCase().trim() === 'product')
    if (skuKey && productKey) {
      setupData.forEach((item) => {
        const sku = (item[skuKey] || '').toString().trim()
        const product = (item[productKey] || '').toString().trim()
        if (sku && product) options.push({ sku, productName: product })
      })
    }
  }
  return options
}

const defaultLineItem = () => ({ sku: '', qty: 1, lineRevenue: '' })

export default function CreateOrderModal({ onClose, onSuccess, setupData }) {
  const skuOptions = useMemo(() => getSkuOptions(setupData), [setupData])

  const [orderId, setOrderId] = useState('')
  const [orderDate, setOrderDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [fulfilmentPartner, setFulfilmentPartner] = useState('CHATHAM')
  const [lineItems, setLineItems] = useState([defaultLineItem()])
  const [orderTotal, setOrderTotal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addLine = () => setLineItems((prev) => [...prev, defaultLineItem()])
  const removeLine = (index) => {
    if (lineItems.length <= 1) return
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }
  const updateLine = (index, field, value) => {
    setLineItems((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  const computedTotal = useMemo(() => {
    const sum = lineItems.reduce((acc, line) => acc + (Number(line.lineRevenue) || 0), 0)
    return sum.toFixed(2)
  }, [lineItems])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const id = (orderId || '').toString().trim()
    if (!id) {
      setError('Order ID is required')
      return
    }
    const total = Number(orderTotal) || Number(computedTotal) || 0
    const items = lineItems
      .map((line) => ({
        sku: (line.sku || '').toString().trim(),
        qty: Number(line.qty) || 0,
        lineRevenue: Number(line.lineRevenue) || 0,
      }))
      .filter((line) => line.sku)
    if (items.length === 0) {
      setError('Add at least one line item with a SKU')
      return
    }

    setSubmitting(true)
    const result = await appendOrder({
      orderId: id,
      orderDate: orderDate || new Date().toISOString().slice(0, 10),
      fulfilmentPartner: (fulfilmentPartner || 'CHATHAM').trim(),
      orderTotal: total,
      lineItems: items,
    })
    setSubmitting(false)
    if (result.ok) {
      onSuccess?.()
      onClose?.()
    } else {
      setError(result.message || 'Failed to create order')
    }
  }

  return (
    <div className="create-order-modal-overlay" onClick={onClose}>
      <div className="create-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-order-modal-header">
          <h2>Create order</h2>
          <button type="button" className="create-order-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="create-order-form">
          {error && (
            <div className="create-order-error" role="alert">
              {error}
            </div>
          )}
          <div className="create-order-field">
            <label htmlFor="create-order-id">Order ID</label>
            <input
              id="create-order-id"
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="#1005"
              required
            />
          </div>
          <div className="create-order-field">
            <label htmlFor="create-order-date">Order date</label>
            <input
              id="create-order-date"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
            />
          </div>
          <div className="create-order-field">
            <label htmlFor="create-order-partner">Fulfilment partner</label>
            <input
              id="create-order-partner"
              type="text"
              value={fulfilmentPartner}
              onChange={(e) => setFulfilmentPartner(e.target.value)}
              placeholder="CHATHAM"
            />
          </div>

          <div className="create-order-line-items">
            <div className="create-order-line-items-header">
              <span>Line items</span>
              <button type="button" className="create-order-add-line" onClick={addLine}>
                Add line
              </button>
            </div>
            {lineItems.map((line, index) => (
              <div key={index} className="create-order-line-row">
                <select
                  value={line.sku}
                  onChange={(e) => updateLine(index, 'sku', e.target.value)}
                  required
                  aria-label="SKU"
                >
                  <option value="">Select SKU</option>
                  {skuOptions.map((opt) => (
                    <option key={opt.sku} value={opt.sku}>
                      {opt.sku} – {opt.productName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={line.qty}
                  onChange={(e) => updateLine(index, 'qty', e.target.value)}
                  aria-label="Qty"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Line revenue"
                  value={line.lineRevenue}
                  onChange={(e) => updateLine(index, 'lineRevenue', e.target.value)}
                  aria-label="Line revenue"
                />
                <button type="button" className="create-order-remove-line" onClick={() => removeLine(index)} disabled={lineItems.length <= 1}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="create-order-field">
            <label htmlFor="create-order-total">Order total</label>
            <input
              id="create-order-total"
              type="number"
              min="0"
              step="0.01"
              value={orderTotal || computedTotal}
              onChange={(e) => setOrderTotal(e.target.value)}
              placeholder={computedTotal}
            />
            {computedTotal !== '0.00' && (
              <span className="create-order-computed">Sum of lines: {computedTotal}</span>
            )}
          </div>

          <div className="create-order-actions">
            <button type="button" className="create-order-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-order-submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Create order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
