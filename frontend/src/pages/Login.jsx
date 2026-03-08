import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { authApi } from "../api/api";
import "../styles/Auth.css"; // We'll create/update this shared CSS
import heroBg from "../assets/hero-bg.png";
import logo from "../assets/logo.png";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.post("/login", formData);
      const loggedInUser = res.data;

      // Store JWT token and user data separately
      localStorage.setItem("token", loggedInUser.token);
      delete loggedInUser.token; // Don't persist token in user object
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      window.dispatchEvent(new Event("storage"));

      // Redirect based on role — admin is silently sent to admin dashboard
      if (loggedInUser.role === "ADMIN") {
        navigate("/admin");
      } else if (loggedInUser.role === "AGENT") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }

    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.error || errorData || "Login failed";
      setError(errorMsg);
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
          {/* Logo or Icon could go here */}
          <div className="auth-logo-icon">🏠</div>
          <h2>Welcome Back</h2>
          <p>Login to access your personalized dashboard</p>
        </div>

        {error && (
          <div className={`auth-error ${isPendingApproval ? 'auth-pending-approval' : ''}`}>
            {isPendingApproval ? (
              <>
                <span style={{ fontSize: '1.3rem' }}>⏳</span>
                <div>
                  <strong>Account Pending Approval</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                    Your agent account is awaiting verification by an admin. You will be able to log in once approved.
                  </p>
                </div>
              </>
            ) : error}
          </div>
        )}


        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-btn glow-amber" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
