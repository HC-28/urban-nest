import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import logo from "../assets/logo.png";
import heroBg from "../assets/re-back.jpg"; // Unified Background
import { userApi } from "../api/api"; // your axios instance

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await userApi.post("/login", user, { withCredentials: true });
      const data = res.data;

      // Save user info to localStorage
      localStorage.setItem("user", JSON.stringify(data));

      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      let msg = "Login failed. Please try again.";
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (!err.response) {
        msg = "Unable to reach server. Please try again.";
      }

      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={handleSubmit}>
        <img src={logo} className="auth-logo" alt="Logo" />
        <h2>Login</h2>

        <input
          name="email"
          type="email"
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

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-link" onClick={() => navigate("/signup")}>
          Don’t have an account? Sign up
        </p>
      </form>
    </div>
  );
}

export default Login;
