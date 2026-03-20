import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Properties.css";
import { propertyApi } from "../api/api";
import PropertyCard from "../components/PropertyCard";
import { PropertySkeleton } from "../components/SkeletonLoaders";
import { formatPrice } from "../utils/priceUtils";
import { getRecentlyViewed } from "../utils/recentlyViewed";
import { Helmet } from "react-helmet-async";

/* ─── SVG Icons ─── */
const SearchIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const XIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SlidersIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
);

const ChevronDownIcon = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function Properties() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state — synced with URL query params
  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    type: searchParams.get("type") || "",
    purpose: searchParams.get("purpose") || "",
    bhk: searchParams.get("bhk") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    search: searchParams.get("search") || "",
    pincode: searchParams.get("pincode") || "",
    amenities: searchParams.get("amenities") || "",
  });

  const [properties, setProperties] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(true);

  // Re-read URL params on location change (when navigated from navbar search)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFilters({
      city: params.get("city") || "",
      type: params.get("type") || "",
      purpose: params.get("purpose") || "",
      bhk: params.get("bhk") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
      search: params.get("search") || "",
      pincode: params.get("pincode") || "",
      amenities: params.get("amenities") || "",
    });

    if (location.state?.openFilters) {
      setShowFilters(true);
    }
  }, [location.search, location.state]);

  // Fetch properties with server-side filters
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (filters.city) params.city = filters.city;
        if (filters.type) params.type = filters.type;
        if (filters.purpose) params.purpose = filters.purpose;
        if (filters.bhk) params.bhk = filters.bhk;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.search) params.search = filters.search;
        if (filters.pincode) params.pincode = filters.pincode;
        if (filters.amenities) params.amenities = filters.amenities;

        const res = await propertyApi.get("", { params });
        setProperties(res.data);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [filters]);

  // Load recently viewed from localStorage
  useEffect(() => {
    const viewed = getRecentlyViewed();
    if (viewed.length > 0) setRecentlyViewed(viewed);
  }, []);

  // Sync filters to URL params
  const applyFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const empty = { city: "", type: "", purpose: "", bhk: "", minPrice: "", maxPrice: "", search: "", pincode: "", amenities: "" };
    setFilters(empty);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  // Count active filters (excluding search)
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== "" && k !== "search").length;

  // Dynamic filter logic
  const showBhk = !['Commercial', 'Plot'].includes(filters.type);
  const priceLabel = filters.purpose === 'Rent' ? 'Monthly Rent' : 'Price';

  // Client-side sorting
  const sortedProperties = useMemo(() => {
    const sorted = [...properties];
    switch (sortBy) {
      case "price-low": sorted.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "price-high": sorted.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "area-low": sorted.sort((a, b) => (a.area || 0) - (b.area || 0)); break;
      case "area-high": sorted.sort((a, b) => (b.area || 0) - (a.area || 0)); break;
      case "newest": sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
      default: break;
    }
    return sorted;
  }, [properties, sortBy]);

  const getTitle = () => {
    if (filters.pincode) return `Properties in Pincode ${filters.pincode}`;
    if (filters.city) return `Properties in ${filters.city}`;
    if (filters.search) return `Search: "${filters.search}"`;
    if (filters.purpose === "Sale") return "Properties for Sale";
    if (filters.purpose === "Rent") return "Properties for Rent";
    return "Browse All Properties";
  };

  // --- Pagination Logic ---
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const totalPages = Math.ceil(sortedProperties.length / ITEMS_PER_PAGE);

  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProperties.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProperties, currentPage]);

  return (
    <div className="properties-page">
      <Helmet>
        <title>{getTitle()} | Urban Nest</title>
        <meta name="description" content={`Browse ${getTitle().toLowerCase()} on Urban Nest. Find the best properties matching your criteria.`} />
      </Helmet>
      <Navbar />

      <div className="properties-hero">
        <div className="properties-hero-content">
          <h1>{getTitle()}</h1>
          <p>
            {!loading && properties.length > 0
              ? `Found ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
              : "Discover your dream home from our curated listings"}
          </p>
        </div>
      </div>

      <div className="properties-container">
        {/* ===== Search + Controls Bar ===== */}
        <div className="search-controls-bar">
          <div className="search-control-left">
            <div className="prop-search-wrap">
              <SearchIcon className="prop-search-icon" />
              <input
                type="text"
                placeholder="Search by title, location, pincode..."
                value={filters.search}
                onChange={(e) => applyFilters({ search: e.target.value })}
                className="prop-search-input"
              />
              {filters.search && (
                <button className="prop-search-clear" onClick={() => applyFilters({ search: "" })}>
                  <XIcon />
                </button>
              )}
            </div>
          </div>

          <div className="search-control-right">
            <button
              className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersIcon />
              <span>Filters</span>
              {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            </button>

            <div className="sort-wrap">
              <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="area-low">Area: Small to Large</option>
                <option value="area-high">Area: Large to Small</option>
              </select>
              <ChevronDownIcon className="sort-icon" />
            </div>
          </div>
        </div>

        {/* ===== Expandable Filter Bar ===== */}
        {showFilters && (
          <div className="filter-bar">
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">City</label>
                <select value={filters.city} onChange={(e) => applyFilters({ city: e.target.value })}>
                  <option value="">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Goa">Goa</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Property Type</label>
                <select value={filters.type} onChange={(e) => {
                  const newType = e.target.value;
                  // Clear BHK if switching to Commercial or Plot
                  if (['Commercial', 'Plot'].includes(newType)) {
                    applyFilters({ type: newType, bhk: '' });
                  } else {
                    applyFilters({ type: newType });
                  }
                }}>
                  <option value="">All Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="House">House</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Studio">Studio</option>
                  <option value="Plot">Plot</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              {showBhk && (
                <div className="filter-group">
                  <label className="filter-label">BHK</label>
                  <select value={filters.bhk} onChange={(e) => applyFilters({ bhk: e.target.value })}>
                    <option value="">Any</option>
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label className="filter-label">Purpose</label>
                <select value={filters.purpose} onChange={(e) => applyFilters({ purpose: e.target.value })}>
                  <option value="">Buy / Rent</option>
                  <option value="Sale">Buy</option>
                  <option value="Rent">Rent</option>
                </select>
              </div>

              <div className="filter-group price-range">
                <label className="filter-label">{priceLabel} Range</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder={filters.purpose === 'Rent' ? 'Min ₹/mo' : 'Min ₹'}
                    value={filters.minPrice}
                    onChange={(e) => applyFilters({ minPrice: e.target.value })}
                    className="price-input"
                  />
                  <span className="price-separator">–</span>
                  <input
                    type="number"
                    placeholder={filters.purpose === 'Rent' ? 'Max ₹/mo' : 'Max ₹'}
                    value={filters.maxPrice}
                    onChange={(e) => applyFilters({ maxPrice: e.target.value })}
                    className="price-input"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  <XIcon /> Clear All
                </button>
              )}
            </div>

            <div className="filter-row amenities-row" style={{ marginTop: '15px' }}>
              <label className="filter-label" style={{ display: 'block', marginBottom: '10px' }}>Amenities</label>
              <div className="amenities-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {["WiFi", "Parking", "Gym", "Pool", "Security", "Power Backup", "Lift", "Balcony"].map(amenity => {
                  const currentAmenities = filters.amenities ? filters.amenities.split(",") : [];
                  const isActive = currentAmenities.includes(amenity);
                  return (
                    <label key={amenity} className={`amenity-checkbox ${isActive ? "active" : ""}`} style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                      background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isActive ? '#3b82f6' : '#334155'}`,
                      borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', color: isActive ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => {
                          const newAmens = e.target.checked
                            ? [...currentAmenities, amenity]
                            : currentAmenities.filter(a => a !== amenity);
                          applyFilters({ amenities: newAmens.join(",") });
                        }}
                        style={{ display: 'none' }}
                      />
                      {amenity}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="active-filter-tags">
                {filters.city && <span className="filter-tag" onClick={() => applyFilters({ city: "" })}>📍 {filters.city} ✕</span>}
                {filters.type && <span className="filter-tag" onClick={() => applyFilters({ type: "" })}>🏠 {filters.type} ✕</span>}
                {filters.bhk && <span className="filter-tag" onClick={() => applyFilters({ bhk: "" })}>{filters.bhk} BHK ✕</span>}
                {filters.purpose && <span className="filter-tag" onClick={() => applyFilters({ purpose: "" })}>{filters.purpose === "Sale" ? "Buy" : "Rent"} ✕</span>}
                {filters.minPrice && <span className="filter-tag" onClick={() => applyFilters({ minPrice: "" })}>Min ₹{Number(filters.minPrice).toLocaleString('en-IN')} ✕</span>}
                {filters.maxPrice && <span className="filter-tag" onClick={() => applyFilters({ maxPrice: "" })}>Max ₹{Number(filters.maxPrice).toLocaleString('en-IN')} ✕</span>}
                {filters.pincode && <span className="filter-tag" onClick={() => applyFilters({ pincode: "" })}>📌 {filters.pincode} ✕</span>}
                {filters.amenities && filters.amenities.split(",").map(amenity => (
                  <span key={amenity} className="filter-tag" onClick={() => {
                    const newAmenities = filters.amenities.split(",").filter(a => a !== amenity).join(",");
                    applyFilters({ amenities: newAmenities });
                  }}>✨ {amenity} ✕</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Recently Viewed ===== */}
        {!hasActiveFilters && recentlyViewed.length > 0 && (
          <div className="recently-viewed-section">
            <h3>Recently Viewed</h3>
            <div className="recently-viewed-grid">
              {recentlyViewed.map((p, idx) => (
                <div key={`rv-${p.id}-${idx}`} className="recently-viewed-card" onClick={() => navigate(`/property/${p.id}`)}>
                  <div className="rv-image">
                    {p.photo ? <img src={p.photo} alt={p.title} /> : <div className="rv-placeholder">🏠</div>}
                  </div>
                  <div className="rv-info">
                    <span className="rv-title">{p.title}</span>
                    <span className="rv-price">{p.price ? formatPrice(p.price) : ""}</span>
                    <span className="rv-location">{p.city || p.location || ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Properties Grid ===== */}
        {loading && (
          <div className="properties-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <PropertySkeleton key={n} />)}
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <>
            {paginatedProperties.length > 0 ? (
              <>
                <div className="properties-grid">
                  {paginatedProperties.map((p, idx) => (
                    <PropertyCard key={`prop-${p.id}-${idx}`} property={p} viewMode="grid" formatPrice={formatPrice} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: currentPage === 1 ? 'transparent' : 'rgba(59,130,246,0.1)', color: currentPage === 1 ? '#64748b' : '#3b82f6', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Prev
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      // Logic to limit number of page buttons shown on very large lists to avoid overflow
                      if (totalPages > 7) {
                        if (i !== 0 && i !== totalPages - 1 && Math.abs(currentPage - 1 - i) > 1) {
                          if (i === 1 || i === totalPages - 2) return <span key={i} style={{ color: '#94a3b8', padding: '8px 4px' }}>...</span>;
                          return null;
                        }
                      }
                      return (
                        <button
                          key={i + 1}
                          onClick={() => {
                            setCurrentPage(i + 1);
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: currentPage === i + 1 ? '#3b82f6' : 'transparent', color: currentPage === i + 1 ? '#fff' : '#cbd5e1', cursor: 'pointer' }}
                        >
                          {i + 1}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setCurrentPage(p => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: currentPage === totalPages ? 'transparent' : 'rgba(59,130,246,0.1)', color: currentPage === totalPages ? '#64748b' : '#3b82f6', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🏠</div>
                <h3>No Properties Found</h3>
                <p>Try adjusting your filters or search criteria</p>
                <button onClick={clearFilters} className="browse-all-btn">Clear Filters</button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
