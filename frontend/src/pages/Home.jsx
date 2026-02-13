import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";
import heroBg from "../assets/re-back.jpg";
import ahmImg from "../assets/ahm.jpg";
import { FiSearch, FiMapPin, FiArrowRight } from "react-icons/fi";
import { propertyApi } from "../api";
import { userApi } from "../api"; // add at top


/* ---------------- HERO SECTION ---------------- */
function Hero() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Buy");
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = () => {
    navigate(`/properties?city=${searchCity}&type=${activeTab.toLowerCase()}`);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const key = tab.toLowerCase();
    if (["buy", "rent", "projects", "commercial"].includes(key)) {
      navigate(`/properties?type=${key}`);
    }
  };

  return (
    <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="hero-overlay"></div>

      <div className="hero-inner">
        <h1 className="hero-title">Find Your Dream Home in Ahmedabad</h1>
        <p className="hero-subtitle">
          Discover verified properties across prime locations
        </p>

        <div className="hero-search">
          <div className="tabs">
            {["Buy", "Rent", "Projects", "Commercial"].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="search-row">
            <div className="search-input-wrapper">
              <FiSearch className="search-input-icon" />
              <input
                className="search-input"
                placeholder="Enter area, locality, or project"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <button className="search-btn" onClick={handleSearch}>
              <FiSearch /> Search
            </button>
          </div>
        </div>
      </div>
    </section>
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

/* ---------------- FEATURED PROPERTY CARD ---------------- */
function FeaturedProperty({ id, image, title, location, price, bhk, area, type, purpose }) {
  const navigate = useNavigate();
  return (
    <div className="featured-property" onClick={() => navigate(`/property/${id}`)}>
      <div className="fp-image">
        <img src={image} alt={title} />
        <span className="fp-badge">{type}</span>
        {purpose && <span className="fp-purpose">{purpose}</span>}
      </div>
      <div className="fp-info">
        <h4>{title}</h4>
        <p className="fp-location"><FiMapPin /> {location}</p>
        <div className="fp-details">
          <span>{bhk} BHK</span>
          <span>{area} sq.ft</span>
        </div>
        <p className="fp-price">{price}</p>
      </div>
    </div>
  );
}

/* ---------------- MAIN HOME ---------------- */
export default function Home() {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [agents, setAgents] = useState([]); // ✅ ADD

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const resp = await propertyApi.get("");
        const data = resp.data || [];

        const transformed = data.slice(0, 4).map((prop) => {
          let imageUrl =
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800";

          if (prop.photos && prop.photos.trim() !== "") {
            const photosArray = prop.photos
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);

            if (photosArray.length > 0) {
              imageUrl = `http://localhost:8085/uploads/${encodeURIComponent(
                photosArray[0]
              )}?v=${Date.now()}`;
            }
          }

          return {
            id: prop.id,
            image: imageUrl,
            title: prop.title,
            location: prop.location || "Ahmedabad",
            price:
              prop.price >= 10000000
                ? `₹${(prop.price / 10000000).toFixed(2)} Cr`
                : `₹${(prop.price / 100000).toFixed(2)} L`,
            bhk: prop.bhk,
            area: prop.area,
            type: prop.type,
            purpose: prop.purpose || "For Sale",
          };
        });

        setFeaturedProperties(transformed);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setFeaturedProperties([]);
      }
    };



    fetchProperties();
  }, []);

  const features = [
    { icon: "🏠", title: "Post Your Property Free", description: "List your property and reach buyers", cta: "Post Now" },
    { icon: "👨‍💼", title: "Find Top Agents", description: "Connect with verified agents", cta: "Find Agents" },
    { icon: "🏙️", title: "Buy Property", description: "Browse properties for sale", cta: "Buy Now" },
    { icon: "🏡", title: "Rent Property", description: "Find rental homes", cta: "Rent Now" },
  ];

  const areas = ["Bopal", "Maninagar", "SG Highway", "Satellite", "Vastrapur"];

  return (
    <div className="home-page">
      <Navbar />
      <Hero />

      <section className="features">
        <div className="features-inner">
          {features.map((f, i) => (
            <FeatureBox
              key={i}
              {...f}
              onClick={() => {
                if (f.title.includes("Agents")) navigate("/agents");
                else if (f.title.includes("Post")) navigate("/post-property");
                else if (f.title.includes("Buy")) navigate("/properties?type=buy");
                else if (f.title.includes("Rent")) navigate("/properties?type=rent");
              }}
            />
          ))}
        </div>
      </section>

      <section className="featured-section">
        <h2 className="section-title">Featured Properties</h2>
        <div className="featured-grid">
          {featuredProperties.map((p) => (
            <FeaturedProperty key={p.id} {...p} />
          ))}
        </div>
      </section>

      <section className="why-choose-us">
        <h2>Why Choose Us</h2>
        <p className="section-subtitle">
          We make property buying and renting simple, secure, and transparent.
        </p>

        <div className="why-grid">

          {/* Verified Listings */}
          <div className="why-item">
            <div className="why-icon">🏠</div>
            <h4>Verified Listings</h4>
            <p>
              Every property is manually verified by our team to ensure genuine
              listings with correct pricing and legal details.
            </p>
            <p>
              Popular projects: <strong>Godrej Garden City</strong>, <strong>Shilp Revanta</strong>, <strong>Adani Shantigram</strong>
            </p>
          </div>

          {/* Trusted Agents (FROM DB) */}
          <div className="why-item">
            <div className="why-icon">👨‍💼</div>
            <h4>Trusted Agents</h4>
            <p>
              Connect with experienced and certified real estate agents in Ahmedabad.
            </p>
            <p>
              Top agents:{" "}
              {agents.length > 0
                ? agents.slice(0, 3).map((a, i) => (
                    <span key={a.id}>
                      <strong>{a.name}</strong>
                      {i < Math.min(agents.length, 3) - 1 ? ", " : ""}
                    </span>
                  ))
                : " No agents available"}
            </p>
          </div>

          {/* Prime Locations */}
          <div className="why-item">
            <div className="why-icon">📍</div>
            <h4>Prime Locations</h4>
            <p>
              Explore properties in the most in-demand locations with high ROI and
              excellent connectivity.
            </p>
            <p>
              Hot areas: <strong>SG Highway</strong>, <strong>Bopal</strong>, <strong>Satellite</strong>, <strong>Vastrapur</strong>
            </p>
          </div>

          {/* Best Prices */}
          <div className="why-item">
            <div className="why-icon">💰</div>
            <h4>Best Prices</h4>
            <p>
              Get properties at market-competitive prices with no hidden charges.
            </p>
            <p>
              Starting from <strong>₹25 Lakhs</strong> for 1 BHK and
              <strong> ₹45 Lakhs</strong> for 2 BHK in prime areas.
            </p>
          </div>

        </div>
      </section>

      <section className="cities">
        <h2 className="section-title">Explore Ahmedabad Areas</h2>
        <div className="city-grid">
          {areas.map((a) => (
            <div key={a} className="city-card" onClick={() => navigate(`/properties?city=${a}`)}>
              <img src={ahmImg} />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">🔍 Search Property</div>
          <div className="step">📞 Contact Agent</div>
          <div className="step">🏡 Visit Property</div>
          <div className="step">✍️ Close Deal</div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
