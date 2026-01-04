import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import logo from "../assets/logo.png";

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
      const res = await fetch("http://localhost:8082/api/users/login", {
        method: "POST",
        credentials: "include", // send cookies (JSESSIONID) so session is established
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!res.ok) {
        // read error message if backend sends one
        let msg = "Invalid credentials";
        try {
          const errBody = await res.json();
          if (errBody && errBody.message) msg = errBody.message;
        } catch (ignored) {}
        alert(msg);
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert("Unable to reach server. Please try again.");
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
