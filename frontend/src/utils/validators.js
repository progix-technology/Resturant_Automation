/**
 * Validates full name (must not be empty and at least 2 characters)
 */
export const isValidName = (name) => {
  return typeof name === 'string' && name.trim().length >= 2;
};

/**
 * Validates Indian 10-digit mobile number (starts with 6, 7, 8, or 9)
 */
export const isValidIndianMobile = (mobile) => {
  if (!mobile) return false;
  const cleanMobile = String(mobile).replace(/\D/g, '');
  const indianMobileRegex = /^[6-9]\d{9}$/;
  return indianMobileRegex.test(cleanMobile);
};

/**
 * Validates table number (must be non-empty, alphanumeric or numeric, max 10 chars)
 */
export const isValidTableNumber = (table) => {
  if (!table) return false;
  const cleanTable = String(table).trim();
  return cleanTable.length > 0 && cleanTable.length <= 10;
};
