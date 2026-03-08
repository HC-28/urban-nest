import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Agents.css";
import heroBg from "../assets/hero-bg.png"; // Unified Background
import { FiSearch, FiMapPin, FiStar, FiPhone, FiMail, FiHome } from "react-icons/fi";
import { AgentSkeleton } from "../components/SkeletonLoaders";
import { agentsApi } from "../api/api"; // Corrected: use agentsApi
import { Helmet } from "react-helmet-async";

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
                        <a href={`tel:${agent.phone}`} className="action-btn call" onClick={(e) => e.stopPropagation()}>
                          <FiPhone /> Call
                        </a>
                        <a href={`mailto:${agent.email}`} className="action-btn email" onClick={(e) => e.stopPropagation()}>
                          <FiMail /> Email
                        </a>
                        <button className="action-btn properties" onClick={(e) => { e.stopPropagation(); navigate(`/agent/${agent.id}`); }}>
                          <FiHome /> View Profile
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
