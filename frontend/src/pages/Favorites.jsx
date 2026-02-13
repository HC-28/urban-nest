import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import { favoritesApi } from "../api/api";
import { formatPrice } from "../utils/priceUtils";
import "../styles/Properties.css"; // Reuse properties layout

function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchFavorites = async () => {
            try {
                const response = await favoritesApi.get(`/user/${user.id}`);
                setFavorites(response.data);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user, navigate]);

    const handleUnfav = (propertyId) => {
        setFavorites(prev => prev.filter(p => p.id !== propertyId));
    };

    return (
        <div className="properties-page">
            <Navbar />

            <div className="properties-hero" style={{ height: "200px" }}>
                <div className="properties-hero-content">
                    <h1>My Favourites</h1>
                    <p>Your shortlisted dream properties</p>
                </div>
            </div>

            <div className="properties-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading your favorites...</p>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="no-results" style={{ padding: "60px 0" }}>
                        <div className="no-results-icon">❤️</div>
                        <h3>No Favourites Yet</h3>
                        <p>Start browsing and save properties you like!</p>
                        <button onClick={() => navigate("/properties")} className="browse-all-btn">
                            Browse Properties
                        </button>
                    </div>
                ) : (
                    <div className="properties-grid">
                        {favorites.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                viewMode="grid"
                                formatPrice={formatPrice}
                                onUnfav={handleUnfav}
                            />
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Favorites;
