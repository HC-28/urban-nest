import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import { agentsApi } from "../api/api";
import CountUp from 'react-countup';
import { Helmet } from "react-helmet-async";
import "../styles/AgentProfile.css";

/* ─── SVG Icons ─── */
const MailIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MapPinIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const StarIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const HomeIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const CheckCircleIcon = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

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
                                <MapPinIcon /> {agent.city || "India"}
                            </p>
                            <div className="agent-rating">
                                {agent.reviews > 0 ? (
                                    <>
                                        <StarIcon className="star-icon" />
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
                            <PhoneIcon /> Call
                        </a>
                        <a href={`mailto:${agent.email}`} className="contact-btn email-btn">
                            <MailIcon /> Email
                        </a>
                    </div>
                </div>
            </div>

            {/* Featured Properties Section */}
            {agent.featuredProperties && agent.featuredProperties.length > 0 && (
                <div className="properties-section featured-section">
                    <div className="section-container">
                        <div className="section-header">
                            <StarIcon className="section-icon" />
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
                            <HomeIcon className="section-icon" />
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

            {/* Recently Sold Section */}
            {agent.soldProperties && agent.soldProperties.length > 0 && (
                <div className="properties-section sold-section">
                    <div className="section-container">
                        <div className="section-header">
                            <CheckCircleIcon size={24} style={{ color: '#10b981' }} />
                            <h2>Recently Sold</h2>
                        </div>
                        <div className="properties-grid">
                            {agent.soldProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* No Properties Message */}
            {(!agent.featuredProperties || agent.featuredProperties.length === 0) &&
                (!agent.otherProperties || agent.otherProperties.length === 0) &&
                (!agent.soldProperties || agent.soldProperties.length === 0) && (
                    <div className="no-properties">
                        <p>This agent hasn't listed any properties yet.</p>
                    </div>
                )}

            <Footer />
        </div>
    );
}

export default AgentProfile;
