import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import { agentsApi } from "../api/api";
import { FiMail, FiPhone, FiMapPin, FiStar, FiHome } from "react-icons/fi";
import CountUp from 'react-countup';
import { Helmet } from "react-helmet-async";
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
                <div className="loading-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '15px', color: '#94a3b8' }}>Loading agent profile...</p>
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
            <Helmet>
                <title>{agent?.name ? `${agent.name} - Real Estate Agent | Urban Nest` : "Agent Profile"}</title>
                <meta name="description" content={`View ${agent?.name}'s profile and listed properties on Urban Nest.`} />
            </Helmet>
            <Navbar />

            <div className="breadcrumb" style={{ padding: '20px 5%', background: 'transparent' }}>
                <span onClick={() => navigate("/")} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Home</span>
                <span style={{ margin: '0 10px', color: 'var(--text-secondary)' }}>/</span>
                <span onClick={() => navigate("/agents")} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Agents</span>
                <span style={{ margin: '0 10px', color: 'var(--text-secondary)' }}>/</span>
                <span className="current" style={{ color: '#3b82f6', fontWeight: '600' }}>{agent.name}</span>
            </div>

            {/* Agent Header Section */}
            <div className="agent-profile-header">
                <div className="agent-profile-container">
                    <div className="agent-profile-info">
                        <img
                            src={agent.profilePicture || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23e2e8f0' width='150' height='150'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='16' dy='5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EAgent%3C/text%3E%3C/svg%3E"}
                            alt={agent.name}
                            className="agent-profile-image"
                            onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23e2e8f0' width='150' height='150'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='16' dy='5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EAgent%3C/text%3E%3C/svg%3E"; }}
                        />
                        <div className="agent-details">
                            <h1>{agent.name}</h1>
                            <p className="agent-city">
                                <FiMapPin /> {agent.city || "India"}
                            </p>
                            <div className="agent-rating">
                                {agent.reviews > 0 ? (
                                    <>
                                        <FiStar className="star-icon" />
                                        <span>{agent.rating}</span>
                                        <span className="reviews">({agent.reviews} reviews)</span>
                                    </>
                                ) : (
                                    <span className="reviews" style={{ fontSize: '0.9rem' }}>⭐ New Agent — No reviews yet</span>
                                )}
                            </div>
                            <div className="agent-stats-row">
                                <div className="stat-item">
                                    <span className="stat-value"><CountUp end={agent.propertiesListed || 0} duration={2} /></span>
                                    <span className="stat-label">Listed</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value"><CountUp end={agent.propertiesSold || 0} duration={2} /></span>
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
                                <PropertyCard key={property.id} property={property} showFeaturedBadge={true} />
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
