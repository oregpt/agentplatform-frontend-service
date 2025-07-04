/**
 * Utility functions for form validation
 */

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validatePassword(password) {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: 'Password is valid' };
}

/**
 * Validate required field
 * @param {string} value - Field value
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export function validateRequired(value, fieldName = 'Field') {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true, message: '' };
}

/**
 * Validate minimum length
 * @param {string} value - Field value
 * @param {number} minLength - Minimum length required
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export function validateMinLength(value, minLength, fieldName = 'Field') {
  if (!value || value.length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }
  return { isValid: true, message: '' };
}

/**
 * Validate maximum length
 * @param {string} value - Field value
 * @param {number} maxLength - Maximum length allowed
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export function validateMaxLength(value, maxLength, fieldName = 'Field') {
  if (value && value.length > maxLength) {
    return { isValid: false, message: `${fieldName} must not exceed ${maxLength} characters` };
  }
  return { isValid: true, message: '' };
}

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} Validation result with isValid, message, and parsed JSON if valid
 */
export function validateJson(jsonString) {
  if (!jsonString || jsonString.trim() === '') {
    return { isValid: false, message: 'JSON is required', json: null };
  }
  
  try {
    const json = JSON.parse(jsonString);
    return { isValid: true, message: '', json };
  } catch (error) {
    return { isValid: false, message: 'Invalid JSON format', json: null };
  }
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {Object} Validation result with isValid and message
 */
export function validateFileType(file, allowedTypes) {
  if (!file) {
    return { isValid: false, message: 'No file selected' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      message: `File type not supported. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeInBytes - Maximum file size in bytes
 * @returns {Object} Validation result with isValid and message
 */
export function validateFileSize(file, maxSizeInBytes) {
  if (!file) {
    return { isValid: false, message: 'No file selected' };
  }
  
  if (file.size > maxSizeInBytes) {
    const maxSizeMB = maxSizeInBytes / (1024 * 1024);
    return { 
      isValid: false, 
      message: `File is too large. Maximum size is ${maxSizeMB} MB` 
    };
  }
  
  return { isValid: true, message: '' };
}
