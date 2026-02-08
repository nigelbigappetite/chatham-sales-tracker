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
 * POST body (JSON) – create order:
 * { "orderId": "#1005", "orderDate": "2026-02-09", "fulfilmentPartner": "CHATHAM", "orderTotal": 45.99, "lineItems": [...] }
 *
 * POST body (JSON) – mark order as fulfilled (sets FulfilmentDate for all rows with that OrderID):
 * { "action": "markFulfilled", "orderId": "#1004", "fulfilmentDate": "2026-02-09" }
 */

function doPost(e) {
  try {
    const payload = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;
    if (!payload) {
      return createJsonResponse(400, { success: false, error: 'Invalid payload' });
    }

    if (payload.action === 'markFulfilled') {
      return handleMarkFulfilled(payload);
    }

    if (!payload.orderId || !payload.lineItems || !payload.lineItems.length) {
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

function handleMarkFulfilled(payload) {
  var orderId = payload.orderId ? String(payload.orderId).trim() : '';
  var fulfilmentDateStr = payload.fulfilmentDate ? String(payload.fulfilmentDate).trim() : '';
  if (!orderId || !fulfilmentDateStr) {
    return createJsonResponse(400, { success: false, error: 'Missing orderId or fulfilmentDate' });
  }
  var sheet = getOrdersRawSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return createJsonResponse(200, { success: true, rowsUpdated: 0 });
  }
  var headers = data[0];
  var orderIdCol = 0;
  var fulfilmentDateCol = 2;
  var updated = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var cellOrderId = row[orderIdCol] != null ? String(row[orderIdCol]).trim() : '';
    if (cellOrderId === orderId) {
      row[fulfilmentDateCol] = formatDateForSheet(fulfilmentDateStr);
      updated++;
    }
  }
  if (updated > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data.slice(1));
  }
  return createJsonResponse(200, { success: true, rowsUpdated: updated });
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
