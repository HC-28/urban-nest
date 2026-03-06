/**
 * Recently Viewed Properties — localStorage-based tracking.
 * Stores the last 6 viewed properties for quick access.
 */

const STORAGE_KEY = "recentlyViewedProperties";
const MAX_ITEMS = 6;

/**
 * Add a property to the recently viewed list.
 * @param {Object} property — must have { id, title, price, city, location, photos }
 */
export function addToRecentlyViewed(property) {
    if (!property?.id) return;

    try {
        const existing = getRecentlyViewed();

        // Build a lightweight summary (don't store the entire property object)
        const summary = {
            id: property.id,
            title: property.title || "Untitled",
            price: property.price || 0,
            city: property.city || "",
            location: property.location || "",
            photo: getFirstPhoto(property),
            viewedAt: Date.now(),
        };

        // Remove if already exists (we'll re-add at front)
        const filtered = existing.filter((p) => p.id !== property.id);

        // Add to front, trim to max
        const updated = [summary, ...filtered].slice(0, MAX_ITEMS);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        // localStorage may be full or disabled — fail silently
    }
}

/**
 * Get the recently viewed properties list.
 * @returns {Array} — array of property summaries, newest first
 */
export function getRecentlyViewed() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Clear all recently viewed.
 */
export function clearRecentlyViewed() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Extract the first photo URL from a property's photos field.
 */
function getFirstPhoto(property) {
    if (!property.photos) return null;

    // photos can be a comma-separated string or JSON array
    try {
        if (property.photos.startsWith("[")) {
            const arr = JSON.parse(property.photos);
            return arr[0] || null;
        }
        return property.photos.split(",")[0]?.trim() || null;
    } catch {
        return property.photos.split(",")[0]?.trim() || null;
    }
}
