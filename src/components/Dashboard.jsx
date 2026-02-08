import { useMemo } from 'react'
import OrdersToFulfill from './OrdersToFulfill'
import CompletedOrders from './CompletedOrders'
import AllOrders from './AllOrders'
import PayoutSummary from './PayoutSummary'
import { formatDateUK } from '../utils/dateFormatter'
import './Dashboard.css'

// Helper function to create SKU to product name mapping from setup data
const createProductNameMap = (setupData) => {
  const map = {}
  if (!setupData || setupData.length === 0) {
    console.log('No setup data available for product name mapping')
    return map
  }
  
  console.log('Creating product name map from', setupData.length, 'setup rows')
  
  // Find the header row (row that contains "SKU" and "Product")
  let headerRowIndex = -1
  let skuColumn = null
  let productColumn = null
  
  // Look for the row that has "SKU" and "Product" as values (this is the header row)
  for (let i = 0; i < Math.min(15, setupData.length); i++) {
    const row = setupData[i]
    const rowValues = Object.values(row).map(v => (v || '').toString().trim().toLowerCase())
    
    // Check if this row contains "sku" and "product" as values
    const hasSKU = rowValues.includes('sku')
    const hasProduct = rowValues.some(v => v === 'product' || v.includes('product'))
    
    if (hasSKU && hasProduct) {
      headerRowIndex = i
      console.log(`Found header row at index ${i}`)
      
      // Find which columns contain SKU and Product
      for (const [key, value] of Object.entries(row)) {
        const val = (value || '').toString().trim().toLowerCase()
        if (val === 'sku' && !skuColumn) {
          skuColumn = key
          console.log(`  SKU column: "${key}"`)
        }
        if ((val === 'product' || val.includes('product')) && !productColumn) {
          productColumn = key
          console.log(`  Product column: "${key}"`)
        }
      }
      break
    }
  }
  
  // If we found the header row, process data rows after it
  if (headerRowIndex >= 0 && skuColumn && productColumn) {
    console.log(`✓ Using header row ${headerRowIndex}, columns: SKU="${skuColumn}", Product="${productColumn}"`)
    let mappedCount = 0
    
    // Process rows after the header
    for (let i = headerRowIndex + 1; i < setupData.length; i++) {
      const item = setupData[i]
      const sku = (item[skuColumn] || '').toString().trim()
      const productName = (item[productColumn] || '').toString().trim()
      
      // Skip empty rows and rows where SKU or Product match the header values
      if (sku && productName && 
          sku.toLowerCase() !== 'sku' && 
          productName.toLowerCase() !== 'product' &&
          !sku.toLowerCase().includes('global') &&
          !productName.toLowerCase().includes('settings')) {
        map[sku] = productName
        map[sku.toLowerCase()] = productName
        mappedCount++
        if (mappedCount <= 5) {
          console.log(`  ✓ Row ${i}: SKU "${sku}" → "${productName}"`)
        }
      }
    }
    console.log(`✓ Successfully mapped ${mappedCount} products`)
  } else {
    // Fallback: try to find columns by name in first row
    console.log('Header row not found, trying column name matching...')
    if (setupData.length > 0) {
      const allKeys = Object.keys(setupData[0] || {})
      
      // Try to find SKU and Product columns by name
      for (const key of allKeys) {
        const keyLower = key.toLowerCase().trim()
        if (keyLower === 'sku' && !skuColumn) {
          skuColumn = key
        }
        if (keyLower === 'product' && !productColumn) {
          productColumn = key
        }
      }
      
      if (skuColumn && productColumn) {
        console.log(`Found columns by name: SKU="${skuColumn}", Product="${productColumn}"`)
        let mappedCount = 0
        setupData.forEach((item, index) => {
          const sku = (item[skuColumn] || '').toString().trim()
          const productName = (item[productColumn] || '').toString().trim()
          
          if (sku && productName && 
              sku.toLowerCase() !== 'sku' && 
              productName.toLowerCase() !== 'product') {
            map[sku] = productName
            map[sku.toLowerCase()] = productName
            mappedCount++
          }
        })
        console.log(`✓ Mapped ${mappedCount} products`)
      } else {
        console.error('Could not find SKU or Product columns')
        console.log('Available columns:', allKeys)
      }
    }
  }
  
  const mapSize = Object.keys(map).length
  console.log('Product name map created with', mapSize, 'entries')
  if (mapSize > 0) {
    console.log('Sample mapped SKUs:', Object.keys(map).slice(0, 10))
    console.log('Sample mappings:', Object.keys(map).slice(0, 5).map(sku => ({
      sku: sku,
      product: map[sku],
      skuLength: sku.length,
      skuType: typeof sku
    })))
  } else {
    console.warn('⚠️ WARNING: Product name map is EMPTY!')
    console.log('Setup data structure:', {
      rowCount: setupData.length,
      firstRowKeys: setupData[0] ? Object.keys(setupData[0]) : [],
      firstRowSample: setupData[0] ? Object.entries(setupData[0]).slice(0, 5) : []
    })
  }
  return map
}

