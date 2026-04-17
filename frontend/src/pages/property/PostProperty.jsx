import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import toast from "react-hot-toast";
import "./PostProperty.css";
import { propertyApi } from "../../services/api";
import { AMENITIES_LIST, PURPOSES, PROPERTY_TYPES } from "../../utils/constants";
/* ─── SVG Icons ─── */
const UploadIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const XIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CheckIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const LockIcon = ({ size = 32, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
import heroBg from "../../assets/hero-bg.png";

function PostProperty() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [agentStatus, setAgentStatus] = useState(null); // { joined: boolean, agencyApproved: boolean }
  const [uploadingImages, setUploadingImages] = useState(false);
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

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await propertyApi.get("/api/agencies/my-agency");
        const joined = res.data.membershipStatus === "JOINED";
        const approved = res.data.agency?.status === "APPROVED";
        setAgentStatus({ joined, approved });
      } catch (err) {
        console.error("Status check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === "AGENT") checkStatus();
    else setLoading(false);
  }, []);

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

  const amenitiesList = AMENITIES_LIST;
  const purposeOptions = [
    PURPOSES.BUY,
    PURPOSES.RENT
  ];

  const propertyTypeOptions = PROPERTY_TYPES.filter(t => t !== "All");

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remainingSlots = 10 - formData.images.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    const newFiles = files.slice(0, remainingSlots);
    setUploadingImages(true);

    try {
      const uploadedUrls = [];
      for (const file of newFiles) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        
        // Upload to our backend's Cloudinary storage endpoint
        const response = await propertyApi.post("/api/upload", uploadFormData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        
        if (response.data && response.data.data.imageUrl) {
          uploadedUrls.push(response.data.data.imageUrl);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 10)
      }));

      if (files.length > remainingSlots) {
        toast.error(`Only ${remainingSlots} images were added (limit 10)`);
      }
      toast.success("Images uploaded successfully");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Failed to upload some images");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
        propertyImages: formData.images.join(","), // Cloudinary URLs joined by comma
        agentId: user?.id || null,
        isActive: true,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      await propertyApi.post("", propertyData, {
        params: { agentId: user?.id }
      });

      toast.success("Property listed successfully!");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      toast.error("Failed to submit property: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const form = document.getElementById("property-form");
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (loading) {
    return <div className="post-property-page"><Navbar /><div className="loader-container"><div className="loader"></div></div><Footer /></div>;
  }

  const isVerified = agentStatus?.joined && agentStatus?.approved;

  if (!user || user.role !== "AGENT" || !isVerified) {
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
              <LockIcon size={32} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#fff' }}>
              {user?.role !== "AGENT" ? "Access Restricted" : "Verification Required"}
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.1rem', lineHeight: '1.6' }}>
              {user?.role !== "AGENT" 
                ? "This feature is exclusively available for registered agents."
                : !agentStatus?.joined 
                  ? "You must be an approved member of an agency before you can list properties. Please join an agency or wait for your request to be approved."
                  : "Your agency is currently awaiting platform verification. You'll be able to list properties once the Super Admin approves your agency."}
            </p>
            <button
               onClick={() => navigate(user?.role === "AGENT" ? "/dashboard?tab=agency" : "/")}
              className="nav-btn next"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {user?.role === "AGENT" ? "Check Agency Status" : "Return to Home"}
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
            <div className="step-number">{step > 1 ? <CheckIcon size={16} /> : "1"}</div>
            <span>Basic Info</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">{step > 2 ? <CheckIcon size={16} /> : "2"}</div>
            <span>Property Details</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-number">{step > 3 ? <CheckIcon size={16} /> : "3"}</div>
            <span>Amenities</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-number">{step > 4 ? <CheckIcon size={16} /> : "4"}</div>
            <span>Photos</span>
          </div>
        </div>

        <form id="property-form" className="property-form" onSubmit={handleSubmit}>
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
                        {formData.type === type && <CheckIcon size={14} />}
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
                        {formData.purpose === purpose && <CheckIcon size={14} />}
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
                  <label>{formData.type === "Projects" ? "Project Area (sq.ft) *" : "Area (sq.ft) *"}</label>
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

              {formData.type === "Projects" && (
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

              {formData.type !== "Projects" && (
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
                <label>Full Address *</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="Enter the complete address (House/Flat No, Building Name, Street, Landmark) so clients can find the property easily." 
                  rows="3" 
                  required
                />
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
                      {formData.amenities.includes(amenity) && <CheckIcon size={14} />}
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
              <div
                className={`image-upload-area ${uploadingImages ? 'uploading' : ''}`}
                onClick={() => !uploadingImages && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  id="images"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  hidden
                />
                <div className="upload-label">
                  {uploadingImages ? (
                    <>
                      <div className="loader"></div>
                      <span>Processing Images...</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon size={40} />
                      <span>{formData.images.length === 0 ? "Click to upload images" : `Add more images (${formData.images.length}/10)`}</span>
                      <small>Maximum 10 images. High-quality photos attract more buyers.</small>
                    </>
                  )}
                </div>
              </div>
              {formData.images.length > 0 && (
                <div className="uploaded-images">
                  {formData.images.map((img, index) => (
                    <div key={index} className="uploaded-image">
                      <img src={img} alt={`Upload ${index + 1}`} />
                      <button type="button" className="remove-image" onClick={() => removeImage(index)}><XIcon size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-navigation">
            {step > 1 && <button key="prev-btn" type="button" className="nav-btn prev" onClick={prevStep}>Previous</button>}
            {step < 4 ? (
              <button key="next-btn" type="button" className="nav-btn next" onClick={nextStep}>Next</button>
            ) : (
              <button key="submit-btn" type="submit" className="nav-btn submit" disabled={loading}>{loading ? "Submitting..." : "Submit Property"}</button>
            )}
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default PostProperty;


