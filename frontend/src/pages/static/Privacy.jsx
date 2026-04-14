import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import "./StaticPages.css";

export default function PrivacyPage() {
    return (
        <div className="static-page">
            <Navbar />
            <div className="static-hero">
                <h1>Privacy Policy</h1>
                <p>Your privacy matters to us. Here's how we handle your data.</p>
            </div>
            <div className="static-container">

                <div className="static-card">
                    <div className="legal-section">
                        <h3>1. Information We Collect</h3>
                        <p>We collect information you provide directly:</p>
                        <ul>
                            <li><strong>Account Data:</strong> Name, email, phone number, profile picture</li>
                            <li><strong>Property Data:</strong> Listings, search preferences, favorites</li>
                            <li><strong>Communication Data:</strong> Messages exchanged through our chat system</li>
                            <li><strong>Usage Data:</strong> Pages visited, features used, search queries</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h3>2. How We Use Your Information</h3>
                        <p>Your information is used to:</p>
                        <ul>
                            <li>Provide and improve our real estate platform services</li>
                            <li>Facilitate communication between buyers and agents</li>
                            <li>Send appointment confirmations and property alerts</li>
                            <li>Generate anonymous analytics to improve our heatmaps and search</li>
                            <li>Prevent fraud and ensure platform security</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h3>3. Data Sharing</h3>
                        <p>
                            We do not sell your personal data to third parties. Your information may be shared
                            with verified agents only when you initiate contact through our platform. We may
                            share anonymized, aggregated data for analytics and research purposes.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>4. Data Security</h3>
                        <p>
                            We use industry-standard security measures including JWT authentication, encrypted
                            data transfer (HTTPS), and secure password hashing to protect your information.
                            However, no method of transmission over the internet is 100% secure.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>5. Cookies & Local Storage</h3>
                        <p>
                            We use browser local storage to maintain your session and preferences. This
                            includes your authentication token, recently viewed properties, and search
                            preferences. You can clear this data at any time through your browser settings.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>6. Your Rights</h3>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal data stored on our platform</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and associated data</li>
                            <li>Opt out of promotional communications</li>
                            <li>Export your data in a portable format</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h3>7. Contact Us About Privacy</h3>
                        <p>
                            If you have any questions or concerns about this Privacy Policy, please contact
                            our Data Protection Officer at <strong>privacy@urbannest.com</strong> or write to
                            us at 123 Business Park, Andheri East, Mumbai 400069.
                        </p>
                    </div>

                    <p className="last-updated">Last updated: March 2026</p>
                </div>
            </div>
            <Footer />
        </div>
    );
}



