/**
 * Vercel serverless proxy to the Google Apps Script web app.
 * Avoids CORS: the browser calls this same-origin API, which forwards to script.google.com.
 * Set APP_SCRIPT_WEB_APP_URL in Vercel Environment Variables to your Web app URL (ends in /exec).
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const url = process.env.APP_SCRIPT_WEB_APP_URL
  if (!url || url.trim() === '') {
    return res.status(500).json({
      success: false,
      error: 'Mark fulfilled / Create order is not configured. Set APP_SCRIPT_WEB_APP_URL in Vercel Environment Variables.',
    })
  }

  try {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    res.setHeader('Content-Type', 'application/json')
    res.status(response.status).send(text)
  } catch (err) {
    console.error('sheets-app proxy error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to reach the sheet.',
    })
  }
}
