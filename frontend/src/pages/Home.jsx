import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";
import heroBg from "../assets/hero-bg.png";
import ahmImg from "../assets/ahm.jpg";
import mumbaiImg from "../assets/Mumbai.jpeg";
import { propertyApi, analyticsApi } from "../api/api";
import { formatPrice } from "../utils/priceUtils";
import PropertyCard from "../components/PropertyCard";
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { Helmet } from "react-helmet-async";

/* ─── SVG Icons ─── */
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const ChevronDownIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const SlidersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
    </svg>
);

/* ─── Feature Card ─── */
function FeatureBox({ icon, title, description, cta, onClick }) {
    return (
        <div className="feature-box" onClick={onClick}>
            <div className="feature-icon">{icon}</div>
            <h4>{title}</h4>
            <p>{description}</p>
            <button className="explore-btn">
                {cta} <ArrowRightIcon />
            </button>
        </div>
    );
}

/* ─── City Circle ─── */
function CityCircle({ city, count, image, onClick }) {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

    return (
        <div className="city-item" ref={ref} onClick={onClick}>
            <div className="city-pic" style={{ backgroundImage: image ? `url(${image})` : "none" }}></div>
            <div className="city-name">{city}</div>
            <div className="city-count">
                {inView ? <CountUp end={count} duration={2.5} separator="," /> : "0"}+ Properties
            </div>
        </div>
    );
}

/* ─── How It Works ─── */
const steps = [
    { num: "01", title: "Search Property", desc: "Browse through thousands of verified properties" },
    { num: "02", title: "Contact Agent", desc: "Connect directly with trusted real estate agents" },
    { num: "03", title: "Schedule Visit", desc: "Book an appointment to visit the property" },
    { num: "04", title: "Close Deal", desc: "Finalize the paperwork and move into your new home" }
];

