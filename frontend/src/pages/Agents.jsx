import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Agents.css";
import {
  FiSearch,
  FiMail,
  FiHome
} from "react-icons/fi";
import { userApi, propertyApi } from "../api";

function Agents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= FETCH AGENTS ================= */
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Fetch agents (this API is CORRECT)
        const response = await userApi.get("/agents");
        const agentsData = response.data || [];

        if (agentsData.length === 0) {
          setAgents([]);
          return;
        }

        // ✅ Fetch properties per agent
        const agentsWithStats = await Promise.all(
          agentsData.map(async (agent) => {
            try {
              const propResp = await propertyApi.get(`/agent/${agent.id}`);
              const properties = propResp.data || [];

              const listed = properties.filter(p => p.isListed === true);
              const unlisted = properties.filter(p => p.isListed === false);

              const profileImage = agent.name
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0ea5e9&color=fff&size=200&bold=true`
                : `https://ui-avatars.com/api/?name=Agent&background=0ea5e9&color=fff&size=200&bold=true`;

              return {
                id: agent.id,
                name: agent.name || "Agent",
                email: agent.email,
                role: agent.role,
                profileImage,
                propertiesListed: listed.length,
                propertiesSold: unlisted.length, // logical inactive
                totalProperties: properties.length,
                isVerified: true
              };
            } catch (err) {
              console.error(`Error loading properties for agent ${agent.id}`, err);

              return {
                id: agent.id,
                name: agent.name || "Agent",
                email: agent.email,
                role: agent.role,
                profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name || "Agent")}&background=0ea5e9&color=fff&size=200&bold=true`,
                propertiesListed: 0,
                propertiesSold: 0,
                totalProperties: 0,
                isVerified: true
              };
            }
          })
        );

        setAgents(agentsWithStats);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError("Failed to load agents. Please try again later.");
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  /* ================= FILTER ================= */
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div className="agents-page">
      <Navbar />

      <div className="agents-hero">
        <div className="agents-hero-content">
          <h1>Find Top Real Estate Agents</h1>
          <p>Connect with verified agents</p>
        </div>
      </div>

      <div className="agents-container">
        <div className="agents-filters">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by agent name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="agents-results">
          {loading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Loading agents...</p>
            </div>
          ) : error ? (
            <div className="no-results">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <p className="results-count">
                {filteredAgents.length} Agent{filteredAgents.length !== 1 ? "s" : ""} Found
              </p>

              {filteredAgents.length === 0 ? (
                <div className="no-results">
                  <h3>No Agents Found</h3>
                </div>
              ) : (
                <div className="agents-grid">
                  {filteredAgents.map(agent => (
                    <div key={agent.id} className="agent-card">
                      <div className="agent-header">
                        <img
                          src={agent.profileImage}
                          alt={agent.name}
                          className="agent-image"
                        />
                        {agent.isVerified && (
                          <span className="verified-badge">✓ Verified</span>
                        )}
                      </div>

                      <div className="agent-info">
                        <h3>{agent.name}</h3>
                        <p className="company">{agent.email}</p>

                        <div className="agent-stats">
                          <div className="stat">
                            <span className="value">{agent.propertiesListed}</span>
                            <span className="label">Listed</span>
                          </div>
                          <div className="stat">
                            <span className="value">{agent.propertiesSold}</span>
                            <span className="label">Inactive</span>
                          </div>
                          <div className="stat">
                            <span className="value">{agent.totalProperties}</span>
                            <span className="label">Total</span>
                          </div>
                        </div>

                        <div className="agent-actions">
                          <a href={`mailto:${agent.email}`} className="action-btn email">
                            <FiMail /> Email
                          </a>
                          <button
                            className="action-btn properties"
                            onClick={() => navigate(`/properties?agentId=${agent.id}`)}
                          >
                            <FiHome /> Properties
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Agents;
