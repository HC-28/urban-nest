import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import "./StaticPages.css";

export default function AboutPage() {
    return (
        <div className="static-page">
            <Navbar />
            <div className="static-hero">
                <h1>About Urban-Nest</h1>
                <p>
                    India's most trusted real estate platform connecting buyers, sellers,
                    and agents through technology and transparency.
                </p>
            </div>
            <div className="static-container">

                <div className="stats-row">
                    <div className="stat-box">
                        <span className="stat-number">10K+</span>
                        <span className="stat-label">Properties Listed</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">5K+</span>
                        <span className="stat-label">Happy Buyers</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">500+</span>
                        <span className="stat-label">Verified Agents</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">3</span>
                        <span className="stat-label">Major Cities</span>
                    </div>
                </div>

                <div className="static-card">
                    <h2><span className="card-icon">🎯</span> Our Mission</h2>
                    <p>
                        At Urban-Nest, we believe everyone deserves to find their perfect home. Our mission is
                        to simplify the real estate journey by providing a transparent, technology-driven
                        platform where buyers can explore verified properties, connect with trusted agents,
                        and make informed decisions — all in one place.
                    </p>
                </div>

                <div className="static-card">
                    <h2><span className="card-icon">💡</span> Our Story</h2>
                    <p>
                        Founded in 2024, Urban-Nest was born from a simple frustration — finding a good
                        property in India shouldn't be this hard. We started with listings in Mumbai and
                        quickly expanded to Delhi NCR and Ahmedabad. Today, thousands of buyers and agents
                        trust our platform to facilitate their real estate transactions with complete
                        transparency and zero hidden charges.
                    </p>
                </div>

                <div className="static-card">
                    <h2><span className="card-icon">✨</span> Our Values</h2>
                    <div className="values-grid">
                        <div className="value-item">
                            <span className="value-icon">🔍</span>
                            <h3>Transparency</h3>
                            <p>Every listing is verified. No hidden charges, no surprises.</p>
                        </div>
                        <div className="value-item">
                            <span className="value-icon">🤝</span>
                            <h3>Trust</h3>
                            <p>We connect you with RERA-verified agents and genuine sellers.</p>
                        </div>
                        <div className="value-item">
                            <span className="value-icon">⚡</span>
                            <h3>Innovation</h3>
                            <p>Interactive heatmaps, smart search, and real-time analytics.</p>
                        </div>
                        <div className="value-item">
                            <span className="value-icon">❤️</span>
                            <h3>Customer First</h3>
                            <p>Your dream home is our priority. Always.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}



