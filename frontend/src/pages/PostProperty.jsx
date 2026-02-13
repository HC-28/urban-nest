import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PostProperty.css";
import { FiUpload, FiX, FiCheck } from "react-icons/fi";
import { propertyApi } from "../api";
import heroBg from "../assets/re-back.jpg"; // Add this line with other imports
function PostProperty() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "Apartment",
    purpose: "For Sale",
    price: "",
    area: "",
    bhk: "2",
    balconies: "1",
    floor: "",
    totalFloors: "",
    age: "New Construction",
    // Removed city field - use pinCode instead
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
const purposeOptions = [
  "For Sale",
  "For Rent",
  "Commercial",
  "Project"
];

// 🔥 Property Type Options (UI only)
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

const handleImageUpload = (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  const newFiles = files.slice(0, 10 - formData.images.length);

  const imageObjects = newFiles.map(file => ({
    file,
    preview: URL.createObjectURL(file)
  }));

  setFormData(prev => ({
    ...prev,
    images: [...prev.images, ...imageObjects].slice(0, 10)
  }));

  // ✅ IMPORTANT: reset input
  e.target.value = "";
};




 const removeImage = (index) => {
   setFormData(prev => {
     const imageToRemove = prev.images[index];

     if (imageToRemove?.preview) {
       URL.revokeObjectURL(imageToRemove.preview);
     }

     return {
       ...prev,
       images: prev.images.filter((_, i) => i !== index)
     };
   });
 };


const handleSubmit = async () => {
  if (step !== 4) return;

  try {
    setLoading(true);

    const formDataToSend = new FormData();

    formDataToSend.append("title", formData.title);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("price", Number(formData.price) || 0);
    formDataToSend.append("area", Number(formData.area) || 0);
    formDataToSend.append("bhk", parseInt(formData.bhk) || 2);
    formDataToSend.append("pinCode", formData.pinCode);
    formDataToSend.append("address", formData.address);
    formDataToSend.append("location", formData.location);
    formDataToSend.append("listed", true);
    formDataToSend.append("purpose", formData.purpose);
    formDataToSend.append("age", formData.age);

    if (formData.type === "Apartment") {
      formDataToSend.append("floor", formData.floor);
      formDataToSend.append("totalFloors", formData.totalFloors);
    }

    formData.images.forEach(img => {
      if (img.file) {
        formDataToSend.append("photos", img.file);
      }
    });

await propertyApi.post("/upload", formDataToSend, {
  params: { agentId: user.id }
});


    alert("Property listed successfully!");
    navigate("/dashboard");

  } catch (err) {
    console.error(err);
    alert("Failed to submit property");
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
    <div style={{
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
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

                  <div className="amenities-selection">
                    {propertyTypeOptions.map((type) => (
                      <div
                        key={type}
                        className={`amenity-chip ${
                          formData.type === type ? "selected" : ""
                        }`}
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
                        className={`amenity-chip ${
                          formData.purpose === purpose ? "selected" : ""
                        }`}
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
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter price"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Super Built-up Area (sq.ft) *</label>
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
                    <input
                      type="number"
                      name="floor"
                      value={formData.floor}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Floors *</label>
                    <input
                      type="number"
                      name="totalFloors"
                      value={formData.totalFloors}
                      onChange={handleChange}
                      placeholder="e.g., 20"
                      required
                    />
                  </div>
                </div>
              )}


              <div className="form-row">




               <div className="form-group">
                 <label>Property Age *</label>
                 <select
                   name="age"
                   value={formData.age}
                   onChange={handleChange}
                   required   // 🔥 IMPORTANT
                 >
                   <option value="">Select Property Age</option>
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
                  <label>Pin Code *</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="e.g., 400069"
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
                  <small>JPG, PNG up to 5MB each</small>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="uploaded-images">
                  {formData.images.map((img, index) => (
                    <div key={index} className="uploaded-image">
                      <img src={img.preview} alt={`Upload ${index + 1}`} />

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
                <p className="upload-hint">Upload photos to showcase your property (optional)</p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
      <div className="form-navigation">
        {step > 1 && (
          <button
            type="button"
            className="nav-btn prev"
            onClick={prevStep}
          >
            Previous
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            className="nav-btn next"
            onClick={nextStep}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="nav-btn submit"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Submitting..." : "Submit Property"}
          </button>

        )}
      </div>


      </div>
      <Footer />
    </div>
  );
}

export default PostProperty;

