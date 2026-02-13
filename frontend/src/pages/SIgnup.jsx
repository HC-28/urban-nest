import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import logo from "../assets/logo.png";
import heroBg from "../assets/re-back.jpg"; // Unified Background
import { userApi } from "../api/api"; // Using your Axios instance

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
    profilePicture: "", // Optional profile picture
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Handle input change
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Handle profile picture upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      setUser({ ...user, profilePicture: base64Image });
      setPreviewImage(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(user.email)) {
      alert("Only valid Gmail addresses allowed");
      return;
    }

    setLoading(true);

    try {
      // Signup request
      const res = await userApi.post("/signup", user);
      const msg = res.data?.message || "Signup successful";

      if (msg === "Email already exists") {
        alert("Email already exists. Please login.");
        navigate("/login");
        return;
      }

      alert(msg);

      if (msg === "Signup successful") {
        // Auto-login
        const loginRes = await userApi.post("/login", {
          email: user.email,
          password: user.password,
        });

        localStorage.setItem("user", JSON.stringify(loginRes.data));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      const message = err.response?.data?.message || "Something went wrong. Please try again.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={handleSubmit}>
        <img src={logo} className="auth-logo" alt="Logo" />
        <h2>Create Account</h2>

        <input
          name="name"
          placeholder="Full Name"
          value={user.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          value={user.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={user.password}
          onChange={handleChange}
          required
        />

        <input
          name="city"
          placeholder="City (e.g., Mumbai, Delhi)"
          value={user.city}
          onChange={handleChange}
        />

        <input
          name="phone"
          type="tel"
          placeholder="Phone Number (e.g., 9876543210)"
          value={user.phone}
          onChange={handleChange}
        />

        <input
          name="pincode"
          type="text"
          placeholder="Pincode (6 digits)"
          value={user.pincode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            if (value.length <= 6) {
              setUser({ ...user, pincode: value });
            }
          }}
          maxLength="6"
          pattern="\d{6}"
        />

        <select name="role" value={user.role} onChange={handleChange}>
          <option value="BUYER">Buyer</option>
          <option value="AGENT">Agent</option>
        </select>

        {/* Optional Profile Picture Upload */}
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="profile-pic-upload" style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '14px',
            color: '#666'
          }}>
            Profile Picture (Optional)
          </label>
          <input
            id="profile-pic-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px',
              marginBottom: '10px'
            }}
          />
          {previewImage && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #2563eb'
                }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Profile Picture Preview
              </p>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="auth-link" onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </form>
    </div>
  );
}

export default Signup;
