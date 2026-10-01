import { PURPOSES, PROPERTY_TYPES } from "../../../utils/constants";

/* ── Cities Supported ── */
export const CITIES = [
    { name: "Ahmedabad", coords: [23.0225, 72.5714], zoom: 12, geoFile: "ahmedabad.geojson" },
    { name: "Mumbai", coords: [19.0760, 72.8777], zoom: 11, geoFile: "mumbai.geojson" },
    { name: "Bangalore", coords: [12.9716, 77.5946], zoom: 11, geoFile: "bangalore.geojson" }
];

/* ── Color palettes (3 gradient colors per mode) ── */
export const DYNAMIC_PALETTES = {
    price: { title: "Price per sq.ft (₹)", colors: ["#22c55e", "#fb923c", "#dc2626"] },
    inventory: { title: "Inventory Level", colors: ["#93c5fd", "#3b82f6", "#1e3a8a"] },
    buyer_opportunity: { title: "Buyer Opportunity", colors: ["#a5f3fc", "#06b6d4", "#0e7490"] },
    demand: { title: "Demand (Agent)", colors: ["#fde68a", "#fbbf24", "#92400e"] },
    liquidity: { title: "Liquidity Score", colors: ["#bbf7d0", "#4ade80", "#14532d"] }
};

/* ── Score info descriptions & tips ── */
export const SCORE_DESCRIPTIONS = {
    price: {
        title: "💰 Price Index",
        description: "Median price per square foot across neighborhoods. Warmer colors = higher-priced areas, cooler = more affordable. Click any area to see listings.",
        tip: "Pro Tip: Compare with Inventory — low price + high inventory = great deals with negotiation room."
    },
    inventory: {
        title: "📦 Inventory Level",
        description: "Active property listings per area. More listings = more buyer choices and negotiation room. Fewer = tighter market, faster sales.",
        tip: "Pro Tip: High inventory gives you leverage. Low inventory + high demand means rising prices and competition."
    },
    buyer_opportunity: {
        title: "🏠 Buyer Opportunity",
        description: "Combines price, inventory, and demand to highlight areas favoring buyers. High scores = good conditions for buying.",
        tip: "Pro Tip: Best starting point for first-time buyers! Focus on high-opportunity areas for the best deals."
    },
    demand: {
        title: "📈 Demand Score (Agent View)",
        description: "Buyer demand relative to available listings. High demand = more buyers than properties — ideal for agents looking to list.",
        tip: "Pro Tip: List in high-demand areas with competitive pricing for fastest sales."
    },
    liquidity: {
        title: "💧 Liquidity Score (Agent View)",
        description: "How quickly properties sell in each area. High liquidity = fast sales. Low = longer cycles.",
        tip: "Pro Tip: High liquidity = quick flips. Low liquidity = longer marketing but often better margins."
    }
};

/* ── Map Tile Layers ── */
export const TILE_LAYERS = {
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        label: "Dark",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    light: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        label: "Light",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        label: "Satellite",
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    }
};

/* ── Static Bins Configuration Per Mode ── */
export const STATIC_BINS_MAP = {
    price: [10000, 20000],
    inventory: [15, 30],
    buyer_opportunity: [40, 70],
    demand: [30, 60],
    liquidity: [40, 75]
};

/* ── Modes Definition ── */
export const getModes = (isAgent) => [
    { value: "price", label: "Price Heatmap", icon: "💰" },
    { value: "inventory", label: "Inventory", icon: "📦" },
    { value: "buyer_opportunity", label: "Opportunity", icon: "🏠" },
    ...(isAgent ? [
        { value: "demand", label: "Demand", icon: "📈" },
        { value: "liquidity", label: "Liquidity", icon: "💧" }
    ] : [])
];
