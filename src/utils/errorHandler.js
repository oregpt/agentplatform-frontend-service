/**
 * Utility functions for handling API errors and responses
 */

/**
 * Parse and handle API error responses
 * @param {Error} error - Error object from axios or other source
 * @returns {Object} Formatted error with message and details
 */
export function handleApiError(error) {
  // Default error message
  let errorMessage = 'An unexpected error occurred. Please try again.';
  let statusCode = 500;
  let details = null;
  
  // Handle Axios errors
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    statusCode = error.response.status;
    
    // Try to get error message from response
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      
      // Store additional details if available
      details = error.response.data;
    }
    
    // Handle common status codes
    switch (statusCode) {
      case 400:
        if (!errorMessage || errorMessage === 'Bad Request') {
          errorMessage = 'Invalid request. Please check your input and try again.';
        }
        break;
      case 401:
        errorMessage = 'Your session has expired. Please log in again.';
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 422:
        errorMessage = 'Validation error. Please check your input.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        // Use the error message from the response if available
        break;
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'No response from server. Please check your connection and try again.';
    statusCode = 0;
  } else {
    // Something happened in setting up the request
    errorMessage = error.message || errorMessage;
  }
  
  // Log the error for debugging
  console.error('API Error:', {
    message: errorMessage,
    status: statusCode,
    details,
    originalError: error
  });
  
  // Return formatted error object
  return {
    message: errorMessage,
    status: statusCode,
    details,
    isApiError: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format success response
 * @param {Object} response - API response object
 * @returns {Object} Formatted success response
 */
export function formatSuccessResponse(response) {
  return {
    data: response.data,
    status: response.status,
    isSuccess: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Show notification for API errors
 * @param {Object} error - Formatted error from handleApiError
 * @param {Function} notifyFn - Function to show notification (from UI framework)
 */
export function showErrorNotification(error, notifyFn) {
  if (!notifyFn) {
    console.error('Notification function not provided');
    return;
  }
  
  notifyFn({
    title: 'Error',
    text: error.message,
    type: 'error',
    duration: 5000
  });
}

/**
 * Show success notification
 * @param {string} message - Success message to display
 * @param {Function} notifyFn - Function to show notification (from UI framework)
 */
export function showSuccessNotification(message, notifyFn) {
  if (!notifyFn) {
    console.error('Notification function not provided');
    return;
  }
  
  notifyFn({
    title: 'Success',
    text: message,
    type: 'success',
    duration: 3000
  });
}
