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

    // If it's a string, check if it contains base64 images or URLs
    if (typeof photos === 'string') {
        // Handle empty or very short strings early
        if (!photos || photos.trim() === "") return [];

        // Handle potential JSON string from some DB configurations
        if (photos.startsWith('[') && photos.endsWith(']')) {
            try {
                const parsed = JSON.parse(photos);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // Ignore parse error and try comma splitting
            }
        }

        // 1. Check for Base64 bundle (our previous format)
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

        // 2. Check for comma-separated Cloudinary/HTTP URLs
        if (photos.includes(',') || photos.startsWith('http')) {
            return photos.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }

        // Fallback: return as is if it looks like something valid
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
export function getFirstImage(photos, fallback = "/placeholder.jpg") {
    const images = parsePropertyImages(photos);
    return images.length > 0 ? images[0] : fallback;
}
