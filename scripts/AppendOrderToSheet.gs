/**
 * Google Apps Script: Append Order to Orders_Raw
 *
 * 1. In your Google Sheet: Extensions → Apps Script
 * 2. Paste this entire file (replace Code.gs if it exists)
 * 3. Deploy: Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL (ends in /exec) into your .env as VITE_APP_SCRIPT_WEB_APP_URL
 *
 * POST body (JSON):
 * {
 *   "orderId": "#1005",
 *   "orderDate": "2026-02-09",
 *   "fulfilmentPartner": "CHATHAM",
 *   "orderTotal": 45.99,
 *   "lineItems": [
 *     { "sku": "WVSHACK500G", "qty": 1, "lineRevenue": 14.99 },
 *     { "sku": "WVHONEYMUST500", "qty": 2, "lineRevenue": 30.98 }
 *   ]
 * }
 */

function doPost(e) {
  try {
    const payload = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;
    if (!payload || !payload.orderId || !payload.lineItems || !payload.lineItems.length) {
      return createJsonResponse(400, { success: false, error: 'Missing orderId or lineItems' });
    }

    const sheet = getOrdersRawSheet();
    const orderDate = formatDateForSheet(payload.orderDate);
    const partner = payload.fulfilmentPartner || 'CHATHAM';
    const orderTotal = Number(payload.orderTotal) || 0;

    const rows = payload.lineItems.map(function (item) {
      return [
        String(payload.orderId),
        orderDate,
        '', // FulfilmentDate - empty until shipped
        String(partner),
        String(item.sku || ''),
        Number(item.qty) || 0,
        Number(item.lineRevenue) || 0,
        orderTotal
      ];
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, sheet.getLastRow() + rows.length, 8).setValues(rows);
    return createJsonResponse(200, { success: true, rowsAdded: rows.length });
  } catch (err) {
    console.error(err);
    return createJsonResponse(500, { success: false, error: err.toString() });
  }
}

function getOrdersRawSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Orders_Raw');
  if (!sheet) sheet = ss.getSheetByName('orders_raw');
  if (!sheet) throw new Error('Sheet "Orders_Raw" or "orders_raw" not found');
  return sheet;
}

function formatDateForSheet(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT', 'M/d/yyyy');
}

function createJsonResponse(statusCode, body) {
  var output = ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
