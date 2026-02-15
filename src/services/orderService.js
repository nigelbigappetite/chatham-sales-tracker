/**
 * Create order / Mark fulfilled: calls Google Apps Script (append to Orders_Raw, or set FulfilmentDate).
 * In production (Vercel) we use the /api/sheets-app proxy to avoid CORS. Set APP_SCRIPT_WEB_APP_URL in Vercel.
 * In development we call the script URL directly if VITE_APP_SCRIPT_WEB_APP_URL is set.
 */

const isProd = import.meta.env.PROD;
const DEV_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_WEB_APP_URL || '';

function getApiUrl() {
  if (isProd) return '/api/sheets-app';
  return DEV_SCRIPT_URL || '/api/sheets-app';
}

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
  const url = getApiUrl();
  if (!url || url === '') {
    return { ok: false, message: 'Create order is not configured. Add VITE_APP_SCRIPT_WEB_APP_URL to your .env file.' };
  }

  try {
    const response = await fetch(url, {
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
    return { ok: false, message: err.message || 'Failed to send order. In production, set APP_SCRIPT_WEB_APP_URL in Vercel.' };
  }
}

/**
 * Updates FulfilmentDate for all rows with the given orderId in Orders_Raw.
 * @param {string} orderId - e.g. "#1004"
 * @param {string} fulfilmentDate - ISO date string (YYYY-MM-DD) or any format the script can parse
 * @returns {Promise<{ ok: boolean; message?: string }>}
 */
export async function markOrderFulfilled(orderId, fulfilmentDate) {
  const url = getApiUrl();
  if (!url || url === '') {
    return { ok: false, message: 'Mark fulfilled is not configured. Add VITE_APP_SCRIPT_WEB_APP_URL to your .env file.' };
  }

  try {
    const response = await fetch(url, {
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
    return { ok: false, message: err.message || 'Failed to update sheet. In production, set APP_SCRIPT_WEB_APP_URL in Vercel.' };
  }
}
