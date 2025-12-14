# Google Sheets API Setup Guide

To connect your dashboard to Google Sheets properly, you'll need a Google Sheets API key. This provides more reliable data access and better error handling.

## Step 1: Get a Google Sheets API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "Wingverse Tracker")

3. **Enable Google Sheets API**
   - In the search bar, type "Google Sheets API"
   - Click on "Google Sheets API"
   - Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key that appears

5. **Restrict the API Key (Recommended for Security)**
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Click "Save"

## Step 2: Add API Key to Your Project

1. **Create a `.env` file** in the project root (same folder as `package.json`)

2. **Add your API key:**
   ```
   VITE_GOOGLE_SHEETS_API_KEY=your_actual_api_key_here
   ```
   Replace `your_actual_api_key_here` with the API key you copied.

3. **Restart the development server**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

## Step 3: Make Your Sheet Accessible

Your Google Sheet needs to be accessible to the API:

**Option A: Public Sheet (Easiest)**
- Open your Google Sheet
- Click "Share" → "Get link"
- Set to "Anyone with the link can view"
- The API key will work with public sheets

**Option B: Private Sheet with Service Account (Advanced)**
- This requires additional setup with service account credentials
- Contact support if you need this option

## Troubleshooting

- **"API key not valid"**: Make sure you copied the entire key correctly
- **"Permission denied"**: Make sure the sheet is shared publicly or the API key has access
- **"API not enabled"**: Go back to Google Cloud Console and enable "Google Sheets API"
- **Still using fallback method**: Check that your `.env` file is in the root directory and restart the dev server

## Benefits of Using API Key

✅ More reliable data fetching
✅ Better error messages
✅ Proper column name handling
✅ No parsing issues with special characters
✅ Works with private sheets (with service account)

