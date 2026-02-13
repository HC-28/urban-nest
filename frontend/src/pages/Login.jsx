import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import logo from "../assets/logo.png";
import { userApi } from "../api";

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
      // Use userApi which has the correct baseURL (http://localhost:8085/api)
      const res = await userApi.post("/login", user, { withCredentials: true });
      const data = res.data;

      // Persist user and redirect
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      let msg = "Login failed. Please try again.";
      if (err.response && err.response.data) {
        msg = typeof err.response.data === "string" ? err.response.data : (err.response.data.message || JSON.stringify(err.response.data));
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
        <img src={logo} className="auth-logo" />
        <h2>Login</h2>

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
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
