/**
 * Formats a price number into a comma-separated string (e.g., 1,00,00,000)
 * Does NOT convert to Lakh or Crore as per user request.
 * @param {number|string} price - The price to format
 * @returns {string} - Formatted price string with ₹ symbol
 */
export const formatPrice = (price) => {
    if (!price || isNaN(price)) return "Price on Request";

    // Convert to number
    const numPrice = Number(price);

    // Format using Indian locale
    return `₹${numPrice.toLocaleString("en-IN")}`;
};
