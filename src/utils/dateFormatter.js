// Format date to UK format (DD/MM/YYYY)
export function formatDateUK(dateString) {
  if (!dateString || (typeof dateString === 'string' && dateString.trim() === '')) {
    return 'N/A'
  }
  
  try {
    // Handle date objects
    if (dateString instanceof Date) {
      const day = String(dateString.getDate()).padStart(2, '0')
      const month = String(dateString.getMonth() + 1).padStart(2, '0')
      const year = dateString.getFullYear()
      return `${day}/${month}/${year}`
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // If it's already in a format, try to parse it differently
      // Handle common date formats
      const parts = dateString.toString().split(/[-\/]/)
      if (parts.length === 3) {
        // Could be YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
        // Try to determine format
        if (parts[0].length === 4) {
          // YYYY-MM-DD format
          const day = parts[2].padStart(2, '0')
          const month = parts[1].padStart(2, '0')
          const year = parts[0]
          return `${day}/${month}/${year}`
        } else {
          // Assume DD/MM/YYYY or MM/DD/YYYY - check if first part > 12
          if (parseInt(parts[0]) > 12) {
            // DD/MM/YYYY
            return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`
          } else {
            // Could be MM/DD/YYYY, convert to DD/MM/YYYY
            return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`
          }
        }
      }
      return dateString
    }
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    return dateString
  }
}

