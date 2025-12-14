// Google Sheets API service
const SHEET_ID = '1BmS4hI42jae6CiQRayKNSeumGkOD1N8ohlQffZ6PsdQ';
// Get API key from environment variable or use empty string
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';

// Fetch data from a specific sheet tab using Google Sheets API v4 (preferred) or fallback method
export async function fetchSheetData(range) {
  // Try API v4 first if API key is available
  if (API_KEY) {
    try {
      return await fetchSheetDataAPI(range);
    } catch (apiError) {
      console.warn('API v4 failed, falling back to public export method:', apiError);
      // Fall through to fallback method
    }
  }
  
  // Fallback: Using the public JSON export method (works if sheet is public)
  try {
    // URL encode the sheet name to handle spaces and special characters
    const encodedRange = encodeURIComponent(range);
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodedRange}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Parse the response (Google returns JSON wrapped in a callback)
    // Sometimes it's wrapped like: google.visualization.Query.setResponse({...})
    let jsonText = text;
    const jsonStart = text.indexOf('{');
    if (jsonStart !== -1) {
      jsonText = text.substring(jsonStart);
      // Find the matching closing brace
      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = 0; i < jsonText.length; i++) {
        if (jsonText[i] === '{') braceCount++;
        if (jsonText[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      if (jsonEnd !== -1) {
        jsonText = jsonText.substring(0, jsonEnd);
      }
    }
    
    const data = JSON.parse(jsonText);
    
    // Convert to array of objects
    if (!data.table || !data.table.rows) {
      return [];
    }
    
    const headers = data.table.cols.map(col => col.label || '');
    const rows = data.table.rows
      .filter(row => row.c && row.c.length > 0) // Filter out completely empty rows
      .map(row => {
        const obj = {};
        row.c.forEach((cell, index) => {
          const header = headers[index] || `Column${index + 1}`;
          obj[header] = cell && cell.v !== null && cell.v !== undefined ? cell.v : '';
        });
        return obj;
      });
    
    // Filter out rows where all values are empty
    return rows.filter(row => Object.values(row).some(val => val !== ''));
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Method using Google Sheets API v4 (requires API key)
async function fetchSheetDataAPI(range) {
  if (!API_KEY) {
    throw new Error('API key required for this method');
  }
  
  // Format range: if it's a sheet name, use SheetName!A:Z format, otherwise use as-is
  const rangeParam = range.includes('!') ? range : `${range}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(rangeParam)}?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Google Sheets API error: ${data.error.message}`);
    }
    
    if (!data.values || data.values.length === 0) {
      return [];
    }
    
    // For Setup tab, find the header row that contains "SKU" and "Product"
    let headerRowIndex = 0;
    let headers = [];
    
    if (range.toLowerCase().includes('setup')) {
      // Find the row that contains both "SKU" and "Product"
      for (let i = 0; i < Math.min(15, data.values.length); i++) {
        const row = data.values[i] || [];
        const rowValues = row.map(v => (v || '').toString().trim().toLowerCase());
        const hasSKU = rowValues.includes('sku');
        const hasProduct = rowValues.some(v => v === 'product' || v.includes('product'));
        
        if (hasSKU && hasProduct) {
          headerRowIndex = i;
          headers = row.map((h, idx) => {
            const header = (h || '').toString().trim();
            return header || `Column${idx + 1}`;
          });
          console.log(`API: Found header row at index ${i} for ${range}`);
          console.log(`API: Headers:`, headers);
          break;
        }
      }
      
      // If we didn't find a header row, use first row as fallback
      if (headers.length === 0) {
        headers = data.values[0].map((h, idx) => {
          const header = (h || '').toString().trim();
          return header || `Column${idx + 1}`;
        });
      }
    } else {
      // For other tabs, use first row as headers
      headers = data.values[0].map((h, idx) => {
        const header = (h || '').toString().trim();
        return header || `Column${idx + 1}`;
      });
    }
    
    console.log(`API: Fetched ${range}, using headers:`, headers.slice(0, 10));
    
    // Remaining rows after header are data
    const rows = data.values.slice(headerRowIndex + 1);
    
    const result = rows
      .filter(row => row && row.some(cell => cell && cell.toString().trim() !== '')) // Filter empty rows
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          const value = row[index];
          obj[header] = value !== undefined && value !== null ? value.toString() : '';
        });
        return obj;
      });
    
    console.log(`API: Returning ${result.length} rows from ${range}`);
    if (result.length > 0) {
      console.log(`API: Sample row keys:`, Object.keys(result[0]).slice(0, 10));
      console.log(`API: Sample row values:`, Object.entries(result[0]).slice(0, 5));
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching sheet data via API:', error);
    throw error;
  }
}

