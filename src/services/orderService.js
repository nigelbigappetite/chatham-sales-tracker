/**
 * Sends a new order to the Google Apps Script web app, which appends rows to Orders_Raw.
 * Requires VITE_APP_SCRIPT_WEB_APP_URL to be set in .env.
 */

const WEB_APP_URL = import.meta.env.VITE_APP_SCRIPT_WEB_APP_URL || '';

/**
 * @param {{
 *   orderId: string;
 *   orderDate: string;
 *   fulfilmentPartner: string;
 *   orderTotal: number;
 *   lineItems: Array<{ sku: string; qty: number; lineRevenue: number }>;
 * }} payload
 * @returns {Promise<{ ok: boolean; message?: string }>}
 */
export async function appendOrder(payload) {
  if (!WEB_APP_URL || WEB_APP_URL === '') {
    return { ok: false, message: 'Create order is not configured. Add VITE_APP_SCRIPT_WEB_APP_URL to your .env file.' };
  }

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {}

    if (!response.ok) {
      return { ok: false, message: data.error || `Server returned ${response.status}` };
    }
    return { ok: data.success !== false, message: data.error };
  } catch (err) {
    console.error('appendOrder failed:', err);
    return { ok: false, message: err.message || 'Failed to send order. If you see a CORS error, deploy the Apps Script and add the web app URL to .env.' };
  }
}

/**
 * Updates FulfilmentDate for all rows with the given orderId in Orders_Raw.
 * @param {string} orderId - e.g. "#1004"
 * @param {string} fulfilmentDate - ISO date string (YYYY-MM-DD) or any format the script can parse
 * @returns {Promise<{ ok: boolean; message?: string }>}
 */
export async function markOrderFulfilled(orderId, fulfilmentDate) {
  if (!WEB_APP_URL || WEB_APP_URL === '') {
    return { ok: false, message: 'Mark fulfilled is not configured. Add VITE_APP_SCRIPT_WEB_APP_URL to your .env file.' };
  }

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markFulfilled', orderId, fulfilmentDate }),
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {}

    if (!response.ok) {
      return { ok: false, message: data.error || `Server returned ${response.status}` };
    }
    return { ok: data.success !== false, message: data.error };
  } catch (err) {
    console.error('markOrderFulfilled failed:', err);
    return { ok: false, message: err.message || 'Failed to update sheet.' };
  }
}
