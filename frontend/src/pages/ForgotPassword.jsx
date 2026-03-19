import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";
import heroBg from "../assets/hero-bg.png";
import toast from "react-hot-toast";
import { authApi } from "../api/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState(null);

  const requestOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPasswordOtp(email);
      setOtpStep(true);
      toast.success("OTP sent to your email!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPasswordVerify(email, otp, newPassword);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="auth-overlay"></div>

      <div className="auth-card glass-strong">
        <div className="auth-header">
          <div className="auth-logo-icon">🔐</div>
          <h2>Forgot Password?</h2>
          <p>We'll help you reset it securely</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {!otpStep ? (
          <form onSubmit={requestOtp} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-btn glow-amber" disabled={loading}>
              {loading ? "Sending OTP..." : "Request Reset OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label>Verification Code</label>
              <div className="otp-input-wrapper">
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <button type="button" onClick={requestOtp} disabled={loading} className="resend-otp-btn">
                  Resend
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn glow-amber" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button type="button" className="auth-link-btn" onClick={() => setOtpStep(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px', cursor: 'pointer' }}>
              ← Change Email
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Remember your password? <Link to="/login">Back to Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
