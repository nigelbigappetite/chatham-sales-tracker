# Wingverse Order Tracker

A dashboard for tracking sauce pack orders and payouts for Chatham Wing Shack kitchen.

## Features

- **Orders to Fulfill**: Displays all orders that have an order date but no fulfilled date
- **Completed Orders**: Shows all orders that have been fulfilled, sorted by most recent (green accents)
- **Create Order**: Add new orders from the dashboard; they are appended to the **Orders_Raw** sheet via a Google Apps Script web app
- **Monthly Payout Summary**: Calculates monthly payouts based on the Chatham_Settlement sheet at £0.70 per sauce pack

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure your Google Sheet is publicly accessible:
   - Open your Google Sheet
   - Click "Share" → "Get link" → Set to "Anyone with the link can view"
   - Or use File → Share → Publish to web (for CSV export)

3. The sheet ID is already configured: `1BmS4hI42jae6CiQRayKNSeumGkOD1N8ohlQffZ6PsdQ`

4. **Create Order / Mark fulfilled (optional):** Add the Apps Script from `scripts/AppendOrderToSheet.gs` to your sheet (Extensions → Apps Script), deploy as a Web app (Anyone). For **local dev** set `VITE_APP_SCRIPT_WEB_APP_URL` in `.env`. For **production (Vercel)** set `APP_SCRIPT_WEB_APP_URL` in Vercel → Settings → Environment Variables (the app uses a serverless proxy to avoid CORS).

## Running the Dashboard

Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Google Sheets Structure

The dashboard expects two tabs in your Google Sheet:

1. **orders_raw**: Contains order data with columns:
   - Order Date (or order_date, Order date)
   - Fulfilled Date (or fulfilled_date, Fulfilled date, Fulfilled)
   - Order Number (or order_number, Order #)
   - Customer Name (or customer_name, Customer)
   - Items (or items, Line Items)
   - Quantity (or quantity, Qty)

2. **Chatham_Settlement**: Contains settlement data with columns:
   - Date (or date, Order Date, order_date, Settlement Date)
   - Quantity (or quantity, Qty, Packs, packs)
   - Order Number (or order_number, Order #)

## Payout Calculation

- Each sauce pack (including starter packs with sauce packs) = £0.70
- Payouts are calculated monthly based on the order date in Chatham_Settlement
- Monthly totals show the number of packs and total payout amount

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

