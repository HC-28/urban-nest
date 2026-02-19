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
import { FiSearch, FiArrowRight, FiHeart } from "react-icons/fi";
import { propertyApi, favoritesApi } from "../api/api";
import { parsePropertyImages } from "../utils/imageUtils";
import { formatPrice } from "../utils/priceUtils";
import PropertyCard from "../components/PropertyCard";



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
        <section className="hero" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
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
                const sorted = data.sort((a, b) => (b.views || 0) - (a.views || 0));
                const transformed = sorted.slice(0, 4).map((prop) => {
                    return {
                        id: prop.id,
                        title: prop.title || "Untitled Property",
                        // PropertyCard uses 'photos' or 'images'
                        images: parsePropertyImages(prop.photos),
                        location: prop.city || "India",
                        price: prop.price, // PropertyCard formats this internally if we pass raw, but we can also pass formatted
                        // Actually PropertyCard uses formatPrice prop. 
                        // Let's pass raw price and let PropertyCard format it, OR match PropertyCard expectations.
                        // PropertyCard uses: price, title, location|city|pinCode, purpose, bhk, area, bathrooms
                        type: prop.type,
                        purpose: prop.purpose || "Sale",
                        bhk: prop.bhk,
                        area: prop.area,
                        bathrooms: prop.bathrooms,
                        postedBy: "Agent", // Placeholder or fetch
                        postedDate: "Recently"
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
                        featuredProperties.map((property, i) => (
                            <PropertyCard
                                key={i}
                                property={property}
                                formatPrice={formatPrice}
                            />
                        ))
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