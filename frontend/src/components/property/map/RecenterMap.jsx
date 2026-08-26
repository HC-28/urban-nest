import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Leaflet helper to smoothly reposition map when city/area changes.
 * Incorporates an isMounted guard to avoid throwing errors if the modal closes prematurely.
 */
export default function RecenterMap({ coords, zoom }) {
    const map = useMap();

    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
            if (!isMounted) return;
            try {
                if (map && typeof map.invalidateSize === "function") {
                    map.invalidateSize();
                }
                if (coords) {
                    map.setView(coords, zoom || map.getZoom());
                }
            } catch {
                // Map instance unmounted or destroyed
            }
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [map, coords, zoom]);

    return null;
}
