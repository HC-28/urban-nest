import { useEffect } from "react";
import { BASE_URL } from "../services/apiClient";

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Pings the backend /api/health endpoint every 5 minutes to prevent
 * the Render free-tier instance from spinning down due to inactivity.
 */
export function useKeepAlive() {
    useEffect(() => {
        const ping = async () => {
            try {
                const response = await fetch(`${BASE_URL}/health`, {
                    method: "GET",
                    cache: "no-store",
                });
                if (!response.ok) {
                    console.warn("[KeepAlive] Health check returned:", response.status);
                } else {
                    console.log("[KeepAlive] Backend is alive ✅", new Date().toLocaleTimeString());
                }
            } catch (err) {
                console.warn("[KeepAlive] Failed to reach backend:", err.message);
            }
        };

        // Ping immediately on mount, then every 5 minutes
        ping();
        const intervalId = setInterval(ping, PING_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, []);
}
