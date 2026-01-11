import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PostProperty.css";
import { FiUpload, FiX, FiCheck } from "react-icons/fi";
import { propertyApi } from "../api/api";
import heroBg from "../assets/re-back.jpg"; // Add this line with other imports
function PostProperty() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Apartment",
    purpose: "Sale",
    price: "",
    area: "",
    bhk: "2",
    bathrooms: "2",
    balconies: "1",
    floor: "",
    totalFloors: "",
    facing: "East",
    furnishing: "Unfurnished",
    age: "New Construction",
    city: "",
    location: "",
    pinCode: "",
    address: "",
    amenities: [],
    images: []
  });

  const amenitiesList = [
    "Swimming Pool", "Gym", "24/7 Security", "Power Backup",
    "Lift", "Club House", "Children's Play Area", "Jogging Track",
    "Covered Parking", "Intercom", "Fire Safety", "Rain Water Harvesting",
    "Garden", "CCTV", "Visitor Parking", "Maintenance Staff"
  ];


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB Limit

    files.forEach((file) => {

      if (file.size > MAX_SIZE) {
        alert(`File ${file.name} is too large. Please upload images under 1MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          // 2. Simple Compression using Canvas
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");


          const maxWidth = 1200;
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);


          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, compressedBase64].slice(0, 10),
          }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validation (Added description since your form has it)
      if (!formData.title || !formData.price || !formData.area || !formData.pinCode || !formData.description) {
        alert("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (!user || !user.id) {
        alert("Please login as an agent to post a property");
        setLoading(false);
        navigate("/login");
        return;
      }

      // 2. Prepare data
      const propertyData = {
        title: formData.title,
        type: formData.type || "Apartment",
        price: parseFloat(formData.price) || 0,
        area: parseFloat(formData.area) || 0,
        bhk: parseInt(formData.bhk) || 2,
        pinCode: formData.pinCode,
        photos: formData.images.join(","),

        // Ensure description is included if your Entity has it
        description: formData.description,
        isActive: true
      };

      console.log("Submitting to Backend:", propertyData);

      // 3. API Call
      // Ensure propertyApi base URL is correctly set to /api/properties
      const response = await propertyApi.post("", propertyData, {
        params: { agentId: user.id }
      });

      if (response.status === 200 || response.status === 201) {
        alert("Property listed successfully!");
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Submission Error:", error);

      // Better error parsing
      const serverMessage = error.response?.data?.message || error.response?.data;
      const errorMessage = typeof serverMessage === 'string' ? serverMessage : "Failed to list property. Check if your image size is too large.";

      alert(errorMessage);
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
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only registered agents can post properties.</p>
            <button onClick={() => navigate("/")}>Go to Home</button>
          </div>
          <Footer />
        </div>
    );
  }

  return (
      <div
          className="post-property-page"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8)), url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
      >
        <Navbar />
        <div className="post-property-container">
          <div className="post-header">
            <h1 style={{ color: '#ffffff' }}>List Your Property</h1>
            <p style={{ color: '#cbd5e1' }}>Fill in the details to list your property and reach thousands of potential buyers</p>
          </div>

          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">{step > 1 ? <FiCheck /> : 1}</div>
              <span>Basic Info</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">{step > 2 ? <FiCheck /> : 2}</div>
              <span>Property Details</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="step-number">{step > 3 ? <FiCheck /> : 3}</div>
              <span>Amenities</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <span>Photos</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="property-form">
            {/* Step 1: Basic Info */}
            {step === 1 && (
                <div className="form-step">
                  <h2>Basic Information</h2>

                  <div className="form-group">
                    <label>Property Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Luxury 3BHK Apartment in Bandra"
                        required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Property Type *</label>
                      <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="House">Independent House</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Studio">Studio</option>
                        <option value="Plot">Plot/Land</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Purpose *</label>
                      <select name="purpose" value={formData.purpose} onChange={handleChange}>
                        <option value="Sale">For Sale</option>
                        <option value="Rent">For Rent</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (₹) *</label>
                      <input
                          type="number"
                          name="price"
                          required
                          min="1"
                          placeholder="e.g. 20000"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Area (sq. ft.) *</label>
                      <input
                          type="number"
                          name="area"
                          required
                          min="1"
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Full Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter complete address with landmark"
                        rows="3"
                    />
                  </div>

              </div>
              )}

            {/* Step 2: Property Details */}
            {step === 2 && (
                <div className="form-step">
                  <h2>Property Details</h2>

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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Floor No.</label>
                      <input
                          type="number"
                          name="floor"
                          value={formData.floor}
                          onChange={handleChange}
                          placeholder="e.g., 5"
                      />
                    </div>

                    <div className="form-group">
                      <label>Total Floors</label>
                      <input
                          type="number"
                          name="totalFloors"
                          value={formData.totalFloors}
                          onChange={handleChange}
                          placeholder="e.g., 20"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Facing</label>
                      <select name="facing" value={formData.facing} onChange={handleChange}>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="North-East">North-East</option>
                        <option value="North-West">North-West</option>
                        <option value="South-East">South-East</option>
                        <option value="South-West">South-West</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Furnishing</label>
                      <select name="furnishing" value={formData.furnishing} onChange={handleChange}>
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Property Age</label>
                      <select name="age" value={formData.age} onChange={handleChange}>
                        <option value="New Construction">New Construction</option>
                        <option value="Less than 1 year">Less than 1 year</option>
                        <option value="1-3 years">1-3 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5-10 years">5-10 years</option>
                        <option value="More than 10 years">More than 10 years</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g., Mumbai"
                          required
                      />
                    </div>

                    <div className="form-group">
                      <label>Location/Area *</label>
                      <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="e.g., Bandra West"
                          required
                      />
                    </div>
                    <div className="form-group">
                      <label>Pincode *</label>
                      <input
                          type="text"
                          name="pinCode"
                          required
                          placeholder="Enter 6-digit pincode"
                          maxLength="6"
                          // Regex: Only allows exactly 6 digits
                          pattern="\d{6}"
                          value={formData.pinCode}
                          onChange={(e) => {
                            // Prevent typing non-numeric characters
                            const value = e.target.value.replace(/\D/g, "");
                            setFormData({ ...formData, pinCode: value });
                          }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Full Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter complete address with landmark"
                        rows="3"
                    />
                  </div>
                </div>
            )}
                  {/* Step 3: Amenities */}
                  {step === 3 && (
                      <div className="form-step">
                        <h2>Amenities & Features</h2>
                        <p className="step-desc">Select all amenities available in your property</p>

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
                  )}

                  {/* Step 4: Photos */}
                  {step === 4 && (
                      <div className="form-step">
                        <h2>Property Photos</h2>
                        <p className="step-desc">Add up to 10 photos to showcase your property</p>

                        <div className="image-upload-area">
                          <input
                              type="file"
                              id="images"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              hidden
                          />
                          <label htmlFor="images" className="upload-label">
                            <FiUpload size={40} />
                            <span>Click to upload images</span>
                            <small>JPG, PNG up to 1MB each</small>
                          </label>
                        </div>

                        {formData.images.length > 0 && (
                            <div className="uploaded-images">
                              {formData.images.map((img, index) => (
                                  <div key={index} className="uploaded-image">
                                    <img src={img} alt={`Upload ${index + 1}`} />
                                    <button
                                        type="button"
                                        className="remove-image"
                                        onClick={() => removeImage(index)}
                                    >
                                      <FiX />
                                    </button>
                                  </div>
                              ))}
                            </div>
                        )}

                        {formData.images.length === 0 && (
                            <p className="upload-hint">Please upload at least one photo to continue</p>
                        )}
                      </div>
                  )}
                  {/* Navigation Buttons */}
                  <div className="form-navigation">
                    {step > 1 && (
                        <button type="button" className="nav-btn prev" onClick={prevStep}>
                          Previous
                        </button>
                    )}

                    {step < 4 ? (
                        <button type="button" className="nav-btn next" onClick={nextStep}>
                          Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="nav-btn submit"
                            disabled={loading || formData.images.length === 0}
                        >
                          {loading ? "Submitting..." : "Submit Property"}
                        </button>
                    )}
                  </div>
                </form> {/* Added missing closing form tag */}
              </div> {/* Added missing closing container tag */}

            <Footer />
        </div> // Closes post-property-page
        );
        }

        export default PostProperty;