// Helper function to group orders by OrderID
const groupOrdersByOrderID = (orders, productNameMap) => {
  const grouped = {}
  
  orders.forEach(order => {
    const orderID = order['OrderID'] || order['Order Number'] || order['order_number'] || order['Order #'] || ''
    if (!orderID) return
    
    if (!grouped[orderID]) {
      const orderDate = order['OrderDate'] || order['Order Date'] || order['order_date'] || order['Order date'] || ''
      const fulfilledDate = order['FulfilmentDate'] || order['Fulfilment Date'] || order['Fulfilled Date'] || order['fulfilled_date'] || order['Fulfilled date'] || order['Fulfilled'] || ''
      
      const formattedOrderDate = formatDateUK(orderDate)
      const formattedFulfilledDate = formatDateUK(fulfilledDate)
      
      grouped[orderID] = {
        orderNumber: orderID,
        orderDate: formattedOrderDate,
        fulfilledDate: formattedFulfilledDate,
        products: [],
        totalQuantity: 0,
        raw: []
      }
    }
    
    // Get SKU from order - trim it to match setup data
    const sku = (order['SKU'] || order['sku'] || order['Sku'] || '').toString().trim()
    
    // Debug: Log first few orders to see what SKUs we have
    if (Object.keys(grouped).length < 3 && sku) {
      console.log(`[DEBUG] Processing order SKU: "${sku}" (length: ${sku.length})`)
      console.log(`[DEBUG] Order row keys:`, Object.keys(order).filter(k => k.toLowerCase().includes('sku')))
    }
    
    // Look up product name from setup data using SKU
    let productName = 'Unknown Product'
    if (sku && productNameMap) {
      const mapSize = Object.keys(productNameMap).length
      
      // Debug first lookup attempt
      if (Object.keys(grouped).length < 3) {
        console.log(`[DEBUG] Looking up SKU "${sku}" in map (${mapSize} entries)`)
        console.log(`[DEBUG] Map has keys:`, Object.keys(productNameMap).slice(0, 5))
      }
      
      // Try exact match first
      if (productNameMap[sku]) {
        productName = productNameMap[sku]
        if (Object.keys(grouped).length < 3) {
          console.log(`[DEBUG] ✓ Found exact match: "${sku}" → "${productName}"`)
        }
      } else {
        // Try case-insensitive lookup
        const skuLower = sku.toLowerCase()
        if (productNameMap[skuLower]) {
          productName = productNameMap[skuLower]
          if (Object.keys(grouped).length < 3) {
            console.log(`[DEBUG] ✓ Found case-insensitive match: "${skuLower}" → "${productName}"`)
          }
        } else {
          // Try finding by case-insensitive comparison
          const foundKey = Object.keys(productNameMap).find(key => 
            key.toLowerCase() === skuLower && key !== skuLower
          )
          if (foundKey) {
            productName = productNameMap[foundKey]
            if (Object.keys(grouped).length < 3) {
              console.log(`[DEBUG] ✓ Found via key search: "${foundKey}" → "${productName}"`)
            }
          } else {
            // SKU exists but not found in map - detailed debugging
            if (mapSize > 0) {
              console.log(`[DEBUG] ✗ SKU "${sku}" NOT FOUND in product map`)
              console.log(`[DEBUG]   SKU length: ${sku.length}, type: ${typeof sku}`)
              console.log(`[DEBUG]   SKU char codes:`, sku.split('').map(c => c.charCodeAt(0)))
              console.log(`[DEBUG]   Available SKUs in map (first 10):`, Object.keys(productNameMap).slice(0, 10))
              console.log(`[DEBUG]   Comparing with first map SKU:`, {
                orderSKU: sku,
                mapSKU: Object.keys(productNameMap)[0],
                match: sku === Object.keys(productNameMap)[0],
                lowerMatch: sku.toLowerCase() === Object.keys(productNameMap)[0]?.toLowerCase()
              })
            } else {
              console.log(`[DEBUG] ✗ Product map is EMPTY (${mapSize} entries)`)
            }
            productName = 'Unknown Product'
          }
        }
      }
    } else if (!sku) {
      // No SKU - use fallback
      if (Object.keys(grouped).length < 3) {
        console.log(`[DEBUG] No SKU found in order, using fallback`)
        console.log(`[DEBUG] Order keys:`, Object.keys(order))
      }
      productName = order['Product Name'] || order['ProductName'] || order['product_name'] || 
                    order['Product'] || order['Title'] || order['Name'] || 
                    order['Items'] || order['items'] || order['Line Items'] || 'Unknown Product'
    } else {
      if (Object.keys(grouped).length < 3) {
        console.log(`[DEBUG] No productNameMap available`)
      }
    }
    
    const quantity = parseFloat(order['Qty'] || order['Quantity'] || order['quantity'] || 0)
    
    grouped[orderID].products.push({
      name: productName,
      sku: sku,
      quantity: quantity
    })
    grouped[orderID].totalQuantity += quantity
    grouped[orderID].raw.push(order)
  })
  
  return Object.values(grouped)
}

