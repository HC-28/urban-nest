import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import "../styles/Properties.css";
import { FiSearch, FiFilter, FiGrid, FiList } from "react-icons/fi";
import { propertyApi } from "../api";

const IMAGE_BASE_URL = "http://localhost:8080/";


function Properties() {
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");

  const [filters, setFilters] = useState({
    city: "",
    minPrice: "",
    maxPrice: "",
    bhk: "",
    propertyType: ""
  });

  const [showFilters, setShowFilters] = useState(false);

  // ✅ SINGLE NORMALIZATION FUNCTION (SOURCE OF TRUTH)
  const normalizePriceToLakh = (price) => {
    if (!price) return 0;

    // RUPEES → LAKH
    if (price >= 1_000_000) {
      return Math.round(price / 100_000);
    }

    // CRORE → LAKH
    if (price >= 1 && price <= 1000) {
      return price * 100;
    }

    // ALREADY LAKH
    return price;
  };
const IMAGE_BASE_URL = "http://localhost:8085/uploads/";

const getFirstPhoto = (photos) => {
  if (!photos) return null;

  let first = null;

  if (Array.isArray(photos)) {
    first = photos[0];
  } else if (typeof photos === "string") {
    first = photos.split(",")[0];
  }

  if (!first) return null;

  // ❌ Ignore old blob URLs
  if (first.startsWith("blob:")) {
    return null;
  }

  // ✅ Already full URL
  if (first.startsWith("http")) {
    return first;
  }

  // ✅ Correct backend upload URL
  return IMAGE_BASE_URL + encodeURIComponent(first);
};



  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);

        const typeQuery = searchParams.get("type") || "";
        let purposeParam;

        if (typeQuery) {
          const t = typeQuery.toLowerCase();
          if (t === "buy" || t === "sale") purposeParam = "sale";
          else if (t === "rent") purposeParam = "rent";
          else if (t === "commercial") purposeParam = "commercial";
          else if (t === "projects") purposeParam = "project";
        }

        const resp = await propertyApi.get("", {
          params: purposeParam ? { purpose: purposeParam } : {}
        });

        const backendProperties = resp.data;

        const transformedProperties = backendProperties.map(prop => {
          const normalizedPrice = normalizePriceToLakh(prop.price);

          return {
            id: prop.id,
            title: prop.title,
            type: prop.type,
            purpose: prop.purpose || "For Sale",

            // ✅ FIXED PRICE
            price: normalizedPrice,

            // ✅ FIXED PRICE PER SQFT
            pricePerSqft: prop.area > 0
              ? Math.round((normalizedPrice * 100000) / prop.area)
              : 0,

            area: prop.area,
            bhk: prop.bhk,
            bathrooms: prop.bhk,
            city: prop.city || prop.pinCode || "India",
            location: prop.location || "Listed Property",
            image: getFirstPhoto(prop.photos)
              ? getFirstPhoto(prop.photos)
              : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",

            amenities: ["Parking", "Security"],
            isVerified: true,
            postedBy: prop.agentName || "Agent",
            postedDate: "Recently",
            isFeatured: false,
            agentId: prop.agentId,
            agentEmail: prop.agentEmail
          };
        });

        setProperties(transformedProperties);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProperties([]);
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams]);

  const formatPrice = (priceInLakh) => {
    if (!priceInLakh) return "₹0";

    if (priceInLakh >= 100) {
      const crore = priceInLakh / 100;
      return `₹${Number.isInteger(crore) ? crore : crore.toFixed(2)} Cr`;
    }

    return `₹${priceInLakh} L`;
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

        <div className="search-filter-bar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by city, location, or property name..."
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
          </div>

          <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
            <FiFilter /> Filters
          </button>

          <div className="view-toggle">
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
              <FiGrid />
            </button>
            <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
              <FiList />
            </button>
          </div>
        </div>

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
