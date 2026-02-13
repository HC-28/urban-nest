/**
 * Utility functions for handling property images
 */

/**
 * Parse photos string from database into an array of image URLs
 * Handles comma-separated base64 strings properly by splitting on 'data:image' prefix
 * 
 * @param {string|array} photos - The photos field from the database
 * @returns {string[]} - Array of image URLs/base64 strings
 */
export function parsePropertyImages(photos) {
    if (!photos) return [];

    // If already an array, return as-is
    if (Array.isArray(photos)) return photos;

    // If it's a string, check if it contains base64 images
    if (typeof photos === 'string') {
        // Handle potential JSON string from some DB configurations
        if (photos.startsWith('[') && photos.endsWith(']')) {
            try {
                const parsed = JSON.parse(photos);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // Ignore parse error
            }
        }

        // Check if it looks like a URL or Base64
        if (photos.startsWith('http') || photos.startsWith('data:image')) {
            if (photos.includes('data:image')) {
                const parts = photos.split('data:image');
                const images = [];
                for (let i = 1; i < parts.length; i++) {
                    let img = 'data:image' + parts[i];
                    if (img.endsWith(',')) img = img.slice(0, -1);
                    images.push(img);
                }
                return images;
            }
            return [photos];
        }

        // If it's just a short string (like an OID "12345"), ignore it
        if (photos.length < 50 && !photos.includes('/')) {
            return [];
        }

        // Fallback: return as is, hoping it's a URL
        return [photos];
    }

    return [];
}

/**
 * Get the first image from photos, with fallback
 * 
 * @param {string|array} photos - The photos field from the database
 * @param {string} fallback - Fallback image URL
 * @returns {string} - First image URL or fallback
 */
export function getFirstImage(photos, fallback = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200") {
    const images = parsePropertyImages(photos);
    return images.length > 0 ? images[0] : fallback;
}
