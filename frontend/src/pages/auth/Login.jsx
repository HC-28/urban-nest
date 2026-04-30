import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { authApi } from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import "./Auth.css";
import heroBg from "../../assets/hero-bg.png";

function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("password");
  const [formData, setFormData] = useState({ email: "", password: "", otp: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const requestOtp = async () => {
    if (!formData.email) {
        toast.error("Please enter your email first");
        return;
    }
    setLoading(true);
    try {
        await authApi.requestOtp(formData.email);
        setOtpSent(true);
        toast.success("OTP sent to your email!");
    } catch (err) {
        toast.error(err.response?.data?.error || "Failed to send OTP");
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await authApi.googleLogin(response.credential);
      handleLoginSuccess(res.data);
    } catch (err) {
      toast.error("Google login failed");
    }
  };

  const handleLoginSuccess = (user) => {
    localStorage.setItem("token", user.token);
    delete user.token;
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    
    if (user.role === "ADMIN") navigate("/admin");
    else if (user.role === "AGENT") navigate("/dashboard");
    else navigate("/");
    toast.success("Welcome back!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res;
      if (activeTab === "password") {
        res = await authApi.post("/login", formData);
      } else {
        res = await authApi.verifyOtp(formData.email, formData.otp);
      }
      handleLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isPendingApproval = error?.includes?.("pending admin approval");

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="auth-overlay"></div>

      <div className="auth-card glass-strong arrow-border">
        <div className="auth-header">
          <div className="auth-logo-icon">🏠</div>
          <h2>Welcome Back</h2>
          <p>Login to access your personalized dashboard</p>
        </div>

        <div className="auth-tabs">
            <button 
                className={activeTab === 'password' ? 'active' : ''} 
                onClick={() => { setActiveTab('password'); setError(null); }}
            >Password</button>
            <button 
                className={activeTab === 'otp' ? 'active' : ''} 
                onClick={() => { setActiveTab('otp'); setError(null); }}
            >Email OTP</button>
        </div>

        {error && (
          <div className={`auth-error ${isPendingApproval ? 'auth-pending-approval' : ''}`}>
             {isPendingApproval ? "Account Pending Approval" : error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
          </div>

          {activeTab === 'password' ? (
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                />
                <div style={{ textAlign: 'right', marginTop: '4px' }}>
                  <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#60a5fa', textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </div>
            </div>
          ) : (
            <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <div className="otp-input-wrapper">
                    <input
                        id="otp"
                        type="text"
                        name="otp"
                        autoComplete="one-time-code"
                        value={formData.otp}
                        onChange={handleChange}
                        placeholder="6-digit OTP"
                        required={otpSent}
                        disabled={!otpSent}
                    />
                    {!otpSent ? (
                        <button type="button" onClick={requestOtp} disabled={loading} className="send-otp-btn">
                            Send OTP
                        </button>
                    ) : (
                        <button type="button" onClick={requestOtp} className="resend-otp-btn">Resend</button>
                    )}
                </div>
            </div>
          )}

          <button type="submit" className="auth-btn glow-amber" disabled={loading || (activeTab === 'otp' && !otpSent)}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div className="auth-divider"><span>OR</span></div>
        
        <div className="google-auth-container">
            {import.meta.env.VITE_SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID ? (
                <GoogleLogin 
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Google Login failed")}
                    theme="filled_blue"
                    shape="pill"
                    text="signin_with"
                    width="350"
                />
            ) : (
                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Google Sign-In is disabled. Setup Client ID.
                </div>
            )}
        </div>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;



