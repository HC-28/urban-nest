import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";
import heroBg from "../assets/re-back.jpg";
import ahmImg from "../assets/ahm.jpg";
import gurgaonImg from "../assets/gurgaon.jpg";
import mumbaiImg from "../assets/Mumbai.jpeg";
import puneImg from "../assets/Pune.jpg";
import delhiImg from "../assets/delhi.jpg";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import { propertyApi } from "../api/api";
import { parsePropertyImages } from "../utils/imageUtils";
import { formatPrice } from "../utils/priceUtils";

function FeaturedProperty({ images, title, location, price, bhk, area, type, onClick }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const timeoutRef = useRef(null);

    // Auto-scroll logic: 5000ms
    useEffect(() => {
        const startTimer = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                setCurrentImageIndex((prev) =>
                    prev === (images?.length || 1) - 1 ? 0 : prev + 1
                );
            }, 5000); // 5 Seconds
        };

        if (!isHovering && images && images.length > 1) {
            startTimer();
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentImageIndex, isHovering, images]);

    const displayImage = images && images.length > 0
        ? images[currentImageIndex]
        : "https://via.placeholder.com/300";

    // Resume auto-scroll immediately on mouse leave logic handled by dependency array

    return (
        <div className="property-card" onClick={onClick} style={{
            cursor: "pointer",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            transition: "all 0.3s ease",
            background: "#fff",
            border: "1px solid #e2e8f0"
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.12)";
                setIsHovering(true);
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                setIsHovering(false);
            }}
        >
            <div className="property-image" style={{ height: "220px", position: "relative" }}>
                <img
                    src={displayImage}
                    alt={title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s ease" }}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                />
                <span className="property-tag" style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "#2563eb",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                }}>{type}</span>

                {/* Image indicators */}
                {images && images.length > 1 && (
                    <div style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: "6px",
                        zIndex: 2
                    }}>
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: idx === currentImageIndex ? "24px" : "6px",
                                    height: "6px",
                                    borderRadius: "4px",
                                    background: idx === currentImageIndex ? "#fff" : "rgba(255,255,255,0.5)",
                                    transition: "all 0.3s ease",
                                    cursor: "pointer"
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex(idx);
                                    // Timer will reset automatically due to useEffect dependency
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="property-details" style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h4 className="property-price" style={{ color: "#0ea5e9", fontSize: "1.25rem", margin: 0, fontWeight: "700" }}>{price}</h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", fontWeight: "600" }}>
                        {area} sqft
                    </span>
                </div>

                <h3 className="property-title" style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#1e293b", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h3>

                <p className="property-location" style={{ color: "#64748b", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", margin: "0 0 16px 0" }}>
                    <span>📍</span> {location}
                </p>

                <div className="property-meta" style={{
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "12px",
                    display: "flex",
                    gap: "16px",
                    fontSize: "0.85rem",
                    color: "#475569"
                }}>
                    <span>🛏️ {bhk} BHK</span>
                    <span>📐 {area} sqft</span>
                </div>
            </div>
        </div>
    );
}

function FeatureBox({ icon, title, description, cta, onClick }) {
    return (
        <div className="feature-box" onClick={onClick}>
            <div className="feature-icon">{icon}</div>
            <h4>{title}</h4>
            <p>{description}</p>
            <button className="explore-btn">
                {cta} <FiArrowRight />
            </button>
        </div>
    );
}

function CityCircle({ city, count, image, onClick }) {
    return (
        <div className="city-item" onClick={onClick}>
            <div className="city-pic" style={{ backgroundImage: image ? `url(${image})` : "none" }}></div>
            <div className="city-name">{city}</div>
            <div className="city-count">{count}+ Properties</div>
        </div>
    );
}

