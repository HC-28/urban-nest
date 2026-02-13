import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import { agentsApi } from "../api/api";
import { FiMail, FiPhone, FiMapPin, FiStar, FiHome } from "react-icons/fi";
import "../styles/AgentProfile.css";

function AgentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAgentProfile = async () => {
            try {
                const res = await agentsApi.get(`/${id}`);
                setAgent(res.data);
            } catch (err) {
                console.error("Failed to fetch agent profile:", err);
                setError("Unable to load agent profile. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchAgentProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="agent-profile-page">
                <Navbar />
                <div className="loading-container">
                    <p>Loading agent profile...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="agent-profile-page">
                <Navbar />
                <div className="error-container">
                    <p>{error || "Agent not found"}</p>
                    <button onClick={() => navigate("/agents")}>Back to Agents</button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="agent-profile-page">
            <Navbar />

            {/* Agent Header Section */}
            <div className="agent-profile-header">
                <div className="agent-profile-container">
                    <div className="agent-profile-info">
                        <img
                            src={agent.profilePicture || "https://via.placeholder.com/150"}
                            alt={agent.name}
                            className="agent-profile-image"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                        />
                        <div className="agent-details">
                            <h1>{agent.name}</h1>
                            <p className="agent-city">
                                <FiMapPin /> {agent.city || "India"}
                            </p>
                            <div className="agent-rating">
                                <FiStar className="star-icon" />
                                <span>{agent.rating || 4.5}</span>
                                <span className="reviews">({agent.reviews || 0} reviews)</span>
                            </div>
                            <div className="agent-stats-row">
                                <div className="stat-item">
                                    <span className="stat-value">{agent.propertiesListed || 0}</span>
                                    <span className="stat-label">Listed</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{agent.propertiesSold || 0}</span>
                                    <span className="stat-label">Sold</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{agent.experience || "2+ years"}</span>
                                    <span className="stat-label">Experience</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="agent-contact-actions">
                        <a href={`tel:${agent.phone}`} className="contact-btn call-btn">
                            <FiPhone /> Call
                        </a>
                        <a href={`mailto:${agent.email}`} className="contact-btn email-btn">
                            <FiMail /> Email
                        </a>
                    </div>
                </div>
            </div>

            {/* Featured Properties Section */}
            {agent.featuredProperties && agent.featuredProperties.length > 0 && (
                <div className="properties-section featured-section">
                    <div className="section-container">
                        <div className="section-header">
                            <FiStar className="section-icon" />
                            <h2>Featured Properties</h2>
                        </div>
                        <div className="properties-grid">
                            {agent.featuredProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Other Properties Section */}
            {agent.otherProperties && agent.otherProperties.length > 0 && (
                <div className="properties-section">
                    <div className="section-container">
                        <div className="section-header">
                            <FiHome className="section-icon" />
                            <h2>All Listings</h2>
                        </div>
                        <div className="properties-grid">
                            {agent.otherProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* No Properties Message */}
            {(!agent.featuredProperties || agent.featuredProperties.length === 0) &&
                (!agent.otherProperties || agent.otherProperties.length === 0) && (
                    <div className="no-properties">
                        <p>This agent hasn't listed any properties yet.</p>
                    </div>
                )}

            <Footer />
        </div>
    );
}

export default AgentProfile;
