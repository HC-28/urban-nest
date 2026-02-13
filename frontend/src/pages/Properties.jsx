import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Properties.css";
import { propertyApi } from "../api/api";
import PropertyCard from "../components/PropertyCard";
import { formatPrice } from "../utils/priceUtils";

export default function Properties() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const cityQuery = queryParams.get("city") || "";
  const typeQuery = queryParams.get("type") || "";
  const purposeQuery = queryParams.get("purpose") || "";
  const pincodeQuery = queryParams.get("pincode") || "";

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await propertyApi.get("");
        let data = res.data;

        if (cityQuery) {
          data = data.filter((p) => p.city && p.city.toLowerCase() === cityQuery.toLowerCase());
        }
        if (typeQuery) {
          data = data.filter((p) => p.type && p.type.toLowerCase() === typeQuery.toLowerCase());
        }
        if (purposeQuery) {
          // Note: backend currently doesn't key 'purpose' in DB for most, default is Sale
          // If update needed, check backend entity. For now assuming filtered locally if field exists
          data = data.filter((p) => (p.purpose || "Sale").toLowerCase() === purposeQuery.toLowerCase());
        }
        if (pincodeQuery) {
          data = data.filter((p) => p.pinCode === pincodeQuery);
        }

        setProperties(data);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [cityQuery, typeQuery, purposeQuery, pincodeQuery]);

  return (
    <div className="properties-page">
      <Navbar />

      <div className="properties-hero">
        <div className="properties-hero-content">
          <h1>
            {pincodeQuery
              ? `Properties in Pincode ${pincodeQuery}`
              : cityQuery
                ? `Properties in ${cityQuery}`
                : "Browse All Properties"}
          </h1>
          <p>
            {properties.length > 0
              ? `Found ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
              : "Discover your dream home from our curated listings"}
          </p>
        </div>
      </div>

      <div className="properties-container">
        {loading && (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading properties...</p>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <>
            {properties.length > 0 ? (
              <div className="properties-grid">
                {properties.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    viewMode="grid" // Default to grid for now
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🏠</div>
                <h3>No Properties Found</h3>
                <button onClick={() => navigate("/properties")} className="browse-all-btn">
                  Browse All Properties
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
