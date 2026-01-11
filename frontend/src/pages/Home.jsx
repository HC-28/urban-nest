import React, { useState, useEffect } from "react";
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
import axios from "axios";

/* ---------------- API SETUP ---------------- */
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";
export const propertyApi = axios.create({
    baseURL: BASE_URL, // Set to /api to be more flexible
    headers: {
        "Content-Type": "application/json",
    },
});

function FeaturedProperty({ image, title, location, price, bhk, area, type, onClick }) {
    return (
        <div className="property-card" onClick={onClick} style={{ cursor: "pointer" }}>
            <div className="property-image" style={{ height: "200px", overflow: "hidden", borderRadius: "8px 8px 0 0" }}>
                {/* Using a real <img> tag inside the div is safer for Base64 */}
                <img
                    src={image}
                    alt={title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                />
                <span className="property-tag" style={{ position: "absolute", top: "10px", left: "10px" }}>{type}</span>
            </div>

            <div className="property-details" style={{ padding: "15px" }}>
                <h4 className="property-price" style={{ color: "#2563eb", fontSize: "1.2rem" }}>{price}</h4>
                <h3 className="property-title" style={{ margin: "5px 0" }}>{title}</h3>
                <p className="property-location" style={{ color: "#666" }}>{location}</p>
                <div className="property-meta" style={{ marginTop: "10px", display: "flex", gap: "15px", fontSize: "0.9rem" }}>
                    <span>{bhk} BHK</span>
                    <span>{area} sqft</span>
                </div>
            </div>
        </div>
    );
}

/* ---------------- FEATURE BOX ---------------- */
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

/* ---------------- CITY CIRCLE ---------------- */
function CityCircle({ city, count, image, onClick }) {
    return (
        <div className="city-item" onClick={onClick}>
            <div
                className="city-pic"
                style={{ backgroundImage: image ? `url(${image})` : "none" }}
            ></div>
            <div className="city-name">{city}</div>
            <div className="city-count">{count}+ Properties</div>
        </div>
    );
}

/* ---------------- HERO SECTION ---------------- */
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
                <p className="hero-subtitle">Discover 50,000+ properties across India's top cities</p>
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
                            <option>4+ BHK</option>
                            <option>Villa</option>
                            <option>Plot</option>
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
                            <FiSearch /> Search
                        </button>
                    </div>
                </div>

                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-number">50K+</span>
                        <span className="stat-label">Properties</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">10K+</span>
                        <span className="stat-label">Happy Customers</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">500+</span>
                        <span className="stat-label">Verified Agents</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">100+</span>
                        <span className="stat-label">Cities</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------------- MAIN HOME ---------------- */
export default function Home() {
    const navigate = useNavigate();
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = (city, type) => {
        navigate(`/properties?city=${city}&type=${type}`);
    };

    /* ---------------- UPDATED FETCH LOGIC ---------------- */
    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            setError(null);
            try {
                // Ensure the URL matches your backend endpoint
                const res = await propertyApi.get("/properties");
                const data = res.data;

                const transformed = data.slice(0, 4).map((prop) => {
                    // 1. Convert the comma-separated string into an array
                    let photoArray = [];
                    if (prop.photos && typeof prop.photos === 'string') {
                        photoArray = prop.photos.split(',');
                    } else if (Array.isArray(prop.photos)) {
                        photoArray = prop.photos;
                    }

                    return {
                        image: photoArray.length > 0 ? photoArray[0] : "https://via.placeholder.com/300",
                        title: prop.title || "Untitled Property",
                        location: prop.city || prop.pinCode || "India", // Updated to use pinCode as fallback
                        price: prop.price >= 10000000
                            ? `₹${(prop.price / 10000000).toFixed(2)} Cr`
                            : `₹${(prop.price / 100000).toFixed(2)} L`,
                        bhk: prop.bhk || "-",
                        area: prop.area || "-",
                        type: prop.type || "Sale",
                        onClick: () => navigate(`/property/${prop.id || 0}`),
                    };
                });

                setFeaturedProperties(transformed);
            } catch (err) {
                console.error("Error fetching properties:", err);
                // If it's a 500 error, it's likely the "Bad Value for Long" database issue
                setError("Server Error (500). Please ensure database is cleaned and pinCode is a String.");
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [navigate]);

    const features = [
        { icon: "🏠", title: "Post Your Property Free", description: "List your property and reach thousands of potential buyers", cta: "Post Now", onClick: () => navigate("/post-property") },
        { icon: "👨‍💼", title: "Find Top Agents", description: "Connect with verified real estate agents in your city", cta: "Find Agents", onClick: () => navigate("/agents") },
        { icon: "🏙️", title: "Explore Projects", description: "Discover new residential and commercial projects", cta: "Explore", onClick: () => navigate("/properties") },
        { icon: "📋", title: "Get Home Loan", description: "Compare rates from top banks and get best deals", cta: "Check Rates", onClick: () => navigate("/properties") },
    ];

    const cities = [
        { city: "Mumbai", count: 35419, image: mumbaiImg },
        { city: "Delhi NCR", count: 34395, image: delhiImg },
        { city: "Ahmedabad", count: 33387, image: ahmImg },
        { city: "Gurgaon", count: 31814, image: gurgaonImg },
        { city: "Pune", count: 29152, image: puneImg },
        { city: "Hyderabad", count: 25437, image: ahmImg },
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
                        <p>Handpicked properties for you</p>
                    </div>
                    <button className="view-all-btn" onClick={() => navigate("/properties")}>
                        View All <FiArrowRight />
                    </button>
                </div>
                <div className="featured-grid">
                    {loading ? (
                        <p style={{ textAlign: "center", width: "100%" }}>Loading properties...</p>
                    ) : error ? (
                        <p style={{ textAlign: "center", color: "red", width: "100%" }}>{error}</p>
                    ) : featuredProperties.length > 0 ? (
                        featuredProperties.map((property, i) => <FeaturedProperty key={i} {...property} />)
                    ) : (
                        <p style={{ textAlign: "center", width: "100%", color: "#666" }}>No properties listed yet.</p>
                    )}
                </div>
            </section>

            <section className="cities">
                <h3>Find Your Property in Your Preferred City</h3>
                <p className="section-subtitle">Explore properties in India's top real estate markets</p>
                <div className="cities-grid">
                    {cities.map((c, i) => (
                        <CityCircle key={i} {...c} onClick={() => navigate(`/properties?city=${c.city}`)} />
                    ))}
                </div>
            </section>

            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Find Your Perfect Home?</h2>
                    <p>Join thousands of satisfied customers who found their dream property with us</p>
                    <div className="cta-buttons">
                        <button className="cta-btn primary" onClick={() => navigate("/properties")}>Browse Properties</button>
                        <button className="cta-btn secondary" onClick={() => navigate("/signup")}>Create Free Account</button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}