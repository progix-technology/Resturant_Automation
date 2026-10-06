/**
 * Formats a numeric amount to Indian Rupee (INR) representation.
 * e.g., 220 -> "₹220", 1250.5 -> "₹1,250.50"
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  
  const num = Number(amount);
  const isWhole = Number.isInteger(num);
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
};
