import React, { useState, useEffect } from "react";

function Profile({ role, userId }) {
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [agentProperties, setAgentProperties] = useState([]);

  const handleAddPropertyClick = () => {
    setShowAddPropertyForm(true);
  };

  useEffect(() => {
    if (role === "agent") {
      // Fetch agent's properties from the backend
      fetch(`/api/properties?agentId=${userId}`)
        .then((response) => response.json())
        .then((data) => setAgentProperties(data))
        .catch((error) => console.error("Error fetching properties:", error));
    }
  }, [role, userId]);

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      {role === "agent" && (
        <div>
          <button onClick={handleAddPropertyClick} className="add-property-btn">
            Add New Property
          </button>
          {showAddPropertyForm && <AddPropertyForm />}

          <h2>Your Properties</h2>
          <ul>
            {agentProperties.map((property) => (
              <li key={property.id}>
                {property.title} - {property.type} - {property.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AddPropertyForm() {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    price: "",
    photos: null,
    area: "",
    bhk: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Property Data:", formData);
    // Add logic to send data to the backend
  };

  return (
    <form onSubmit={handleSubmit} className="add-property-form">
      <label>
        Property Title:
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Property Type:
        <select name="type" value={formData.type} onChange={handleChange} required>
          <option value="">Select Type</option>
          <option value="Apartment">Apartment</option>
          <option value="Villa">Villa</option>
          <option value="Plot">Plot</option>
        </select>
      </label>

      <label>
        Price:
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Photos:
        <input
          type="file"
          name="photos"
          onChange={handleChange}
          accept="image/*"
          required
        />
      </label>

      <label>
        Area (in sq. ft.):
        <input
          type="number"
          name="area"
          value={formData.area}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        BHK:
        <input
          type="number"
          name="bhk"
          value={formData.bhk}
          onChange={handleChange}
          required
        />
      </label>

      <button type="submit">Add Property</button>
    </form>
  );
}

export default Profile;
