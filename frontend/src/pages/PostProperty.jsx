import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PostProperty.css";
import { FiUpload, FiX, FiCheck, FiLock } from "react-icons/fi";
import { propertyApi } from "../api/api";
import heroBg from "../assets/hero-bg.png";

function PostProperty() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Apartment",
    purpose: "For Sale",
    price: "",
    area: "",
    bhk: "2",
    bathrooms: "2",
    balconies: "1",
    floor: "",
    totalFloors: "",
    facing: "East",
    furnishing: "Unfurnished",
    reraId: "",

    age: "New Construction",
    city: "",
    location: "",
    pinCode: "",
    address: "",
    amenities: [],
    images: [],
    launchDate: "",
    possessionStarts: "",
    latitude: "",
    longitude: ""
  });

  // Supported cities (matching geojson files in /geo folder)
  const supportedCities = ["Mumbai", "Ahmedabad", "Bangalore"];

  // Dynamic area/pincode state from geojson
  const [geoAreas, setGeoAreas] = useState([]); // [{area_name, pin_code}, ...]
  const [geoFeatures, setGeoFeatures] = useState([]); // Full GeoJSON features for polygon validation
  const [loadingGeo, setLoadingGeo] = useState(false);

  // When city changes, fetch geojson and extract areas
  useEffect(() => {
    if (!formData.city) {
      setGeoAreas([]);
      return;
    }
    const cityFile = formData.city.toLowerCase();
    setLoadingGeo(true);
    fetch(`/geo/${cityFile}.geojson`)
      .then(res => res.json())
      .then(data => {
        // Store full features for polygon validation
        setGeoFeatures(data.features || []);
        // Extract unique area_name + pin_code pairs
        const areaMap = new Map();
        data.features.forEach(f => {
          const area = f.properties.area_name || f.properties.name || "";
          const pin = String(f.properties.pin_code || "");
          if (area && !areaMap.has(area)) {
            areaMap.set(area, pin);
          }
        });
        const areas = Array.from(areaMap.entries())
          .map(([area_name, pin_code]) => ({ area_name, pin_code }))
          .sort((a, b) => a.area_name.localeCompare(b.area_name));
        setGeoAreas(areas);
      })
      .catch(err => {
        console.error("Error loading geojson:", err);
        setGeoAreas([]);
        setGeoFeatures([]);
      })
      .finally(() => setLoadingGeo(false));
  }, [formData.city]);

  const amenitiesList = [
    "Swimming Pool", "Gym", "24/7 Security", "Power Backup",
    "Lift", "Club House", "Children's Play Area", "Jogging Track",
    "Covered Parking", "Intercom", "Fire Safety", "Rain Water Harvesting",
    "Garden", "CCTV", "Visitor Parking", "Maintenance Staff",
    "Vastu Compliant", "Gas Pipeline", "Wi-Fi Connectivity"
  ];
  const purposeOptions = [
    "For Sale",
    "For Rent",
    "Commercial",
    "Project"
  ];

  const propertyTypeOptions = [
    "Apartment",
    "Villa",
    "Independent House",
    "Penthouse",
    "Studio",
    "Plot / Land",
    "Commercial"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePropertyTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      floor: type === "Apartment" ? prev.floor : "",
      totalFloors: type === "Apartment" ? prev.totalFloors : ""
    }));
  };

  const handlePurposeSelect = (purpose) => {
    setFormData(prev => ({
      ...prev,
      purpose
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };
  const generateTitleText = () => {
    const { bhk, type, location, city, area } = formData;
    let title = "";
    if (type !== "Plot / Land" && type !== "Commercial" && type !== "Studio") {
      title += `${bhk} BHK `;
    }
    title += type;
    if (area && area > 0) {
      title += `, ${area} sq.ft.`;
    }
    if (location || city) {
      title += ` in ${location || city}`;
    }
    return title;
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newFiles = files.slice(0, 10 - formData.images.length);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result].slice(0, 10)
        }));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (step !== 4) return;

    try {
      setLoading(true);

      const propertyData = {
        title: generateTitleText(),
        description: formData.description || null,
        type: formData.type,
        price: parseFloat(formData.price) || 0,
        area: parseFloat(formData.area) || 0,
        bhk: parseInt(formData.bhk) || 2,
        bathrooms: parseInt(formData.bathrooms) || 2,
        balconies: parseInt(formData.balconies) || 0,
        facing: formData.facing || null,
        furnishing: formData.furnishing || null,
        reraId: formData.reraId || null,

        city: formData.city,
        pinCode: formData.pinCode,
        address: formData.address,
        location: formData.location,
        purpose: formData.purpose,
        age: formData.age,
        amenities: formData.amenities.join(", "),
        floor: formData.floor || null,
        totalFloors: formData.totalFloors || null,
        launchDate: formData.launchDate || null,
        possessionStarts: formData.possessionStarts || null,
        photos: formData.images.join(","), // Base64 strings joined by comma
        agentId: user?.id || null,
        isActive: true,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      await propertyApi.post("", propertyData, {
        params: { agentId: user?.id }
      });

      alert("Property listed successfully!");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Failed to submit property: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (!user || user.role !== "AGENT") {
    return (

      <div className="post-property-page">
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="property-form" style={{ textAlign: 'center', maxWidth: '500px', width: '100%', padding: '48px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <FiLock size={32} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#fff' }}>Access Restricted</h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.1rem', lineHeight: '1.6' }}>
              This feature is exclusively available for registered agents. Join our agent network to start listing properties.
            </p>
            <button
              onClick={() => navigate("/")}
              className="nav-btn next"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Return to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="post-property-page">
      <Navbar />
      <div className="post-property-container">
        <div className="post-header">
          <h1 style={{ color: '#ffffff' }}>List Your Property</h1>
          <p style={{ color: '#cbd5e1' }}>Fill in the details to list your property and reach thousands of potential buyers</p>
        </div>

        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">{step > 1 ? <FiCheck /> : "1"}</div>
            <span>Basic Info</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">{step > 2 ? <FiCheck /> : "2"}</div>
            <span>Property Details</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-number">{step > 3 ? <FiCheck /> : "3"}</div>
            <span>Amenities</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-number">{step > 4 ? <FiCheck /> : "4"}</div>
            <span>Photos</span>
          </div>
        </div>

        <div className="property-form">
          {step === 1 && (
            <div className="form-step">
              <h2>Basic Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Property Type *</label>
                  <div className="amenities-selection">
                    {propertyTypeOptions.map((type) => (
                      <div
                        key={type}
                        className={`amenity-chip ${formData.type === type ? "selected" : ""}`}
                        onClick={() => handlePropertyTypeSelect(type)}
                      >
                        {formData.type === type && <FiCheck />}
                        {type}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Purpose *</label>
                  <div className="amenities-selection">
                    {purposeOptions.map((purpose) => (
                      <div
                        key={purpose}
                        className={`amenity-chip ${formData.purpose === purpose ? "selected" : ""}`}
                        onClick={() => handlePurposeSelect(purpose)}
                      >
                        {formData.purpose === purpose && <FiCheck />}
                        {purpose}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>RERA Registration ID (Optional)</label>
                  <input
                    type="text"
                    name="reraId"
                    value={formData.reraId}
                    onChange={handleChange}
                    placeholder="Enter RERA ID (if applicable)"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2>Property Details</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>{formData.purpose === "For Rent" ? "Rent Rate (₹/month) *" : "Price (₹) *"}</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder={formData.purpose === "For Rent" ? "Enter monthly rent" : "Enter price"}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{formData.purpose === "Project" ? "Project Area (sq.ft) *" : "Area (sq.ft) *"}</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Enter area"
                    required
                  />
                </div>
              </div>

              {formData.purpose === "Project" && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Launch Date *</label>
                    <input type="date" name="launchDate" value={formData.launchDate} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Possession Starts *</label>
                    <input type="date" name="possessionStarts" value={formData.possessionStarts} onChange={handleChange} required />
                  </div>
                </div>
              )}

              {formData.purpose !== "Project" && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>BHK *</label>
                      <select name="bhk" value={formData.bhk} onChange={handleChange}>
                        <option value="1">1 BHK</option>
                        <option value="2">2 BHK</option>
                        <option value="3">3 BHK</option>
                        <option value="4">4 BHK</option>
                        <option value="5">5+ BHK</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Bathrooms *</label>
                      <select name="bathrooms" value={formData.bathrooms} onChange={handleChange}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5+</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Balconies</label>
                      <select name="balconies" value={formData.balconies} onChange={handleChange}>
                        <option value="0">None</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3+</option>
                      </select>
                    </div>
                  </div>

                  {formData.type === "Apartment" && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Floor No. *</label>
                        <input type="number" name="floor" value={formData.floor} onChange={handleChange} placeholder="e.g., 5" required />
                      </div>
                      <div className="form-group">
                        <label>Total Floors *</label>
                        <input type="number" name="totalFloors" value={formData.totalFloors} onChange={handleChange} placeholder="e.g., 20" required />
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Property Age *</label>
                      <select name="age" value={formData.age} onChange={handleChange} required>
                        <option value="">Select Property Age</option>
                        <option value="New Construction">New Construction</option>
                        <option value="Less than 1 year">Less than 1 year</option>
                        <option value="1-3 years">1-3 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5-10 years">5-10 years</option>
                        <option value="More than 10 years">More than 10 years</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Furnishing *</label>
                      <select name="furnishing" value={formData.furnishing} onChange={handleChange} required>
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Facing</label>
                      <select name="facing" value={formData.facing} onChange={handleChange}>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="North-East">North-East</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, city: e.target.value, location: "", pinCode: "" }));
                    }}
                    required
                  >
                    <option value="">Select City</option>
                    {supportedCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Location/Area *</label>
                  {formData.city && geoAreas.length > 0 ? (
                    <select
                      name="location"
                      value={formData.location}
                      onChange={(e) => {
                        const selectedArea = e.target.value;
                        const match = geoAreas.find(a => a.area_name === selectedArea);
                        setFormData(prev => ({
                          ...prev,
                          location: selectedArea,
                          pinCode: match ? match.pin_code : prev.pinCode
                        }));
                      }}
                      required
                    >
                      <option value="">{loadingGeo ? "Loading areas..." : "Select Area"}</option>
                      {geoAreas.map(a => (
                        <option key={a.area_name} value={a.area_name}>{a.area_name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder={formData.city ? "Loading areas..." : "Select a city first"}
                      required
                      disabled={!formData.city}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>Pincode *</label>
                  {formData.city && geoAreas.length > 0 ? (
                    <select
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pinCode: e.target.value }))}
                      required
                    >
                      <option value="">Select Pincode</option>
                      {[...new Set(geoAreas.map(a => a.pin_code))].sort().map(pin => (
                        <option key={pin} value={pin}>{pin}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="pinCode"
                      required
                      placeholder="Select a city first"
                      maxLength="6"
                      pattern="\d{6}"
                      value={formData.pinCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, pinCode: value });
                      }}
                      disabled={!formData.city}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Full Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter complete address" rows="3" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude <span style={{ color: '#94a3b8', fontSize: '11px' }}>(for map pin)</span></label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g., 23.0225"
                  />
                </div>
                <div className="form-group">
                  <label>Longitude <span style={{ color: '#94a3b8', fontSize: '11px' }}>(for map pin)</span></label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g., 72.5714"
                  />
                </div>
              </div>
              {formData.latitude && formData.longitude && formData.pinCode && (() => {
                const lat = parseFloat(formData.latitude);
                const lng = parseFloat(formData.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;

                // ── Ray-casting point-in-polygon ──
                const pointInPolygon = (point, ring) => {
                  const [px, py] = point; // [lng, lat]
                  let inside = false;
                  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                    const [xi, yi] = ring[i];
                    const [xj, yj] = ring[j];
                    const intersect = ((yi > py) !== (yj > py)) &&
                      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                  }
                  return inside;
                };

                // Find all GeoJSON features matching the selected pincode
                const matchingFeatures = geoFeatures.filter(
                  f => String(f.properties.pin_code) === String(formData.pinCode)
                );

                if (matchingFeatures.length === 0) {
                  // No geojson data for this pincode — fall back to basic India check
                  if (lat < 6 || lat > 37 || lng < 68 || lng > 98) {
                    return <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '-8px' }}>⚠️ Coordinates are outside India.</p>;
                  }
                  return <p style={{ color: '#f59e0b', fontSize: '13px', marginTop: '-8px' }}>⚠️ No polygon data for pincode {formData.pinCode}. Cannot verify — please double-check.</p>;
                }

                // Check if point falls inside any matching polygon
                const point = [lng, lat]; // GeoJSON uses [lng, lat]
                const isInside = matchingFeatures.some(f => {
                  const geom = f.geometry;
                  if (geom.type === 'Polygon') {
                    return geom.coordinates.some(ring => pointInPolygon(point, ring));
                  } else if (geom.type === 'MultiPolygon') {
                    return geom.coordinates.some(poly =>
                      poly.some(ring => pointInPolygon(point, ring))
                    );
                  }
                  return false;
                });

                if (isInside) {
                  return <p style={{ color: '#22c55e', fontSize: '13px', marginTop: '-8px' }}>✅ Coordinates verified — falls within pincode {formData.pinCode}.</p>;
                }
                return <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '-8px' }}>❌ Coordinates do NOT fall within pincode {formData.pinCode}. Please correct the latitude/longitude.</p>;
              })()}
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2>Amenities & Features</h2>
              <div className="form-group">
                <label>Property Title (Auto-Generated) *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={generateTitleText()} disabled style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'not-allowed', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Property Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide a detailed description of the property, neighborhood, and features"
                  rows="4"
                  required
                />
              </div>



              <div className="form-group">
                <label>Property Amenities</label>
                <div className="amenities-selection">
                  {amenitiesList.map((amenity) => (
                    <div
                      key={amenity}
                      className={`amenity-chip ${formData.amenities.includes(amenity) ? 'selected' : ''}`}
                      onClick={() => handleAmenityToggle(amenity)}
                    >
                      {formData.amenities.includes(amenity) && <FiCheck />}
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-step">
              <h2>Property Photos</h2>
              <div className="image-upload-area">
                <input type="file" id="images" multiple accept="image/*" onChange={handleImageUpload} hidden />
                <label htmlFor="images" className="upload-label">
                  <FiUpload size={40} />
                  <span>Click to upload images</span>
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="uploaded-images">
                  {formData.images.map((img, index) => (
                    <div key={index} className="uploaded-image">
                      <img src={img.preview} alt={`Upload ${index + 1}`} />
                      <button type="button" className="remove-image" onClick={() => removeImage(index)}><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-navigation">
            {step > 1 && <button type="button" className="nav-btn prev" onClick={prevStep}>Previous</button>}
            {step < 4 ? <button type="button" className="nav-btn next" onClick={nextStep}>Next</button> : <button type="button" className="nav-btn submit" disabled={loading} onClick={handleSubmit}>{loading ? "Submitting..." : "Submit Property"}</button>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PostProperty;