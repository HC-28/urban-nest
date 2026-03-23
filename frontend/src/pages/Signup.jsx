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
    if (e.target.name === 'email') setError(null);
  };

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { label: '', color: '' },
      { label: 'Weak', color: '#ef4444' },
      { label: 'Fair', color: '#f59e0b' },
      { label: 'Good', color: '#eab308' },
      { label: 'Strong', color: '#22c55e' },
      { label: 'Excellent', color: '#10b981' },
    ];
    return { score, ...levels[score] };
  };

  const pwdStrength = getPasswordStrength(user.password);

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
      // Check if user exists first
      try {
        await authApi.post("/check-user", { email: user.email });
      } catch (checkErr) {
        if (checkErr.response?.status === 409) {
          setError("User with this email already exists");
          return;
        }
      }

      await authApi.registerOtp(user.email);
      setOtpStep(true);
      toast.success("OTP sent to your email!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Please check your email configuration.");
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
      
      if (res.data.token) {
        // Auto-login for Buyers
        localStorage.setItem("token", res.data.token);
        const loggedUser = { ...res.data };
        delete loggedUser.token;
        localStorage.setItem("user", JSON.stringify(loggedUser));
        window.dispatchEvent(new Event("storage"));
        toast.success("Welcome! You are now logged in.");
        navigate("/");
      } else {
        // Enforce admin approval for Agents
        toast.success(res.data.message || "Registration successful!");
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    // Check mandatory fields if AGENT
    if (user.role === "AGENT") {
      if (!user.city || !user.phone || !user.pincode) {
        setError("Please fill in City, Phone, and Pincode before using Google Signup.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await authApi.post("/google", { 
        token: response.credential,
        role: user.role,
        city: user.city,
        phone: user.phone,
        pincode: user.pincode,
        agencyName: user.agencyName
      });
      const loggedUser = res.data;
      localStorage.setItem("token", loggedUser.token);
      delete loggedUser.token;
      localStorage.setItem("user", JSON.stringify(loggedUser));
      window.dispatchEvent(new Event("storage"));
      toast.success("Registration successful!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Google signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="auth-overlay"></div>
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div className="auth-logo-icon">🎉</div>
            <h2 style={{ color: '#f1f5f9', marginBottom: '1rem' }}>Account Created!</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Your account has been created successfully.<br />
              Redirecting you to the login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="auth-overlay"></div>

      <div className="auth-card">
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
                <input name="password" type="password" placeholder="Password (min 6 chars)" value={user.password} onChange={handleChange} required minLength={6} />
                {user.password && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '3px', borderRadius: '2px',
                          background: i <= pwdStrength.score ? pwdStrength.color : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.3s ease'
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: pwdStrength.color, fontWeight: 600 }}>{pwdStrength.label}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <select name="role" value={user.role} onChange={handleChange}>
                  <option value="BUYER">I am a Buyer/Renter</option>
                  <option value="AGENT">I am an Agent/Seller</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <input name="city" placeholder="City" value={user.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <input name="pincode" placeholder="Pincode" value={user.pincode} onChange={handleChange} maxLength="6" required />
                </div>
              </div>
              <div className="form-group">
                <input name="phone" placeholder="Phone Number" value={user.phone} onChange={handleChange} required pattern="[0-9]{10}" title="Enter a 10-digit phone number" />
              </div>

              {user.role === "AGENT" && (
                <div className="form-group">
                  <input name="agencyName" placeholder="Agency Name (Optional)" value={user.agencyName || ""} onChange={handleChange} />
                </div>
              )}

              <div className="form-group">
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.6rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    {previewImage ? "✨ Change Photo" : "📷 Upload Photo"}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  {previewImage && <img src={previewImage} alt="Preview" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', objectFit: 'cover' }} />}
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
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                We've sent a code to <b>{user.email}</b>
              </p>
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Please wait..." : otpStep ? "Verify & Register" : "Sign Up"}
          </button>
          
          {otpStep && (
            <button type="button" onClick={() => setOtpStep(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', marginTop: '0.75rem', cursor: 'pointer' }}>
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
