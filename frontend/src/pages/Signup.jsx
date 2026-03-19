import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";
import heroBg from "../assets/hero-bg.png";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
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
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");

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

  const requestOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.registerOtp(user.email);
      setOtpStep(true);
      toast.success("OTP sent to your email!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|urbannest\.com)$/;
    if (!gmailRegex.test(user.email)) {
      setError("Only valid Gmail or UrbanNest addresses allowed");
      return;
    }

    if (!otpStep) {
      await requestOtp();
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.post("/register", { ...user, otp });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      const res = await authApi.post("/google", { 
        token: response.credential,
        role: user.role 
      });
      const loggedUser = res.data;
      localStorage.setItem("token", loggedUser.token);
      delete loggedUser.token;
      localStorage.setItem("user", JSON.stringify(loggedUser));
      window.dispatchEvent(new Event("storage"));
      toast.success("Registration successful!");
      navigate("/");
    } catch (err) {
      toast.error("Google signup failed");
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
          {!otpStep ? (
            <>
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

              <div className="form-group">
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-light)' }}>
                    {previewImage ? "✨ Change Photo" : "📷 Upload Photo"}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  {previewImage && <img src={previewImage} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />}
                </label>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Verification Code</label>
              <div className="otp-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <button type="button" onClick={requestOtp} disabled={loading} className="resend-otp-btn">
                  Resend
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                We've sent a code to <b>{user.email}</b>
              </p>
            </div>
          )}

          <button type="submit" className="auth-btn glow-amber" disabled={loading}>
            {loading ? "Please wait..." : otpStep ? "Verify & Register" : "Sign Up"}
          </button>
          
          {otpStep && (
            <button type="button" className="auth-link-btn" onClick={() => setOtpStep(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px', cursor: 'pointer' }}>
              ← Edit Registration Details
            </button>
          )}
        </form>

        <div className="auth-divider"><span>OR</span></div>
        <div className="google-auth-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google Signup failed")}
            theme="filled_blue"
            shape="pill"
            text="signup_with"
            width="350"
          />
        </div>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
