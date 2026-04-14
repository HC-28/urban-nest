import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import MapModal from "../../components/property/MapModal";
import { propertyApi } from "../../services/api";
import { formatPrice } from "../../utils/priceUtils";
import { parsePropertyImages } from "../../utils/imageUtils";
import { Helmet } from "react-helmet-async";
import "./Projects.css";
import {
  FiMapPin, FiMaximize, FiHome, FiCalendar, FiArrowRight,
  FiSearch, FiStar, FiEye, FiTrendingUp, FiAward, FiChevronDown
} from "react-icons/fi";

const CITIES = ["All", "Mumbai", "Bangalore", "Ahmedabad"];
const PURPOSES = ["All", "Sale", "Rent"];

function ProjectCard({ property, onClick }) {
  const images = parsePropertyImages(property.photos);
  const img = images[0] || "/property-placeholder.jpg";
  const isNew = property.listedDate &&
    (new Date() - new Date(property.listedDate)) / (1000 * 60 * 60 * 24) < 14;

  return (
    <div className="proj-card" onClick={() => onClick(property.id)}>
      {/* Image */}
      <div className="proj-card-img-wrap">
        <img
          src={img}
          alt={property.title}
          className="proj-card-img"
          loading="lazy"
          onError={e => { e.target.src = "/property-placeholder.jpg"; }}
        />
        <div className="proj-card-img-overlay" />
        {/* Badges */}
        <div className="proj-card-badges">
          {isNew && <span className="proj-badge new">NEW</span>}
          {property.isFeatured && <span className="proj-badge featured">★ FEATURED</span>}
          <span className="proj-badge purpose">{property.purpose}</span>
        </div>
        {/* Price */}
        <div className="proj-card-price">{formatPrice(property.price)}</div>
      </div>

      {/* Info */}
      <div className="proj-card-body">
        <h3 className="proj-card-title">{property.title}</h3>
        <p className="proj-card-loc">
          <FiMapPin size={13} />
          {property.location || property.city}
        </p>

        <div className="proj-card-stats">
          <span><FiHome size={13} /> {property.bhk} BHK</span>
          <span><FiMaximize size={13} /> {property.area?.toLocaleString()} sq.ft</span>
          {property.views > 0 && <span><FiEye size={13} /> {property.views}</span>}
        </div>

        <div className="proj-card-footer">
          <div className="proj-agent">
            <div className="proj-agent-avatar">{(property.agentName || "A").charAt(0)}</div>
            <span>{property.agentName || "Premium Developer"}</span>
          </div>
          <button className="proj-details-btn">
            View <FiArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedProjectCard({ property, onClick }) {
  const images = parsePropertyImages(property.photos);
  const img = images[0] || "/property-placeholder.jpg";

  return (
    <div className="proj-featured-card" onClick={() => onClick(property.id)}>
      <img
        src={img}
        alt={property.title}
        className="proj-featured-img"
        loading="lazy"
        onError={e => { e.target.src = "/property-placeholder.jpg"; }}
      />
      <div className="proj-featured-overlay">
        <span className="proj-badge featured">★ FEATURED</span>
        <h2 className="proj-featured-title">{property.title}</h2>
        <p className="proj-featured-loc"><FiMapPin size={15} /> {property.location || property.city}</p>
        <div className="proj-featured-stats">
          <span>{formatPrice(property.price)}</span>
          <span>·</span>
          <span>{property.bhk} BHK</span>
          <span>·</span>
          <span>{property.area?.toLocaleString()} sq.ft</span>
        </div>
        <button className="proj-featured-btn">Explore Project <FiArrowRight size={16} /></button>
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("All");
  const [purpose, setPurpose] = useState("All");
  const [search, setSearch] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(9);
  const heroRef = useRef(null);

  // Fetch all Project-type properties
  useEffect(() => {
    setLoading(true);
    propertyApi.get("", { params: { type: "Projects" } })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setProjects(data);
        setFiltered(data);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter + sort
  useEffect(() => {
    let result = [...projects];
    if (city !== "All") result = result.filter(p => p.city === city);
    if (purpose !== "All") result = result.filter(p => p.purpose === purpose);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.agentName?.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortBy === "featured") result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    else if (sortBy === "price_asc") result.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price_desc") result.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.listedDate) - new Date(a.listedDate));
    else if (sortBy === "views") result.sort((a, b) => (b.views || 0) - (a.views || 0));
    setFiltered(result);
    setVisibleCount(9);
  }, [projects, city, purpose, search, sortBy]);

  const featuredProjects = filtered.filter(p => p.isFeatured);
  const regularProjects = filtered.filter(p => !p.isFeatured);

  const handleCardClick = (id) => navigate(`/property/${id}`);

  const stats = [
    { icon: <FiHome />, value: projects.length, label: "Total Projects" },
    { icon: <FiStar />, value: featuredProjects.length, label: "Featured" },
    { icon: <FiTrendingUp />, value: projects.filter(p => p.purpose === "Sale").length, label: "For Sale" },
    { icon: <FiAward />, value: projects.filter(p => {
      const d = new Date() - new Date(p.listedDate);
      return d / (1000 * 60 * 60 * 24) < 14;
    }).length, label: "New This Week" },
  ];

  return (
    <div className="projects-page">
      <Helmet>
        <title>Premium Real Estate Projects | Urban Nest</title>
        <meta name="description" content="Discover exclusive new developments, luxury residential projects, and upcoming landmarks by top builders across Mumbai, Bangalore, and Ahmedabad." />
      </Helmet>

      <Navbar />

      {/* ── HERO ── */}
      <section className="proj-hero" ref={heroRef}>
        <div className="proj-hero-bg">
          <video
            autoPlay muted loop playsInline
            className="proj-hero-video"
            onError={e => e.target.style.display = 'none'}
            poster="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80"
          >
            <source src="" type="video/mp4" />
          </video>
          <div
            className="proj-hero-fallback"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80')` }}
          />
        </div>
        <div className="proj-hero-overlay" />

        <div className="proj-hero-content">
          <div className="proj-hero-eyebrow">
            <FiAward size={16} />
            <span>India's Premium Property Projects</span>
          </div>
          <h1 className="proj-hero-title">
            Discover Landmark<br />
            <span className="proj-hero-accent">Projects</span>
          </h1>
          <p className="proj-hero-subtitle">
            Exclusive new developments and upcoming luxury residences by top builders
          </p>

          {/* Stats */}
          <div className="proj-hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="proj-hero-stat">
                <span className="proj-hero-stat-icon">{s.icon}</span>
                <span className="proj-hero-stat-value">{s.value}</span>
                <span className="proj-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Scroll cue */}
          <div className="proj-hero-scroll">
            <FiChevronDown size={22} />
          </div>
        </div>
      </section>

      {/* ── FILTERS ── */}
      <div className="proj-filters-bar">
        <div className="proj-filters-inner">
          {/* Search */}
          <div className="proj-search-wrap">
            <FiSearch size={17} />
            <input
              type="text"
              placeholder="Search by name, city, or builder..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="proj-search-input"
            />
          </div>

          {/* City pills */}
          <div className="proj-filter-group">
            {CITIES.map(c => (
              <button
                key={c}
                className={`proj-filter-pill ${city === c ? "active" : ""}`}
                onClick={() => setCity(c)}
              >
                {c !== "All" && <FiMapPin size={12} />} {c}
              </button>
            ))}
          </div>

          {/* Purpose pills */}
          <div className="proj-filter-group">
            {PURPOSES.map(p => (
              <button
                key={p}
                className={`proj-filter-pill purpose ${purpose === p ? "active" : ""}`}
                onClick={() => setPurpose(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="proj-sort-wrap">
            <FiTrendingUp size={15} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="proj-sort-select">
              <option value="featured">Featured First</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>

          {/* Map btn */}
          <button className="proj-map-btn" onClick={() => setShowMap(true)}>
            <FiMapPin size={15} /> Map View
          </button>
        </div>

        {/* Result count */}
        <div className="proj-result-count">
          Showing <strong>{Math.min(visibleCount, filtered.length)}</strong> of <strong>{filtered.length}</strong> projects
        </div>
      </div>

      <div className="proj-main">

        {/* ── FEATURED SHOWCASE ── */}
        {!loading && featuredProjects.length > 0 && (
          <section className="proj-section">
            <div className="proj-section-header">
              <div>
                <h2 className="proj-section-title"><FiStar /> Featured Projects</h2>
                <p className="proj-section-sub">Hand-picked premium developments worth watching</p>
              </div>
            </div>
            <div className="proj-featured-grid">
              {featuredProjects.slice(0, 2).map(p => (
                <FeaturedProjectCard key={p.id} property={p} onClick={handleCardClick} />
              ))}
            </div>
          </section>
        )}

        {/* ── ALL PROJECTS GRID ── */}
        <section className="proj-section">
          {!loading && featuredProjects.length > 0 && (
            <div className="proj-section-header">
              <div>
                <h2 className="proj-section-title"><FiHome /> All Projects</h2>
                <p className="proj-section-sub">Browse all available new developments</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="proj-loading">
              <div className="proj-loading-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="proj-skeleton">
                    <div className="proj-skeleton-img" />
                    <div className="proj-skeleton-body">
                      <div className="proj-skeleton-line long" />
                      <div className="proj-skeleton-line short" />
                      <div className="proj-skeleton-line medium" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="proj-empty">
              <div className="proj-empty-icon">🏗️</div>
              <h3>No projects found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button className="proj-empty-btn" onClick={() => { setCity("All"); setPurpose("All"); setSearch(""); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="proj-grid">
                {(featuredProjects.length > 0 ? regularProjects : filtered).slice(0, visibleCount).map(p => (
                  <ProjectCard key={p.id} property={p} onClick={handleCardClick} />
                ))}
              </div>

              {/* Load more */}
              {visibleCount < (featuredProjects.length > 0 ? regularProjects : filtered).length && (
                <div className="proj-load-more">
                  <button className="proj-load-btn" onClick={() => setVisibleCount(v => v + 9)}>
                    Load More Projects <FiChevronDown size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── CTA BANNER ── */}
        {!loading && (
          <section className="proj-cta-banner">
            <div className="proj-cta-content">
              <h2>Looking for something specific?</h2>
              <p>Tell us your requirements and our agents will find the perfect project for you.</p>
              <div className="proj-cta-actions">
                <button className="proj-cta-btn primary" onClick={() => navigate("/contact")}>
                  Contact an Expert
                </button>
                <button className="proj-cta-btn outline" onClick={() => navigate("/agents")}>
                  Browse Agents
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Map Modal */}
      {showMap && (
        <MapModal isOpen={showMap} onClose={() => setShowMap(false)} />
      )}

      <Footer />
    </div>
  );
}
