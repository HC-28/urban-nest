/**
 * Formats a price number into a comma-separated string (e.g., 1,00,00,000)
 * Does NOT convert to Lakh or Crore as per user request.
 * @param {number|string} price - The price to format
 * @returns {string} - Formatted price string with ₹ symbol
 */
export const formatPrice = (price) => {
    if (!price || isNaN(price)) return "Price on Request";

    const numPrice = Number(price);

    if (numPrice >= 10000000) {
        return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
    }
    if (numPrice >= 100000) {
        return `₹${(numPrice / 100000).toFixed(2)} L`;
    }

    return `₹${numPrice.toLocaleString("en-IN")}`;
};
