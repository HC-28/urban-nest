import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";
import heroBg from "../assets/hero-bg.png";
import { authApi } from "../api/api";

function Signup() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    phone: "",
    pincode: "",
    role: "BUYER",
    profilePicture: "",
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setUser({ ...user, profilePicture: reader.result });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|urbannest\.com)$/;
    if (!gmailRegex.test(user.email)) {
      setError("Only valid Gmail or UrbanNest addresses allowed");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.post("/register", user);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="auth-overlay"></div>
        <div className="auth-card glass-strong arrow-border" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="auth-logo-icon">🎉</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Account Created!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Your account has been created successfully.<br />
            Redirecting you to the login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="auth-overlay"></div>

      <div className="auth-card glass-strong">
        <div className="auth-header">
          <div className="auth-logo-icon">✨</div>
          <h2>Create Account</h2>
          <p>Join Urban Nest to start your journey</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <input name="name" placeholder="Full Name" value={user.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <input name="email" type="email" placeholder="Email Address" value={user.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <input name="password" type="password" placeholder="Password" value={user.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <select name="role" value={user.role} onChange={handleChange}>
              <option value="BUYER">I am a Buyer/Renter</option>
              <option value="AGENT">I am an Agent/Seller</option>
            </select>
          </div>

          {/* Additional fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <input name="city" placeholder="City" value={user.city} onChange={handleChange} />
            </div>
            <div className="form-group">
              <input name="pincode" placeholder="Pincode" value={user.pincode} onChange={handleChange} maxLength="6" />
            </div>
          </div>
          <div className="form-group">
            <input name="phone" placeholder="Phone" value={user.phone} onChange={handleChange} />
          </div>

          {user.role === "AGENT" && (
            <div className="form-group">
              <input name="agencyName" placeholder="Agency Name" value={user.agencyName || ""} onChange={handleChange} />
            </div>
          )}

          {/* Profile Picture Upload */}
          <div className="form-group">
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-light)' }}>
                {previewImage ? "✨ Change Photo" : "📷 Upload Photo"}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              {previewImage && <img src={previewImage} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />}
            </label>
          </div>

          <button type="submit" className="auth-btn glow-amber" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
