import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Agents.css";
import heroBg from "../assets/hero-bg.png"; // Unified Background
import { AgentSkeleton } from "../components/SkeletonLoaders";
import { agentsApi } from "../api/api";
import { Helmet } from "react-helmet-async";

/* ─── SVG Icons ─── */
const SearchIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const MapPinIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const StarIcon = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const PhoneIcon = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MailIcon = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const HomeIcon = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  const cities = ["all", "Mumbai", "Bangalore", "Ahmedabad", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata", "Goa"];

  // Fetch agents from backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await agentsApi.get("/"); // fetch all agents
        if (res?.data) {
          setAgents(res.data);
        } else {
          setError("No agents found.");
        }
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        setError("Unable to load agents. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Filter agents based on search and city
  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "all" || agent.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="agents-page">
      <Helmet>
        <title>Top Real Estate Agents | Urban Nest</title>
        <meta name="description" content="Connect with verified, top-rated real estate agents on Urban Nest." />
      </Helmet>
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
            <SearchIcon className="search-icon" />
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
                className={`city-btn ${selectedCity === city ? "active" : ""}`}
                onClick={() => setSelectedCity(city)}
              >
                {city === "all" ? "All Cities" : city}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error */}
        {loading ? (
          <div className="agents-grid">
            {[1, 2, 3, 4, 5, 6].map(n => <AgentSkeleton key={n} />)}
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="agents-results">
            <p className="results-count">{filteredAgents.length} Agents Found</p>

            <div className="agents-grid">
              {filteredAgents.length > 0 ? (
                filteredAgents.map(agent => (
                  <div
                    key={agent.id}
                    className="agent-card"
                    onClick={() => navigate(`/agent/${agent.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="agent-header">
                      {(() => {
                        const initial = (agent.name || 'A').charAt(0).toUpperCase();
                        const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect fill="#1e3a5f" width="150" height="150" rx="75"/><text fill="#60a5fa" font-family="Arial,sans-serif" font-size="60" font-weight="bold" x="50%" y="50%" dominant-baseline="central" text-anchor="middle">${initial}</text></svg>`)}`;
                        return (
                          <img
                            src={agent.image || agent.profilePicture || fallbackSvg}
                            alt={agent.name}
                            className="agent-image"
                            onError={(e) => { e.target.src = fallbackSvg; }}
                          />
                        );
                      })()}
                      {agent.isVerified && <span className="verified-badge">✓ Verified</span>}
                    </div>

                    <div className="agent-info">
                      <h3>{agent.name}</h3>
                      <p className="company">{agent.company}</p>
                      <p className="location">
                        <MapPinIcon /> {agent.city}
                      </p>
                      <p className="specialization">{agent.specialization}</p>

                      <div className="agent-rating">
                        <StarIcon className="star-icon" />
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
                        <a href={`tel:${agent.phone}`} className="action-btn call" onClick={(e) => e.stopPropagation()}>
                          <PhoneIcon /> Call
                        </a>
                        <a href={`mailto:${agent.email}`} className="action-btn email" onClick={(e) => e.stopPropagation()}>
                          <MailIcon /> Email
                        </a>
                        <button className="action-btn properties" onClick={(e) => { e.stopPropagation(); navigate(`/agent/${agent.id}`); }}>
                          <HomeIcon /> View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-results">No agents match your search.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Agents;
