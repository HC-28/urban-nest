import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { authApi } from "../api/api";
import heroBg from "../assets/hero-bg.png";
import "../styles/Auth.css";

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link. No token provided.");
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await authApi.get(`/verify-email?token=${token}`);
                setStatus("success");
                setMessage(res.data.message || "Email verified successfully!");
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.error || "Verification failed. The link may be expired or invalid.");
            }
        };

        verifyToken();
    }, [searchParams]);

    return (
        <div className="auth-page" style={{ backgroundImage: `url(${heroBg})` }}>
            <div className="auth-overlay"></div>
            <div className="auth-card glass-strong arrow-border" style={{ textAlign: 'center', padding: '40px' }}>
                {status === "verifying" && (
                    <>
                        <div className="auth-logo-icon spin">⏳</div>
                        <h2 style={{ color: 'var(--text-primary)' }}>Verifying...</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Please wait while we verify your email address.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="auth-logo-icon">✅</div>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Email Verified!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {message}
                        </p>
                        <div style={{ marginTop: '30px' }}>
                            <Link to="/login" className="auth-btn glow-amber" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                Login Now
                            </Link>
                        </div>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="auth-logo-icon">❌</div>
                        <h2 style={{ color: 'var(--error)', marginBottom: '15px' }}>Verification Failed</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {message}
                        </p>
                        <div style={{ marginTop: '30px' }}>
                            <Link to="/signup" className="auth-btn glow-amber" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                Back to Signup
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default VerifyEmail;
