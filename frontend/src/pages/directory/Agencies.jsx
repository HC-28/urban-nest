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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '40px' }}>
            {filteredAgencies.map((agency) => (
              <div key={agency.id} style={{
                background: '#ffffff',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #f1f5f9',
                position: 'relative'
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-12px)'; e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(50, 50, 93, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
              >
                {/* Header Decoration */}
                <div style={{ height: '80px', background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', width: '100%', position: 'absolute', top: 0, left: 0 }}></div>

                <div style={{ padding: '40px 30px 30px', flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, marginTop: '20px' }}>
                  
                  {/* Logo */}
                  <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 20px', borderRadius: '50%', padding: '5px', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    {agency.logo ? (
                      <img src={agency.logo} alt={agency.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: '#334155' }}>
                        {agency.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#10b981', color: 'white', padding: '4px', borderRadius: '50%', border: '4px solid white', display: 'flex' }}>
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>{agency.name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '0.85rem', color: '#64748b' }}>
                      <span><span style={{ color: '#94a3b8' }}>ID:</span> {agency.agencyCode || 'URBAN-NEST'}</span>
                      <span style={{ color: '#e2e8f0' }}>|</span>
                      <span><span style={{ color: '#94a3b8' }}>Lic:</span> {agency.licenseNumber || 'Verified'}</span>
                    </div>
                  </div>

                  {agency.bio && (
                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', marginBottom: '25px', textAlign: 'center', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {agency.bio}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Team</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{agency.agentCount || 0} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Agents</span></div>
                    </div>
                    <div style={{ width: '1px', background: '#e2e8f0' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Inventory</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{agency.propertyCount || 0} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Listings</span></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <button 
                      onClick={() => navigate(`/agents?search=${encodeURIComponent(agency.name)}`)}
                      style={{ padding: '14px', borderRadius: '12px', background: 'white', color: '#0f172a', fontWeight: 700, border: '2px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0f172a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      Our Agents
                    </button>
                    <button 
                      onClick={() => navigate(`/properties?search=${encodeURIComponent(agency.name)}`)}
                      style={{ padding: '14px', borderRadius: '12px', background: '#3b82f6', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.23)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.39)'; }}
                    >
                      View Listings
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



