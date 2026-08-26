/**
 * Geospatial and Color helper utilities for Heatmap.
 */

export function extractFeaturePincode(feature) {
    if (!feature || !feature.properties) return "";
    return String(
        feature.properties.pin_code ||
        feature.properties.pincode ||
        feature.properties.PINCODE ||
        ""
    ).trim();
}

export function extractFeatureName(feature) {
    if (!feature || !feature.properties) return "Unknown Area";
    return (
        feature.properties.area_name ||
        feature.properties.name ||
        feature.properties.AREA ||
        "Unknown Area"
    );
}

/**
 * Calculates mathematical centroid of Polygon / MultiPolygon geometries.
 * Guarantees accurate map centering on neighborhood centers instead of perimeter vertices.
 */
export function getPolygonCentroid(coordinates, type) {
    if (!coordinates || coordinates.length === 0) return null;
    let coords = coordinates;
    if (type === 'Polygon') coords = coordinates[0];
    else if (type === 'MultiPolygon') coords = coordinates[0][0];
    if (!coords || coords.length === 0) return null;

    const avgLng = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
    const avgLat = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;
    return [avgLat, avgLng];
}

/**
 * Computes polygon fill color based on current heatmap mode, active listings, and static bins.
 * Enforces the documented minimum threshold guard (<5 listings rendered as low density).
 */
export function getZoneColor(feature, heatmapData, heatmapMode, palette, staticBinsMap) {
    const geoPincode = extractFeaturePincode(feature);
    const data = heatmapData[geoPincode];
    if (!data || !data.activeListings) return "#f0f0f0";

    // Enforce minimum 5 listings threshold
    if (data.activeListings < 5) {
        return (palette?.colors?.[0] || "#93c5fd") + "44"; // Translucent indicator for low density
    }

    const val = heatmapMode === 'price' ? (data.medianPrice ?? null) : (data.score ?? null);
    if (val === null || val === undefined) return "#f0f0f0";

    const [p33, p66] = staticBinsMap[heatmapMode] || [33, 66];
    if (val <= p33) return palette.colors[0];
    if (val <= p66) return palette.colors[1];
    return palette.colors[2];
}
