import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import logo from "../assets/logo.png";

function Signup() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "BUYER",
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(user.email)) {
      alert("Only valid Gmail addresses allowed");
      return;
    }

    const res = await fetch("http://localhost:8082/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    const msg = await res.text();
    alert(msg);

    if (msg === "Signup successful" || msg === "Email already exists") {
      navigate("/login");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={handleSubmit}>
        <img src={logo} className="auth-logo" />
        <h2>Create Account</h2>

        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />

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

        <select name="role" onChange={handleChange}>
          <option value="BUYER">Buyer</option>
          <option value="AGENT">Agent</option>
        </select>

        <button type="submit">Sign Up</button>

        <p className="auth-link" onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </form>
    </div>
  );
}

export default Signup;
