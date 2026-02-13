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

  // Popular cities and localities
  const popularCities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad",
    "Chennai", "Kolkata", "Pune", "Jaipur", "Surat",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
    "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"
  ];

  const locationsByCity = {
    "Mumbai": ["Bandra", "Andheri", "Powai", "Juhu", "Worli", "Colaba", "Dadar", "Malad"],
    "Delhi": ["Connaught Place", "Dwarka", "Rohini", "Saket", "Vasant Kunj", "Karol Bagh"],
    "Bangalore": ["Koramangala", "Whitefield", "Indiranagar", "HSR Layout", "Electronic City"],
    "Hyderabad": ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Madhapur", "Hitech City"],
    "Pune": ["Koregaon Park", "Hinjewadi", "Wakad", "Baner", "Kothrud", "Viman Nagar"]
  };

  // Check if property type needs BHK/floor fields
  const needsBHK = !["Plot", "Commercial"].includes(formData.type);
  const needsFloors = !["Plot", "Villa", "House"].includes(formData.type);

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
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB Limit

    files.forEach((file) => {
      if (file.size > MAX_SIZE) {
        alert(`File ${file.name} is too large. Please upload images under 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const maxWidth = 1600; // Increased resolution for better quality
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8); // Slightly higher quality

          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, compressedBase64].slice(0, 15), // Increased max images to 15
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
      // 1. Validation for crucial fields
      if (!formData.title || !formData.price || !formData.area || !formData.pinCode || !formData.city || !formData.location) {
        alert("Please fill in all required fields marked with *");
        setLoading(false);
        return;
      }

      if (!user || !user.id) {
        alert("Please login as an agent to post a property");
        setLoading(false);
        navigate("/login");
        return;
      }

      // 2. Prepare data with ALL new fields
      const propertyData = {
        title: formData.title,
        description: formData.description || `Beautiful ${formData.bhk} BHK ${formData.type} in ${formData.location}, ${formData.city}.`,
        type: formData.type,
        purpose: formData.purpose,
        price: parseFloat(formData.price) || 0,
        area: parseFloat(formData.area) || 0,
        bhk: parseInt(formData.bhk) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        balconies: parseInt(formData.balconies) || 0,
        floor: formData.floor,
        totalFloors: formData.totalFloors,
        facing: formData.facing,
        furnishing: formData.furnishing,
        age: formData.age,
        city: formData.city,
        location: formData.location,
        address: formData.address,
        pinCode: formData.pinCode,
        amenities: formData.amenities.join(","),
        photos: formData.images.join(","),
        isActive: true
      };

      console.log("Submitting to Backend:", propertyData);

      const response = await propertyApi.post("", propertyData, {
        params: { agentId: user.id }
      });

      if (response.status === 200 || response.status === 201) {
        alert("Property listed successfully!");
        navigate("/"); // Navigate to home or dashboard
      }

    } catch (error) {
      console.error("Submission Error:", error);
      const serverMessage = error.response?.data?.message || error.response?.data;
      const errorMessage = typeof serverMessage === 'string' ? serverMessage : "Failed to list property. The image combined size might be too large for the database.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          alert("Please enter a property title");
          return false;
        }
        if (!formData.type) {
          alert("Please select a property type");
          return false;
        }
        if (!formData.price || formData.price <= 0) {
          alert("Please enter a valid price");
          return false;
        }
        if (!formData.area || formData.area <= 0) {
          alert("Please enter a valid area");
          return false;
        }
        if (!formData.bhk) {
          alert("Please select BHK");
          return false;
        }
        break;
      case 2:
        if (!formData.city.trim()) {
          alert("Please enter a city");
          return false;
        }
        if (!formData.location.trim()) {
          alert("Please enter a location");
          return false;
        }
        if (!formData.pinCode.trim()) {
          alert("Please enter a pin code");
          return false;
        }
        if (!formData.address.trim()) {
          alert("Please enter an address");
          return false;
        }
        break;
      case 3:
        // Amenities are optional, no validation needed
        break;
      case 4:
        if (formData.images.length === 0) {
          alert("Please upload at least one image");
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

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
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navbar />
      <div className="post-property-container">
        <div className="post-header">
          <h1>List Your Property</h1>
          <p>Fill in the details to list your property and reach thousands of potential buyers</p>
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

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell buyers about your property's highlights, neighborhood, and features..."
                  rows="4"
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
                    placeholder="e.g. 7500000"
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
                    placeholder="e.g. 1200"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="form-step">
              <h2>Property Details & Location</h2>

              <div className="form-row">
                {needsBHK && (
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
                )}

                {needsBHK && (
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
                )}

                {needsBHK && (
                  <div className="form-group">
                    <label>Balconies</label>
                    <select name="balconies" value={formData.balconies} onChange={handleChange}>
                      <option value="0">None</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3+</option>
                    </select>
                  </div>
                )}
              </div>

              {needsFloors && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Floor No.</label>
                    <input
                      type="text"
                      name="floor"
                      value={formData.floor}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Floors</label>
                    <input
                      type="text"
                      name="totalFloors"
                      value={formData.totalFloors}
                      onChange={handleChange}
                      placeholder="e.g., 20"
                    />
                  </div>
                </div>
              )}

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
                  <input
                    type="text"
                    name="age"
                    placeholder="e.g. 2 years"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select City</option>
                    {popularCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Location/Area *</label>
                  {formData.city && locationsByCity[formData.city] ? (
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Location</option>
                      {locationsByCity[formData.city].map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                      <option value="other">Other (Type below)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Bandra West"
                      required
                    />
                  )}
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
                <label>Detailed Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House No, Street Name, Landmark..."
                  rows="2"
                  required
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
        </form>
      </div>

      <Footer />
    </div> // Closes post-property-page
  );
}

export default PostProperty;