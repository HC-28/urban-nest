import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import "../styles/Properties.css";
import { FiSearch, FiFilter, FiMapPin, FiGrid, FiList } from "react-icons/fi";
import { propertyApi } from "../api";

function Properties() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "all",
    city: searchParams.get("city") || "",
    minPrice: "",
    maxPrice: "",
    bhk: "",
    propertyType: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch properties from backend API
    const fetchProperties = async () => {
      try {
        console.log("Fetching properties from API...");
        const response = await fetch("http://localhost:8082/api/properties");
        const backendProperties = await response.json();
        console.log("API Response:", backendProperties);

        // Transform backend properties to match frontend format
        const transformedProperties = backendProperties.map(prop => ({
          id: prop.id,
          title: prop.title,
          type: prop.type,
          price: prop.price,
          pricePerSqft: prop.area > 0 ? Math.round(prop.price / prop.area) : 0,
          area: prop.area,
          bhk: prop.bhk,
          bathrooms: prop.bhk, // Assume same as BHK
          city: prop.city || "India",
          location: prop.location || "Listed Property",
          image: prop.photos ? prop.photos.split(",")[0] : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
          amenities: ["Parking", "Security"],
          isVerified: true,
          postedBy: prop.agentName || "Agent",
          postedDate: "Recently",
          isFeatured: false,
          agentId: prop.agentId,
          agentEmail: prop.agentEmail
        }));

        console.log("Transformed properties:", transformedProperties);
        setProperties(transformedProperties);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProperties([]);
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const filteredProperties = properties.filter(property => {
    if (filters.city && !property.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.bhk && property.bhk !== parseInt(filters.bhk)) return false;
    if (filters.propertyType && property.type !== filters.propertyType) return false;
    if (filters.minPrice && property.price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && property.price > parseInt(filters.maxPrice)) return false;
    return true;
  });

  return (
    <div className="properties-page">
      <Navbar />

      <div className="properties-hero">
        <div className="properties-hero-content">
          <h1>Find Your Perfect Property</h1>
          <p>Browse through {properties.length}+ verified properties across India</p>
        </div>
      </div>

      <div className="properties-container">
        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by city, location, or property name..."
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
            />
          </div>

          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>

          <div className="view-toggle">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid />
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              <FiList />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Studio">Studio</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div className="filter-group">
              <label>BHK</label>
              <select
                value={filters.bhk}
                onChange={(e) => setFilters({...filters, bhk: e.target.value})}
              >
                <option value="">Any</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Min Price</label>
              <select
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              >
                <option value="">No Min</option>
                <option value="2000000">₹20 Lakh</option>
                <option value="5000000">₹50 Lakh</option>
                <option value="10000000">₹1 Cr</option>
                <option value="20000000">₹2 Cr</option>
                <option value="50000000">₹5 Cr</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Max Price</label>
              <select
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              >
                <option value="">No Max</option>
                <option value="5000000">₹50 Lakh</option>
                <option value="10000000">₹1 Cr</option>
                <option value="20000000">₹2 Cr</option>
                <option value="50000000">₹5 Cr</option>
                <option value="100000000">₹10 Cr</option>
              </select>
            </div>

            <button
              className="clear-filters"
              onClick={() => setFilters({
                type: "all",
                city: "",
                minPrice: "",
                maxPrice: "",
                bhk: "",
                propertyType: ""
              })}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="results-info">
          <span>{filteredProperties.length} Properties Found</span>
          <select className="sort-select">
            <option>Sort by: Relevance</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {/* Property Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading properties...</p>
          </div>
        ) : (
          <div className={`properties-grid ${viewMode}`}>
            {filteredProperties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                viewMode={viewMode}
                formatPrice={formatPrice}
                onClick={() => navigate(`/property/${property.id}`)}
              />
            ))}
          </div>
        )}

        {filteredProperties.length === 0 && !loading && (
          <div className="no-results">
            <h3>No properties found</h3>
            <p>No properties are listed yet. Check back later or adjust your filters.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Properties;

