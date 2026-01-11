import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import logo from "../assets/logo.png";
import { userApi } from "../api/api"; // Using your Axios instance

function Signup() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "BUYER",
  });
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
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

          <select name="role" value={user.role} onChange={handleChange}>
            <option value="BUYER">Buyer</option>
            <option value="AGENT">Agent</option>
          </select>

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