function HowItWorks() {
    return (
        <section className="how-it-works-section">
            <div className="section-header">
                <h2>How It Works</h2>
                <p>Your journey to finding the perfect property in simple steps</p>
            </div>
            <div className="steps-grid">
                {steps.map((s, i) => (
                    <div key={i} className="step-card">
                        <div className="step-num">{s.num}</div>
                        <h4>{s.title}</h4>
                        <p>{s.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════
   HERO — Sotheby's-inspired Search
   ═══════════════════════════════════════════ */
function Hero({ onSearch }) {
    const [purpose, setPurpose] = useState("Buy");
    const [searchCity, setSearchCity] = useState("");
    const [propertyType, setPropertyType] = useState("All");
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Advanced Filters
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [bhk, setBhk] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const suggestRef = useRef(null);

    const availableCities = ["Mumbai", "Bangalore", "Ahmedabad"];

    // Dynamic property types based on purpose
    const propertyTypes = purpose === 'Rent'
        ? ["All", "Apartment", "Villa", "House", "Studio", "PG/Hostel", "Commercial"]
        : ["All", "Apartment", "Villa", "House", "Penthouse", "Studio", "Plot", "Commercial"];

    // BHK doesn't apply to Commercial, Plot, or PG/Hostel
    const showBhk = !['Commercial', 'Plot', 'PG/Hostel'].includes(propertyType);
    const priceLabel = purpose === 'Rent' ? 'Monthly Rent' : 'Price';

    // Quick price presets
    const pricePresets = purpose === 'Rent'
        ? [{ label: '< 10K', min: '', max: '10000' }, { label: '10K-25K', min: '10000', max: '25000' }, { label: '25K-50K', min: '25000', max: '50000' }, { label: '50K+', min: '50000', max: '' }]
        : [{ label: '< 50L', min: '', max: '5000000' }, { label: '50L-1Cr', min: '5000000', max: '10000000' }, { label: '1Cr-3Cr', min: '10000000', max: '30000000' }, { label: '3Cr+', min: '30000000', max: '' }];

    // Filter city suggestions
    const filteredCities = searchCity.trim()
        ? availableCities.filter(c => c.toLowerCase().includes(searchCity.toLowerCase()))
        : availableCities;

    // Close suggestions on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (suggestRef.current && !suggestRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSearch = () => {
        onSearch({
            city: searchCity,
            purpose: purpose,
            type: propertyType,
            bhk,
            minPrice,
            maxPrice
        });
    };

    const selectCity = (city) => {
        setSearchCity(city);
        setShowSuggestions(false);
    };

    return (
        <section className="hero" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            <div className="hero-overlay"></div>
            <div className="hero-inner">
                <h1 className="hero-title">Find Your Dream Home in India</h1>
                <p className="hero-subtitle">Discover premium properties across top cities</p>

                {/* Search Container */}
                <div className="hero-search">
                    {/* Purpose Selector (text links) */}
                    <div className="purpose-selector">
                        {["Buy", "Rent"].map(p => (
                            <button
                                key={p}
                                className={`purpose-link ${purpose === p ? "active" : ""}`}
                                onClick={() => setPurpose(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Refined Search Row */}
                    <div className="search-row">
                        {/* City Input with Autocomplete */}
                        <div className="search-field city-field" ref={suggestRef}>
                            <label className="field-label">City</label>
                            <div className="field-input-wrap">
                                <SearchIcon />
                                <input
                                    className="field-input"
                                    placeholder="Enter city..."
                                    value={searchCity}
                                    onChange={(e) => {
                                        setSearchCity(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            {/* Suggestions dropdown */}
                            {showSuggestions && (
                                <div className="suggestions-dropdown">
                                    {filteredCities.length > 0 ? (
                                        filteredCities.map(city => (
                                            <div
                                                key={city}
                                                className="suggestion-item"
                                                onClick={() => selectCity(city)}
                                            >
                                                <span className="suggestion-icon">📍</span>
                                                {city}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="suggestion-item disabled">No matching cities</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="search-divider" />

                        {/* Property Type */}
                        <div className="search-field">
                            <label className="field-label">Property Type</label>
                            <div className="field-input-wrap">
                                <select
                                    className="field-select"
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                >
                                    {propertyTypes.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="field-icon-right" />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="search-divider" />

                        {/* Advanced Filters Button */}
                        <div className={`search-field filter-field ${showAdvanced ? "active" : ""}`} onClick={() => setShowAdvanced(!showAdvanced)}>
                            <div className="field-input-wrap dummy-wrap">
                                <SlidersIcon />
                                <span className="field-text">Filters</span>
                            </div>
                        </div>

                        {/* Search Button */}
                        <button className="search-btn" onClick={handleSearch}>
                            <SearchIcon />
                            <span>Search</span>
                        </button>
                    </div>

                    {/* Advanced Filters Row */}
                    {showAdvanced && (
                        <div className="advanced-search-row">
                            {showBhk && (
                                <div className="search-field">
                                    <label className="field-label">BHK</label>
                                    <div className="field-input-wrap">
                                        <select className="field-select" value={bhk} onChange={e => setBhk(e.target.value)}>
                                            <option value="">Any BHK</option>
                                            <option value="1">1 BHK</option>
                                            <option value="2">2 BHK</option>
                                            <option value="3">3 BHK</option>
                                            <option value="4">4 BHK</option>
                                            <option value="5">5+ BHK</option>
                                        </select>
                                        <ChevronDownIcon className="field-icon-right" />
                                    </div>
                                </div>
                            )}
                            <div className="search-field">
                                <label className="field-label">Min {priceLabel} (₹)</label>
                                <div className="field-input-wrap">
                                    <input type="number" className="field-input" placeholder={purpose === 'Rent' ? 'e.g. 10000' : 'e.g. 5000000'} value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                                </div>
                            </div>
                            <div className="search-field">
                                <label className="field-label">Max {priceLabel} (₹)</label>
                                <div className="field-input-wrap">
                                    <input type="number" className="field-input" placeholder={purpose === 'Rent' ? 'e.g. 50000' : 'e.g. 15000000'} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                                </div>
                            </div>
                            <div className="price-presets">
                                <label className="field-label">Quick Budget</label>
                                <div className="preset-btns">
                                    {pricePresets.map(p => (
                                        <button
                                            key={p.label}
                                            className={`preset-btn ${minPrice === p.min && maxPrice === p.max ? 'active' : ''}`}
                                            onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); }}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Scroll Down Arrow — sibling of hero-search, inside hero-inner */}
                <div className="scroll-down" onClick={() => document.querySelector('.features')?.scrollIntoView({ behavior: 'smooth' })}>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.7)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="scroll-arrow"
                        style={{ animation: 'bounce 1.5s infinite' }}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════ */
export default function Home() {
    const navigate = useNavigate();
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [trendingProperties, setTrendingProperties] = useState([]);
    const [recentProperties, setRecentProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user"));

    const handleSearch = (filters) => {
        const queryParams = new URLSearchParams();
        if (filters.city) queryParams.set("city", filters.city);
        if (filters.purpose) queryParams.set("purpose", filters.purpose === 'Buy' ? 'Sale' : 'Rent');
        if (filters.type && filters.type !== 'All') queryParams.set("type", filters.type);
        if (filters.bhk) queryParams.set("bhk", filters.bhk);
        if (filters.minPrice) queryParams.set("minPrice", filters.minPrice);
        if (filters.maxPrice) queryParams.set("maxPrice", filters.maxPrice);

        navigate(`/properties?${queryParams.toString()}`);
    };

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const { data: featured } = await propertyApi.getFeatured();
                setFeaturedProperties(featured);

                try {
                    const { data: trending } = await propertyApi.getTrending();
                    setTrendingProperties(trending);
                } catch (err) {
                    console.error("Failed to fetch trending properties", err);
                }

                if (user?.id) {
                    try {
                        const { data: recent } = await analyticsApi.get(`/recent?userId=${user.id}`);
                        setRecentProperties(recent || []);
                    } catch (err) {
                        console.error("Failed to fetch recent views", err);
                    }
                }
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, [user?.id]);

    const features = [
        { icon: "🏠", title: "Post Property", description: "List your property for free", cta: "Post Now", onClick: () => navigate("/post-property") },
        { icon: "👨‍💼", title: "Find Agents", description: "Connect with top agents", cta: "Find Agents", onClick: () => navigate("/agents") },
        { icon: "🏙️", title: "Projects", description: "New residential projects", cta: "Explore", onClick: () => navigate("/properties?type=Projects") }
    ];

    /* 3 Cities only */
    const cities = [
        { city: "Mumbai", count: 1200, image: mumbaiImg },
        { city: "Bangalore", count: 850, image: ahmImg },
        { city: "Ahmedabad", count: 600, image: ahmImg },
    ];

    return (
        <div className="home-page">
            <Helmet>
                <title>Urban Nest | Find Your Dream Home</title>
                <meta name="description" content="Discover verified properties for sale and rent in top cities like Mumbai, Bangalore, and Ahmedabad on Urban Nest." />
            </Helmet>
            <Navbar />
            <Hero onSearch={handleSearch} />

            <section className="features">
                <div className="features-inner">
                    {features.map((f, i) => <FeatureBox key={i} {...f} />)}
                </div>
            </section>

            {recentProperties.length > 0 && (
                <section className="featured-section recently-viewed" style={{ backgroundColor: 'var(--bg-secondary)', paddingTop: '40px' }}>
                    <div className="section-header">
                        <h2>Recently Viewed</h2>
                        <p>Properties you checked out lately</p>
                    </div>
                    <div className="property-grid">
                        {recentProperties.map((property, idx) => (
                            <PropertyCard key={`recent-${property.id}-${idx}`} property={property} formatPrice={formatPrice} />
                        ))}
                    </div>
                </section>
            )}

            {trendingProperties.length > 0 && (
                <section className="featured-section trending-section" style={{ background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.05))', padding: '60px 0' }}>
                    <div className="section-header">
                        <div>
                            <h2>🔥 Trending Properties</h2>
                            <p>Most popular listings in the market right now</p>
                        </div>
                        <button className="view-all-link" onClick={() => navigate("/properties")}>
                            View All <ArrowRightIcon />
                        </button>
                    </div>
                    <div className="featured-grid">
                        {trendingProperties.map((property, i) => (
                            <PropertyCard key={`trending-${property.id}-${i}`} property={property} formatPrice={formatPrice} />
                        ))}
                    </div>
                </section>
            )}

            <section className="featured-section">
                <div className="section-header">
                    <div>
                        <h2>Featured Properties</h2>
                        <p>Handpicked properties based on your preferences</p>
                    </div>
                    <button className="view-all-link" onClick={() => navigate("/properties")}>
                        View All <ArrowRightIcon />
                    </button>
                </div>
                <div className="featured-grid">
                    {loading ? (
                        <p>Loading...</p>
                    ) : featuredProperties.length > 0 ? (
                        featuredProperties.map((property, i) => (
                            <PropertyCard key={`featured-${property.id}-${i}`} property={property} formatPrice={formatPrice} />
                        ))
                    ) : (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '60px 24px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '20px',
                            border: '1px dashed rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏡</div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: '#e2e8f0' }}>No Featured Properties Yet</h3>
                            <p style={{ color: '#64748b', marginBottom: '24px' }}>Check back soon for handpicked listings from our agents.</p>
                            <button
                                onClick={() => navigate("/properties")}
                                style={{
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 28px',
                                    borderRadius: '50px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Browse All Properties →
                            </button>
                        </div>
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

            <HowItWorks />

            <Footer />
        </div>
    );
}