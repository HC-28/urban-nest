import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Properties.css";
import { propertyApi } from "../api/api";
import { FiMapPin } from "react-icons/fi";

export default function Properties() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const cityQuery = queryParams.get("city") || "";
  const typeQuery = queryParams.get("type") || "";

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch all properties
        const res = await propertyApi.get("/properties");

        let data = res.data;

        // Filter by city if query exists
        if (cityQuery) {
          data = data.filter(
              (p) => p.city && p.city.toLowerCase() === cityQuery.toLowerCase()
          );
        }

        // Filter by type if query exists
        if (typeQuery) {
          data = data.filter(
              (p) => p.type && p.type.toLowerCase() === typeQuery.toLowerCase()
          );
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
  }, [cityQuery, typeQuery]);

  return (
      <div className="properties-page">
        <Navbar />

        <div className="properties-container">
          <h2>Properties {cityQuery ? `in ${cityQuery}` : ""}</h2>

          {loading && <p className="loading">Loading properties...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && (
              <div className="properties-grid">
                {properties.length > 0 ? (
                    properties.map((p) => (
                        <div
                            key={p.id}
                            className="property-card"
                            onClick={() => navigate(`/property/${p.id}`)}
                        >
                          <img
                              src={
                                Array.isArray(p.photos)
                                    ? p.photos[0]
                                    : p.photos || "https://via.placeholder.com/300"
                              }
                              alt={p.title || "Property Image"}
                          />
                          <div className="property-info">
                            <h4>{p.title || "Untitled Property"}</h4>
                            <p className="property-location">
                              <FiMapPin /> {p.city || "Unknown Location"}
                            </p>
                            <p>
                              {p.bhk || "-"} BHK | {p.area || "-"} sq.ft
                            </p>
                            <p className="property-price">
                              {p.price
                                  ? p.price >= 10000000
                                      ? `₹${(p.price / 10000000).toFixed(2)} Cr`
                                      : `₹${(p.price / 100000).toFixed(2)} L`
                                  : "Price on Request"}
                            </p>
                          </div>
                        </div>
                    ))
                ) : (
                    <p className="no-results">
                      No properties found matching your search.
                    </p>
                )}
              </div>
          )}
        </div>

        <Footer />
      </div>
  );
}
