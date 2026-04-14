import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import "./StaticPages.css";

export default function TermsPage() {
    return (
        <div className="static-page">
            <Navbar />
            <div className="static-hero">
                <h1>Terms of Service</h1>
                <p>Please read these terms carefully before using Urban-Nest.</p>
            </div>
            <div className="static-container">

                <div className="static-card">
                    <div className="legal-section">
                        <h3>1. Acceptance of Terms</h3>
                        <p>
                            By accessing and using the Urban-Nest platform, you agree to be bound by these Terms
                            of Service and all applicable laws and regulations. If you do not agree with any of
                            these terms, you are prohibited from using or accessing this site.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>2. User Accounts</h3>
                        <p>
                            To access certain features, you must register for an account. You are responsible
                            for maintaining the confidentiality of your account credentials and for all
                            activities that occur under your account. You must provide accurate and complete
                            information during registration.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>3. Property Listings</h3>
                        <p>
                            Agents and property owners are responsible for the accuracy of their listings.
                            Urban-Nest does not verify all property details and is not liable for inaccuracies
                            in listings. We reserve the right to remove any listing that violates our guidelines
                            or is reported as fraudulent.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>4. User Conduct</h3>
                        <p>Users agree not to:</p>
                        <ul>
                            <li>Post false, misleading, or fraudulent property information</li>
                            <li>Harass, spam, or send unsolicited messages to other users</li>
                            <li>Attempt to gain unauthorized access to other accounts or systems</li>
                            <li>Use the platform for any illegal or unauthorized purpose</li>
                            <li>Manipulate reviews, ratings, or analytics data</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h3>5. Intellectual Property</h3>
                        <p>
                            All content, design, graphics, and data on Urban-Nest are the intellectual property
                            of Urban-Nest and are protected under applicable copyright and trademark laws.
                            Users may not reproduce, distribute, or create derivative works without explicit
                            written permission.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>6. Limitation of Liability</h3>
                        <p>
                            Urban-Nest acts as a platform connecting buyers and agents. We are not party to any
                            transactions between users and do not guarantee the outcome of any property deal.
                            Urban-Nest shall not be liable for any direct, indirect, incidental, or
                            consequential damages arising from the use of our platform.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h3>7. Termination</h3>
                        <p>
                            We may terminate or suspend your account at any time, without prior notice, for
                            conduct that we believe violates these Terms of Service or is harmful to other
                            users, us, or third parties. Upon termination, your right to use the platform
                            will immediately cease.
                        </p>
                    </div>

                    <p className="last-updated">Last updated: March 2026</p>
                </div>
            </div>
            <Footer />
        </div>
    );
}



