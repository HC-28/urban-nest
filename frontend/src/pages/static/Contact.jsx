import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import "./StaticPages.css";
import { contactApi } from "../../services/api";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await contactApi.post("/", form);
            setSent(true);
            setTimeout(() => setSent(false), 4000);
            setForm({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            console.error("Error submitting contact form:", error);
            alert("Failed to send message. Please try again later.");
        }
    };

    return (
        <div className="static-page">
            <Navbar />
            <div className="static-hero">
                <h1>Contact Us</h1>
                <p>
                    Have a question or need assistance? We'd love to hear from you.
                    Our team typically responds within 24 hours.
                </p>
            </div>
            <div className="static-container">

                <div className="static-card">
                    <h2><span className="card-icon">📝</span> Send Us a Message</h2>
                    {sent && (
                        <div style={{
                            background: "rgba(5, 150, 105, 0.15)",
                            border: "1px solid rgba(5, 150, 105, 0.3)",
                            borderRadius: "12px",
                            padding: "14px 20px",
                            color: "#10B981",
                            fontWeight: 600,
                            marginBottom: "20px",
                            fontSize: "0.95rem",
                        }}>
                            ✅ Thank you! Your message has been sent. We'll get back to you soon.
                        </div>
                    )}
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Your Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Subject"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Your Message..."
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            required
                        />
                        <button type="submit">
                            <span className="login-btn-text">Send Message</span>
                        </button>
                    </form>
                </div>

                <div className="static-card">
                    <h2><span className="card-icon">📍</span> Get in Touch</h2>
                    <div className="contact-info-grid">
                        <div className="contact-info-item">
                            <span className="info-icon">🏢</span>
                            <div>
                                <h4>Office Address</h4>
                                <p>123 Business Park, Andheri East, Mumbai 400069</p>
                            </div>
                        </div>
                        <div className="contact-info-item">
                            <span className="info-icon">📞</span>
                            <div>
                                <h4>Phone</h4>
                                <p>+91 1800-123-4567 (Toll Free)</p>
                            </div>
                        </div>
                        <div className="contact-info-item">
                            <span className="info-icon">✉️</span>
                            <div>
                                <h4>Email</h4>
                                <p>support@urbannest.com</p>
                            </div>
                        </div>
                        <div className="contact-info-item">
                            <span className="info-icon">⏰</span>
                            <div>
                                <h4>Working Hours</h4>
                                <p>Mon – Sat, 9 AM – 7 PM IST</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}



