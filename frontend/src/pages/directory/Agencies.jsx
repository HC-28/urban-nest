import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { agencyApi } from "../../services/api";
import "./Agents.css"; // Reuse some agent styles, but we will add inline styles for uniqueness

export default function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const res = await agencyApi.get("/public");
        setAgencies(res.data);
      } catch (err) {
        console.error("Failed to load agencies", err);
        setError("Could not load the agencies directory.");
      } finally {
        setLoading(false);
      }
    };
    fetchAgencies();
  }, []);

  const filteredAgencies = agencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    (a.licenseNumber && a.licenseNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="agents-page">
      <Helmet>
        <title>Top Real Estate Agencies | Urban Nest</title>
        <meta name="description" content="Browse verified and top-rated real estate agencies to help you find or sell your next property." />
      </Helmet>

      <Navbar />

      {/* Hero Section */}
      <div className="agents-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '100px 20px 80px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="agents-hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'white' }}>
            Trusted <span style={{ color: '#fbbf24' }}>Agencies</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            Partner with the industry's most reputable organizations. Explore our directory of approved agencies equipped to handle all your real estate needs.
          </p>
          <div className="agents-search-bar" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 6px 6px 20px' }}>
            <span style={{ fontSize: '1.2rem', opacity: 0.5, color: 'white' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by agency name or license number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, height: '48px', border: 'none', background: 'transparent', color: 'white', fontSize: '1.05rem', outline: 'none', paddingLeft: '15px' }}
            />
          </div>
        </div>
      </div>

      <div className="agents-container" style={{ padding: '60px 5%', minHeight: '50vh' }}>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Directory <span style={{ color: 'var(--gold)' }}>({filteredAgencies.length})</span></h2>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="skeleton-card" style={{ height: '300px', borderRadius: '16px', background: 'var(--bg-card)' }}></div>
            ))}
          </div>
        ) : error ? (
          <div className="error-message" style={{ textAlign: 'center', padding: '40px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px' }}>
            {error}
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No agencies found</h3>
            <p style={{ color: '#94a3b8' }}>Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="agents-grid">
            {filteredAgencies.map((agency) => (
              <div key={agency.id} className="agent-card agency-card">
                {/* Header Decoration */}
                <div className="agency-header-decoration" style={{ height: '80px', width: '100%', position: 'absolute', top: 0, left: 0 }}></div>

                <div style={{ padding: '40px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, marginTop: '20px' }}>
                  
                  {/* Logo */}
                  <div className="agency-logo-container" style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 20px', borderRadius: '50%', padding: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                    {agency.logo ? (
                      <img src={agency.logo} alt={agency.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>
                        {agency.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#10b981', color: 'white', padding: '3px', borderRadius: '50%', border: '3px solid #0f172a', display: 'flex' }}>
                       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h3 className="agency-name" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>{agency.name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <span>ID: {agency.agencyCode || 'NEST-UNIT'}</span>
                      <span style={{ opacity: 0.3 }}>|</span>
                      <span>Lic: {agency.licenseNumber || 'Verified'}</span>
                    </div>
                  </div>

                  {agency.bio && (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px', textAlign: 'center', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {agency.bio}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div className="agency-stats-container" style={{ display: 'flex', justifyContent: 'space-around', padding: '16px', borderRadius: '14px', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="agency-stat-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Team</div>
                      <div className="agency-stat-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{agency.agentCount || 0} <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 500 }}>Agents</span></div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="agency-stat-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Inventory</div>
                      <div className="agency-stat-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{agency.propertyCount || 0} <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 500 }}>Listings</span></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button 
                      className="agency-btn-outline"
                      onClick={() => navigate(`/agents?search=${encodeURIComponent(agency.name)}`)}
                    >
                      Our Agents
                    </button>
                    <button 
                      className="agency-btn-primary"
                      onClick={() => navigate(`/properties?search=${encodeURIComponent(agency.name)}`)}
                    >
                      View Projects
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}



