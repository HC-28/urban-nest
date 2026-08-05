/**
 * Safe localStorage utilities with error handling.
 * Prevents application crashes from corrupted JSON, XSS sanitization, or disabled cookies.
 */

export function getStorageUser() {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn("[StorageUtils] Failed to parse user from localStorage:", e);
        return null;
    }
}

export function getStorageItem(key, fallback = null) {
    try {
        const item = localStorage.getItem(key);
        return item !== null ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

export function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn(`[StorageUtils] Failed to set ${key} in localStorage:`, e);
    }
}

export function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // Ignore removal error
    }
}