const Dashboard = ({ orders, settlements, setupData }) => {
  // Create product name mapping from setup data
  const productNameMap = useMemo(() => {
    console.log('Dashboard: setupData received', setupData?.length || 0, 'rows')
    return createProductNameMap(setupData)
  }, [setupData])
  // Process orders to fulfill (has order date but no fulfilled date)
  const ordersToFulfill = useMemo(() => {
    if (!orders || orders.length === 0) return []
    
    const filtered = orders.filter(order => {
      const orderDate = order['OrderDate'] || order['Order Date'] || order['order_date'] || order['Order date'] || ''
      const fulfilledDate = order['FulfilmentDate'] || order['Fulfilment Date'] || order['Fulfilled Date'] || order['fulfilled_date'] || order['Fulfilled date'] || order['Fulfilled'] || ''
      
      // Has order date but no fulfilled date (check for empty strings too)
      return orderDate && orderDate.toString().trim() !== '' && (!fulfilledDate || fulfilledDate.toString().trim() === '')
    })
    
    return groupOrdersByOrderID(filtered, productNameMap)
  }, [orders, productNameMap])

  // Process completed orders (has fulfilled date)
  const completedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []
    
    const filtered = orders.filter(order => {
      const fulfilledDate = order['FulfilmentDate'] || order['Fulfilment Date'] || order['Fulfilled Date'] || order['fulfilled_date'] || order['Fulfilled date'] || order['Fulfilled'] || ''
      // Check that fulfilledDate exists and is not empty
      return fulfilledDate && fulfilledDate.toString().trim() !== ''
    })
    
    const grouped = groupOrdersByOrderID(filtered, productNameMap)
    
    // Sort by fulfilled date, most recent first
    return grouped.sort((a, b) => {
      // Parse UK date format (DD/MM/YYYY) for sorting
      const parseUKDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return new Date(0)
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0])
        }
        return new Date(dateStr)
      }
      const dateA = parseUKDate(a.fulfilledDate)
      const dateB = parseUKDate(b.fulfilledDate)
      return dateB - dateA
    })
  }, [orders, productNameMap])

  // Process all orders (back populate everything)
  const allOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []
    
    const grouped = groupOrdersByOrderID(orders, productNameMap)
    
    // Sort by order date, most recent first (or by fulfilled date if order date is missing)
    return grouped.sort((a, b) => {
      // Parse UK date format (DD/MM/YYYY) for sorting
      const parseUKDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return new Date(0)
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0])
        }
        return new Date(dateStr)
      }
      const dateA = parseUKDate(a.orderDate) || parseUKDate(a.fulfilledDate) || new Date(0)
      const dateB = parseUKDate(b.orderDate) || parseUKDate(b.fulfilledDate) || new Date(0)
      return dateB - dateA
    })
  }, [orders, productNameMap])

  // Process payout summary from Chatham_Settlement
  const payoutData = useMemo(() => {
    if (!settlements || settlements.length === 0) {
      console.log('No settlement data available for payout summary')
      return []
    }
    
    console.log(`Processing ${settlements.length} settlement rows`)
    if (settlements.length > 0) {
      console.log('Sample settlement row keys:', Object.keys(settlements[0]))
      console.log('Sample settlement row:', settlements[0])
    }
    
    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    // Get next month key to exclude future months
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
    
    console.log(`Current month key: ${currentMonthKey}, Next month key: ${nextMonthKey}`)
    
    // The settlement data already has Month, MonthKey, Packs, and AmountOwed
    // Each row is already a monthly summary
    const processed = settlements
      .map((settlement, index) => {
        const month = settlement['Month'] || settlement['month'] || settlement['Month Name'] || ''
        const monthKey = String(settlement['MonthKey'] || settlement['monthKey'] || settlement['Month Key'] || settlement['MonthKey'] || '')
        
        // Try to find Packs column - check various formats
        const packsRaw = settlement['Packs'] || settlement['packs'] || settlement['Pack'] || settlement['Total Packs'] || settlement['totalPacks'] || 0
        // Remove currency symbols, commas, and whitespace before parsing
        const packsStr = String(packsRaw).replace(/[£$,\s]/g, '').trim()
        const packs = parseFloat(packsStr) || 0
        
        // Try to find AmountOwed column - check various formats
        const amountRaw = settlement['AmountOwed'] || settlement['amountOwed'] || settlement['Amount Owed'] || 
                         settlement['Payout'] || settlement['payout'] || settlement['Total Payout'] || 
                         settlement['totalPayout'] || settlement['Amount'] || settlement['amount'] || 0
        // Remove currency symbols, commas, and whitespace before parsing
        const amountStr = String(amountRaw).replace(/[£$,\s]/g, '').trim()
        const amountOwed = parseFloat(amountStr) || 0
        
        if (index < 5) {
          console.log(`Settlement row ${index}:`, {
            month,
            monthKey,
            packsRaw: packsRaw,
            packsParsed: packs,
            amountRaw: amountRaw,
            amountParsed: amountOwed,
            allKeys: Object.keys(settlement),
            sampleValues: Object.entries(settlement).slice(0, 5).map(([k, v]) => ({ [k]: v }))
          })
        }
        
        if (!month || !monthKey || monthKey === '') {
          if (index < 3) {
            console.log(`Skipping row ${index}: missing month or monthKey`)
          }
          return null
        }
        
        // Check for NaN values
        if (isNaN(packs) || isNaN(amountOwed)) {
          console.warn(`Row ${index} has NaN values:`, {
            month,
            packs: packs,
            amountOwed: amountOwed,
            packsRaw,
            amountRaw
          })
        }
        
        return {
          month: month,
          monthKey: monthKey,
          totalPacks: isNaN(packs) ? 0 : packs,
          totalPayout: isNaN(amountOwed) ? 0 : amountOwed,
          orders: [{ packs: isNaN(packs) ? 0 : packs, payout: isNaN(amountOwed) ? 0 : amountOwed }]
        }
      })
      .filter(item => {
        if (!item || !item.monthKey) return false
        // Show previous months and current month (exclude future months)
        const shouldShow = item.monthKey < nextMonthKey
        if (!shouldShow && item) {
          console.log(`Filtering out future month: ${item.month} (${item.monthKey})`)
        }
        return shouldShow
      })
      .sort((a, b) => {
        // Ensure both monthKeys are strings before comparing
        const keyA = String(a.monthKey || '')
        const keyB = String(b.monthKey || '')
        return keyB.localeCompare(keyA)
      })
    
    console.log(`Processed ${processed.length} payout entries`)
    if (processed.length > 0) {
      console.log('Payout entries:', processed.map(p => ({ month: p.month, packs: p.totalPacks, payout: p.totalPayout })))
    }
    
    return processed
  }, [settlements])

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <OrdersToFulfill orders={ordersToFulfill} />
        </div>
        <div className="dashboard-section">
          <CompletedOrders orders={completedOrders} />
        </div>
        <div className="dashboard-section full-width">
          <AllOrders orders={allOrders} />
        </div>
        <div className="dashboard-section full-width">
          <PayoutSummary payouts={payoutData} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard

