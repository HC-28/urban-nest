import React, { useState, useEffect } from "react";

function Profile({ role, userId }) {
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [agentProperties, setAgentProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch agent properties
  useEffect(() => {
    if (role.toLowerCase() === "agent") {
      setLoading(true);
      fetch(`${import.meta.env.VITE_API_URL}/api/properties?agentId=${userId}`)
          .then((res) => res.json())
          .then((data) => setAgentProperties(data))
          .catch((err) => setError("Failed to load properties"))
          .finally(() => setLoading(false));
    }
  }, [role, userId]);

  return (
      <div className="profile-page">
        <h1>Profile</h1>

        {role.toLowerCase() === "agent" && (
            <>
              <button onClick={() => setShowAddPropertyForm(!showAddPropertyForm)}>
                {showAddPropertyForm ? "Close Form" : "Add New Property"}
              </button>

              {showAddPropertyForm && (
                  <AddPropertyForm
                      userId={userId}
                      onSuccess={(newProperty) => {
                        setAgentProperties([newProperty, ...agentProperties]);
                        setShowAddPropertyForm(false);
                      }}
                  />
              )}

              <h2>Your Properties</h2>
              {loading ? (
                  <p>Loading your properties...</p>
              ) : error ? (
                  <p style={{ color: "red" }}>{error}</p>
              ) : agentProperties.length === 0 ? (
                  <p>You haven't added any properties yet.</p>
              ) : (
                  <ul>
                    {agentProperties.map((p) => (
                        <li key={p.id}>
                          {p.title} - {p.type} - {p.price}
                        </li>
                    ))}
                  </ul>
              )}
            </>
        )}
      </div>
  );
}

/* ---------------- ADD PROPERTY FORM ---------------- */
function AddPropertyForm({ userId, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    price: "",
    photos: null,
    area: "",
    bhk: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("type", formData.type);
      payload.append("price", formData.price);
      payload.append("area", formData.area);
      payload.append("bhk", formData.bhk);
      payload.append("agentId", userId);

      if (formData.photos) {
        payload.append("photos", formData.photos);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/properties`, {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to add property");
      }

      const newProperty = await res.json();
      onSuccess(newProperty); // Add to state in parent
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <label>
          Title
          <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
          />
        </label>

        <label>
          Type
          <select name="type" value={formData.type} onChange={handleChange} required>
            <option value="">Select Type</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Plot">Plot</option>
          </select>
        </label>

        <label>
          Price
          <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
          />
        </label>

        <label>
          Photos
          <input
              type="file"
              name="photos"
              onChange={handleChange}
              accept="image/*"
              required
          />
        </label>

        <label>
          Area (sq.ft)
          <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
          />
        </label>

        <label>
          BHK
          <input
              type="number"
              name="bhk"
              value={formData.bhk}
              onChange={handleChange}
              required
          />
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Property"}
        </button>
      </form>
  );
}

export default Profile;