function Hero({ onSearch }) {
    const [activeTab, setActiveTab] = useState("Buy");
    const [searchCity, setSearchCity] = useState("");

    const handleSearch = () => {
        if (!searchCity.trim()) return;
        onSearch(searchCity, activeTab.toLowerCase());
    };

    return (
        <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
            <div className="hero-overlay"></div>
            <div className="hero-inner">
                <h1 className="hero-title">Find Your Dream Home in India</h1>
                <p className="hero-subtitle">Discover premium properties across top cities</p>
                <div className="hero-search">
                    <div className="tabs">
                        {["Buy", "Rent", "Projects", "Commercial", "Agents"].map(tab => (
                            <button
                                key={tab}
                                className={`tab ${activeTab === tab ? "active" : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="search-row">
                        <select className="type-select">
                            <option>All Residential</option>
                            <option>1 BHK</option>
                            <option>2 BHK</option>
                            <option>3 BHK</option>
                        </select>

                        <div className="search-input-wrapper">
                            <FiSearch className="search-input-icon" />
                            <input
                                className="search-input"
                                placeholder="Enter city, locality, or project"
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>

                        <button className="search-btn" onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = (city, type) => {
        navigate(`/properties?city=${city}&type=${type}`);
    };

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                const res = await propertyApi.get("");
                const data = res.data;
                const transformed = data.slice(0, 4).map((prop) => {
                    const photoArray = parsePropertyImages(prop.photos);
                    return {
                        images: photoArray.length > 0 ? photoArray : ["https://via.placeholder.com/300"],
                        title: prop.title || "Untitled Property",
                        location: prop.city || prop.pinCode || "India",
                        price: formatPrice(prop.price), // Using new formatPrice
                        bhk: prop.bhk || "-",
                        area: prop.area || "-",
                        type: prop.type || "Sale",
                        onClick: () => navigate(`/property/${prop.id || 0}`),
                    };
                });
                setFeaturedProperties(transformed);
            } catch (err) {
                console.error("Error fetching properties:", err);
                setError("Failed to load featured properties.");
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [navigate]);

    const features = [
        { icon: "🏠", title: "Post Property", description: "List your property for free", cta: "Post Now", onClick: () => navigate("/post-property") },
        { icon: "👨‍💼", title: "Find Agents", description: "Connect with top agents", cta: "Find Agents", onClick: () => navigate("/agents") },
        { icon: "🏙️", title: "Projects", description: "New residential projects", cta: "Explore", onClick: () => navigate("/properties?type=Projects") },
        { icon: "📊", title: "Home Loans", description: "Get the best interest rates", cta: "Check Rates", onClick: () => navigate("/properties") },
    ];

    const cities = [
        { city: "Mumbai", count: 1200, image: mumbaiImg },
        { city: "Delhi NCR", count: 850, image: delhiImg },
        { city: "Ahmedabad", count: 600, image: ahmImg },
        { city: "Gurgaon", count: 450, image: gurgaonImg },
        { city: "Pune", count: 530, image: puneImg },
        { city: "Hyderabad", count: 320, image: ahmImg },
    ];

    return (
        <div className="home-page">
            <Navbar />
            <Hero onSearch={handleSearch} />

            <section className="features">
                <div className="features-inner">
                    {features.map((f, i) => <FeatureBox key={i} {...f} />)}
                </div>
            </section>

            <section className="featured-section">
                <div className="featured-header">
                    <div>
                        <h2>Featured Properties</h2>
                        <p>Handpicked properties based on your preferences</p>
                    </div>
                    <button className="view-all-btn" onClick={() => navigate("/properties")}>
                        View All <FiArrowRight />
                    </button>
                </div>
                <div className="featured-grid">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        featuredProperties.map((property, i) => <FeaturedProperty key={i} {...property} />)
                    )}
                </div>
            </section>

            <section className="cities">
                <h3>Explore Top Cities</h3>
                <p className="section-subtitle">Real estate in India's most popular locations</p>
                <div className="cities-grid">
                    {cities.map((c, i) => (
                        <CityCircle key={i} {...c} onClick={() => navigate(`/properties?city=${c.city}`)} />
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
}