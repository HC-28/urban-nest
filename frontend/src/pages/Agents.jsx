import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Agents.css";
import { FiSearch, FiMapPin, FiStar, FiPhone, FiMail, FiHome } from "react-icons/fi";

function Agents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  const agents = [
    {
      id: 1,
      name: "Rajesh Kumar",
      company: "Premium Realty",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
      city: "Mumbai",
      specialization: "Luxury Properties",
      experience: "15+ years",
      propertiesListed: 45,
      propertiesSold: 120,
      rating: 4.8,
      reviews: 156,
      phone: "+91 98765 43210",
      email: "rajesh@premiumrealty.com",
      isVerified: true
    },
    {
      id: 2,
      name: "Priya Sharma",
      company: "City Homes",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300",
      city: "Delhi",
      specialization: "Residential Apartments",
      experience: "10+ years",
      propertiesListed: 38,
      propertiesSold: 85,
      rating: 4.7,
      reviews: 98,
      phone: "+91 98765 43211",
      email: "priya@cityhomes.com",
      isVerified: true
    },
    {
      id: 3,
      name: "Amit Patel",
      company: "Dream Estates",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
      city: "Bangalore",
      specialization: "Villas & Independent Houses",
      experience: "12+ years",
      propertiesListed: 32,
      propertiesSold: 95,
      rating: 4.9,
      reviews: 142,
      phone: "+91 98765 43212",
      email: "amit@dreamestates.com",
      isVerified: true
    },
    {
      id: 4,
      name: "Sneha Reddy",
      company: "Urban Living",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300",
      city: "Hyderabad",
      specialization: "Commercial Properties",
      experience: "8+ years",
      propertiesListed: 28,
      propertiesSold: 65,
      rating: 4.6,
      reviews: 78,
      phone: "+91 98765 43213",
      email: "sneha@urbanliving.com",
      isVerified: true
    },
    {
      id: 5,
      name: "Vikram Singh",
      company: "Royal Properties",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      city: "Gurgaon",
      specialization: "Premium Apartments",
      experience: "18+ years",
      propertiesListed: 52,
      propertiesSold: 180,
      rating: 4.9,
      reviews: 210,
      phone: "+91 98765 43214",
      email: "vikram@royalproperties.com",
      isVerified: true
    },
    {
      id: 6,
      name: "Meera Desai",
      company: "HomeFirst Realty",
      image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300",
      city: "Pune",
      specialization: "Budget Homes",
      experience: "6+ years",
      propertiesListed: 25,
      propertiesSold: 55,
      rating: 4.5,
      reviews: 62,
      phone: "+91 98765 43215",
      email: "meera@homefirst.com",
      isVerified: false
    }
  ];

  const cities = ["all", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Gurgaon", "Pune"];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "all" || agent.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="agents-page">
      <Navbar />

      <div className="agents-hero">
        <div className="agents-hero-content">
          <h1>Find Top Real Estate Agents</h1>
          <p>Connect with verified agents who can help you find your dream property</p>
        </div>
      </div>

      <div className="agents-container">
        {/* Search and Filter */}
        <div className="agents-filters">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by agent name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="city-filter">
            {cities.map(city => (
              <button
                key={city}
                className={`city-btn ${selectedCity === city ? 'active' : ''}`}
                onClick={() => setSelectedCity(city)}
              >
                {city === "all" ? "All Cities" : city}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="agents-results">
          <p className="results-count">{filteredAgents.length} Agents Found</p>

          <div className="agents-grid">
            {filteredAgents.map(agent => (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <img src={agent.image} alt={agent.name} className="agent-image" />
                  {agent.isVerified && <span className="verified-badge">✓ Verified</span>}
                </div>

                <div className="agent-info">
                  <h3>{agent.name}</h3>
                  <p className="company">{agent.company}</p>
                  <p className="location">
                    <FiMapPin /> {agent.city}
                  </p>
                  <p className="specialization">{agent.specialization}</p>

                  <div className="agent-rating">
                    <FiStar className="star-icon" />
                    <span className="rating">{agent.rating}</span>
                    <span className="reviews">({agent.reviews} reviews)</span>
                  </div>

                  <div className="agent-stats">
                    <div className="stat">
                      <span className="value">{agent.propertiesListed}</span>
                      <span className="label">Listed</span>
                    </div>
                    <div className="stat">
                      <span className="value">{agent.propertiesSold}</span>
                      <span className="label">Sold</span>
                    </div>
                    <div className="stat">
                      <span className="value">{agent.experience}</span>
                      <span className="label">Experience</span>
                    </div>
                  </div>

                  <div className="agent-actions">
                    <a href={`tel:${agent.phone}`} className="action-btn call">
                      <FiPhone /> Call
                    </a>
                    <a href={`mailto:${agent.email}`} className="action-btn email">
                      <FiMail /> Email
                    </a>
                    <button className="action-btn properties">
                      <FiHome /> Properties
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Agents;

