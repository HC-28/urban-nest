import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { agencyApi } from "../../services/api";

const PlusIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const LinkIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

function AgencyManagement({ user, onUpdateUser }) {
  const [agency, setAgency] = useState(null);
  const [agentStatus, setAgentStatus] = useState("INDEPENDENT");
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [pendingAgents, setPendingAgents] = useState([]);
  
  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: "",
    bio: "",
    licenseNumber: "",
    logo: ""
  });

  useEffect(() => {
    fetchMyAgency();
  }, [user.id]);

  const fetchMyAgency = async () => {
    try {
      const { data } = await agencyApi.getMe();
      setAgency(data.agency);
      setAgentStatus(data.agencyStatus || "INDEPENDENT");
      
      // If user is owner, fetch pending requests
      if (data.agency?.admin?.id === user.id) {
        fetchPendingAgents();
      }
    } catch (err) {
      setAgency(null);
      setAgentStatus("INDEPENDENT");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAgents = async () => {
    try {
      const { data } = await agencyApi.getPendingAgents();
      setPendingAgents(data);
    } catch (err) {
      console.error("Failed to fetch pending agents", err);
    }
  };

  const handleJoinAgency = async (e) => {
    e.preventDefault();
    if (!joinCode) return toast.error("Please enter an agency code");

    try {
      const { data } = await agencyApi.post(`/join`, {
        agencyCode: joinCode
      });
      toast.success(data.message);
      setJoinCode("");
      fetchMyAgency();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to join agency");
    }
  };

  const handleRegisterAgency = async (e) => {
    e.preventDefault();
    if (!regForm.name) return toast.error("Agency name is required");

    try {
      await agencyApi.register(regForm);
      toast.success("Agency registered! Waiting for platform approval.");
      setShowRegisterForm(false);
      fetchMyAgency();
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
  };

  const handleAgentAction = async (profileId, action) => {
    try {
      if (action === 'approve') {
        await agencyApi.approveAgent(profileId);
      } else {
        await agencyApi.rejectAgent(profileId);
      }
      toast.success(`Agent ${action}d successfully`);
      fetchPendingAgents();
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const handleRegisterLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegForm({ ...regForm, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="loading-spinner">Loading Agency Info...</div>;

  // --- UI RENDER LOGIC ---

  // 1. PENDING JOIN REQUEST VIEW (For Agents)
  if (agency && agentStatus === "PENDING") {
    return (
      <div className="agency-pending-view">
        <div className="pending-card">
          <div className="pulse-icon">⏳</div>
          <h2>Join Request Pending</h2>
          <p>You have requested to join <strong>{agency.name}</strong>.</p>
          <p className="sub-text">Please wait for the agency administrator to approve your request.</p>
          <button className="cancel-request-btn" onClick={() => handleAgentAction(user.id, 'reject')}>
            Cancel Join Request
          </button>
        </div>
      </div>
    );
  }

  // 2. REJECTED VIEW
  if (agentStatus === "REJECTED") {
    return (
      <div className="agency-pending-view">
        <div className="pending-card rejected">
          <div className="pulse-icon">❌</div>
          <h2>Request Denied</h2>
          <p>Your request to join <strong>{agency.name}</strong> was not approved.</p>
          <button className="join-btn" onClick={() => setAgentStatus("INDEPENDENT")}>
            Try Joining Another Agency
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agency-management">
      {agency && agentStatus === "JOINED" ? (
        <div className="agency-active-dashboard">
          {/* Agency Identity Card */}
          <div className="agency-details-card">
            <div className="agency-header">
              {agency.logo ? (
                <img src={agency.logo} alt={agency.name} className="agency-logo-large" />
              ) : (
                <div className="agency-logo-placeholder">{agency.name.charAt(0)}</div>
              )}
              <div className="agency-title-info">
                <h2>{agency.name}</h2>
                <div className="status-badges">
                  <span className="agency-badge">Official Member</span>
                  {agency.status === 'PENDING' && (
                    <span className="agency-badge warning">Pending Platform Verification</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="agency-info-body">
              <div className="info-item">
                <label>Agency Join Code</label>
                <code>{agency.agencyCode}</code>
                <p className="sub-text">Give this code to agents you want to recruit.</p>
              </div>
              <div className="info-item">
                <label>License Number</label>
                <span>{agency.licenseNumber || "N/A"}</span>
              </div>
              <div className="info-item full">
                <label>About Agency</label>
                <p>{agency.bio || "No bio available."}</p>
              </div>
            </div>

            <div className="agency-actions">
               {agency.admin?.id !== user.id && (
                 <button className="leave-agency-btn" onClick={() => toast.error("Please contact owner to leave")}>
                   Leave Agency
                 </button>
               )}
            </div>
          </div>

          {/* OWNER ONLY: PENDING AGENTS SECTION */}
          {agency.admin?.id === user.id && (
             <div className="owner-requests-section">
                <h3>New Join Requests ({pendingAgents.length})</h3>
                {pendingAgents.length === 0 ? (
                  <p className="no-requests">No pending join requests.</p>
                ) : (
                  <div className="requests-list">
                    {pendingAgents.map(req => (
                      <div key={req.profileId} className="request-card">
                        <div className="request-user">
                          <strong>{req.name}</strong>
                          <span>{req.email}</span>
                          <small>Exp: {req.experience || "Not stated"}</small>
                        </div>
                        <div className="request-actions">
                          <button className="approve-btn" onClick={() => handleAgentAction(req.profileId, 'approve')}>Approve</button>
                          <button className="reject-btn" onClick={() => handleAgentAction(req.profileId, 'reject')}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}
        </div>
      ) : (
        <div className="no-agency-view">
          {!showRegisterForm ? (
            <div className="independent-actions">
              <div className="join-section">
                <h3>Join an Existing Agency</h3>
                <p>Enter the unique code provided by your agency administrator.</p>
                <form onSubmit={handleJoinAgency} className="join-form">
                  <input 
                    type="text" 
                    placeholder="Enter Agency Code (e.g. SKY77)" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  />
                  <button type="submit" className="join-btn">
                    <LinkIcon /> Send Request
                  </button>
                </form>
              </div>

              <div className="divider"><span>OR</span></div>

              <div className="register-promo">
                <h3>Start Your Own Agency</h3>
                <p>Register your professional real estate firm and manage your own team of agents.</p>
                <button className="register-trigger-btn" onClick={() => setShowRegisterForm(true)}>
                   <PlusIcon /> Create My Agency
                </button>
              </div>
            </div>
          ) : (
            <div className="register-agency-form-container">
               <div className="form-header">
                 <h3>Register New Agency</h3>
                 <button className="cancel-text-btn" onClick={() => setShowRegisterForm(false)}>Cancel</button>
               </div>
               <form onSubmit={handleRegisterAgency} className="agency-reg-form">
                 <div className="form-grid">
                    <div className="form-group full">
                       <label>Agency Name*</label>
                       <input 
                         type="text" 
                         value={regForm.name} 
                         onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                         placeholder="e.g. Skyline Estates"
                         required
                       />
                    </div>
                    <div className="form-group">
                       <label>License Number</label>
                       <input 
                         type="text" 
                         value={regForm.licenseNumber} 
                         onChange={(e) => setRegForm({...regForm, licenseNumber: e.target.value})}
                         placeholder="RERA-XXXXX"
                       />
                    </div>
                    <div className="form-group">
                       <label>Agency Logo (Base64)</label>
                       <input 
                         type="file" 
                         accept="image/*"
                         onChange={handleRegisterLogoChange}
                       />
                    </div>
                    <div className="form-group full">
                       <label>Short Bio / Description</label>
                       <textarea 
                        value={regForm.bio} 
                        onChange={(e) => setRegForm({...regForm, bio: e.target.value})}
                        placeholder="Describe your agency's expertise..."
                       />
                    </div>
                 </div>
                 <button type="submit" className="submit-reg-btn">Register Agency</button>
               </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AgencyManagement;



