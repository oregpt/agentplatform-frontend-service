/**
 * Utility functions for formatting data in the UI
 */

/**
 * Format a date string to a human-readable format
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, includeTime = true) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString(undefined, options);
}

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Truncate text if it exceeds a certain length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Format JSON for display, with pretty-printing
 * @param {object} json - JSON object to format
 * @returns {string} Formatted JSON string
 */
export function formatJson(json) {
  if (!json) return '{}';
  
  try {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    return JSON.stringify(json, null, 2);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return '{}';
  }
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}
