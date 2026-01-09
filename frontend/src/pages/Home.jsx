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
import { FiSearch, FiHome, FiUsers, FiShield, FiTrendingUp, FiMapPin, FiStar, FiArrowRight } from "react-icons/fi";

/* ---------------- HERO SECTION ---------------- */
function Hero() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Buy");
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = () => {
    navigate(`/properties?city=${searchCity}&type=${activeTab.toLowerCase()}`);
  };

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${heroBg})`
      }}
    >
      <div className="hero-overlay"></div>

      <div className="hero-inner">
        <h1 className="hero-title">Find Your Dream Home in India</h1>
        <p className="hero-subtitle">Discover 50,000+ properties across India's top cities</p>

        <div className="hero-search">
          <div className="tabs">
            {["Buy", "Rent", "Projects", "Commercial", "Agents"].map(tab => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

/* ---------------- FEATURE BOX ---------------- */
function FeatureBox({ icon, title, description, cta, onClick }) {
  return (
    <div className="feature-box" onClick={onClick}>
      <div className="feature-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{description}</p>
      <button className="explore-btn">{cta} <FiArrowRight /></button>
    </div>
  );
}

/* ---------------- CITY CIRCLE ---------------- */
function CityCircle({ city, count, image, onClick }) {
  return (
    <div className="city-item" onClick={onClick}>
      <div className="city-pic" style={{ backgroundImage: image ? `url(${image})` : 'none' }}></div>
      <div className="city-name">{city}</div>
      <div className="city-count">{count}+ Properties</div>
    </div>
  );
}

/* ---------------- PROPERTY CARD ---------------- */
function FeaturedProperty({ image, title, location, price, bhk, area, type }) {
  const navigate = useNavigate();
  return (
    <div className="featured-property" onClick={() => navigate('/properties')}>
      <div className="fp-image">
        <img src={image} alt={title} />
        <span className="fp-badge">{type}</span>
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

/* ---------------- WHY CHOOSE US ---------------- */
function WhyChooseUs() {
  const features = [
    {
      icon: <FiShield size={32} />,
      title: "100% Verified Listings",
      description: "All properties are verified by our expert team"
    },
    {
      icon: <FiUsers size={32} />,
      title: "Trusted Agents",
      description: "Connect with verified and experienced agents"
    },
    {
      icon: <FiHome size={32} />,
      title: "Wide Selection",
      description: "Choose from 50,000+ properties across India"
    },
    {
      icon: <FiTrendingUp size={32} />,
      title: "Best Deals",
      description: "Get the best deals and investment opportunities"
    }
  ];

  return (
    <section className="why-choose-us">
      <h2>Why Choose RealEstateIndia?</h2>
      <p className="section-subtitle">India's most trusted real estate platform</p>
      <div className="why-grid">
        {features.map((feature, index) => (
          <div key={index} className="why-item">
            <div className="why-icon">{feature.icon}</div>
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- MAIN HOME ---------------- */
export default function Home() {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);

  // Fetch featured properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("http://localhost:8082/api/properties");
        const data = await response.json();

        // Transform and take first 4 properties
        const transformed = data.slice(0, 4).map(prop => ({
          image: prop.photos || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
          title: prop.title,
          location: "India",
          price: prop.price >= 10000000
            ? `₹${(prop.price / 10000000).toFixed(2)} Cr`
            : `₹${(prop.price / 100000).toFixed(2)} L`,
          bhk: prop.bhk,
          area: prop.area,
          type: prop.type
        }));

        setFeaturedProperties(transformed);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setFeaturedProperties([]);
      }
    };

    fetchProperties();
  }, []);

  const features = [
    {
      icon: "🏠",
      title: "Post Your Property Free",
      description: "List your property and reach thousands of potential buyers",
      cta: "Post Now"
    },
    {
      icon: "👨‍💼",
      title: "Find Top Agents",
      description: "Connect with verified real estate agents in your city",
      cta: "Find Agents"
    },
    {
      icon: "🏙️",
      title: "Explore Projects",
      description: "Discover new residential and commercial projects",
      cta: "Explore"
    },
    {
      icon: "📋",
      title: "Get Home Loan",
      description: "Compare rates from top banks and get best deals",
      cta: "Check Rates"
    },
  ];

  const cities = [
    { city: "Mumbai", count: 35419, image: mumbaiImg },
    { city: "Delhi NCR", count: 34395, image: delhiImg },
    { city: "Bangalore", count: 33387, image: ahmImg },
    { city: "Gurgaon", count: 31814, image: gurgaonImg },
    { city: "Pune", count: 29152, image: puneImg },
    { city: "Hyderabad", count: 25437, image: ahmImg },
  ];


  return (
    <div className="home-page">
      <Navbar />

      <Hero />

      {/* Features Section */}
      <section className="features">
        <div className="features-inner">
          {features.map((f, i) => (
            <FeatureBox
              key={i}
              icon={f.icon}
              title={f.title}
              description={f.description}
              cta={f.cta}
              onClick={() => {
                if (f.title.includes("Agents")) navigate("/agents");
                else if (f.title.includes("Post")) navigate("/post-property");
                else navigate("/properties");
              }}
            />
          ))}
        </div>
      </section>

      {/* Featured Properties */}
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
          {featuredProperties.length > 0 ? (
            featuredProperties.map((property, i) => (
              <FeaturedProperty key={i} {...property} />
            ))
          ) : (
            <p style={{textAlign: 'center', width: '100%', color: '#666'}}>
              No properties listed yet. Be the first to post a property!
            </p>
          )}
        </div>
      </section>

      {/* Cities Section */}
      <section className="cities">
        <h3>Find Your Property in Your Preferred City</h3>
        <p className="section-subtitle">Explore properties in India's top real estate markets</p>

        <div className="cities-grid">
          {cities.map((c, i) => (
            <CityCircle
              key={i}
              {...c}
              onClick={() => navigate(`/properties?city=${c.city}`)}
            />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Testimonials */}
      <section className="testimonials">
        <h2>What Our Customers Say</h2>
        <p className="section-subtitle">Trusted by thousands of home buyers</p>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-rating">
              <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
            </div>
            <p>"Found my dream home within 2 weeks! The platform is very user-friendly and the agents were very helpful."</p>
            <div className="testimonial-author">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="User" />
              <div>
                <h5>Rahul Sharma</h5>
                <span>Mumbai</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-rating">
              <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
            </div>
            <p>"Best platform for property search. Verified listings and transparent pricing made my decision easy."</p>
            <div className="testimonial-author">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="User" />
              <div>
                <h5>Priya Patel</h5>
                <span>Bangalore</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-rating">
              <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
            </div>
            <p>"Sold my property at a great price. The team was professional and the process was smooth."</p>
            <div className="testimonial-author">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" alt="User" />
              <div>
                <h5>Amit Kumar</h5>
                <span>Delhi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Find Your Perfect Home?</h2>
          <p>Join thousands of satisfied customers who found their dream property with us</p>
          <div className="cta-buttons">
            <button className="cta-btn primary" onClick={() => navigate("/properties")}>
              Browse Properties
            </button>
            <button className="cta-btn secondary" onClick={() => navigate("/signup")}>
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
