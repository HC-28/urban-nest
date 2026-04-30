import React, { useState, useEffect } from "react";
import { appointmentApi, slotsApi, chatApi } from "../../services/api";
import toast from "react-hot-toast";
import "./AppointmentActionPanel.css";

export default function AppointmentActionPanel({
    propertyId,
    buyerId,
    agentId,
    userRole,
    isHeader = false
}) {
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [showSlots, setShowSlots] = useState(false);

    useEffect(() => {
        fetchAppointmentStatus();
    }, [propertyId, buyerId, agentId]);

    const fetchAppointmentStatus = async () => {
        setLoading(true);
        try {
            // Fetch appointments using hardened session-based endpoint
            const res = userRole === "BUYER" 
                ? await appointmentApi.getMyBuyerAppointments()
                : await appointmentApi.getMyAgentAppointments();

            if (res.data && Array.isArray(res.data)) {
                const activeAppt = res.data.find(a =>
                    String(a.propertyId) === String(propertyId) &&
                    String(a.agentId) === String(agentId) &&
                    a.status !== 'cancelled' // keep expired, pending, confirmed, awaiting_buyer, etc.
                );

                // If there's an active appointment, sort to find the latest
                if (activeAppt) {
                    const sorted = res.data
                        .filter(a => String(a.propertyId) === String(propertyId) && String(a.agentId) === String(agentId) && a.status !== 'cancelled')
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setAppointment(sorted[0]);
                } else {
                    setAppointment(null);
                }
            }
        } catch (e) {
            console.error("Failed to fetch appointment status", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBookRequest = async () => {
        try {
            await appointmentApi.post("", {
                propertyId: propertyId
            });
            toast.success("Appointment request sent! Agent will assign a slot.");
            fetchAppointmentStatus();
        } catch (e) {
            toast.error(e.response?.data?.error || "Failed to send request");
        }
    };

    const handleAgentBookWithSlot = async (slotId) => {
        try {
            await appointmentApi.post("", {
                propertyId: propertyId,
                slotId: slotId
            });
            toast.success("Appointment booked successfully!");
            setShowSlots(false);
            fetchAppointmentStatus();
        } catch (e) {
            toast.error(e.response?.data?.error || "Failed to book appointment");
        }
    };

    const handleAssignSlot = async (slotId) => {
        try {
            await appointmentApi.post(`/${appointment.id}/assign-slot`, {
                slotId: slotId
            });
            toast.success("Slot assigned! Buyer has been notified.");
            setShowSlots(false);
            fetchAppointmentStatus();
        } catch (e) {
            toast.error(e.response?.data?.error || "Failed to assign slot");
        }
    };

    const handleBuyerConfirm = async (answer) => {
        if (!appointment) return;
        try {
            await appointmentApi.put(`/${appointment.id}/buyer-confirmation`, { answer });
            if (answer === "YES") toast.success("Confirmed! Waiting for Agent to verify.");
            else toast.success("Purchase denied.");
            fetchAppointmentStatus();
        } catch (e) {
            toast.error(e.response?.data || "Failed to confirm");
        }
    };

    const handleAgentConfirm = async (answer) => {
        if (!appointment) return;
        try {
            await appointmentApi.put(`/${appointment.id}/agent-confirmation`, { answer });
            if (answer === "YES") toast.success("Sale Confirmed! Property marked as SOLD.");
            else toast.success("Sale denied.");

            // If yes, trigger a broadcast chat message
            if (answer === "YES") {
                await chatApi.post("/messages", {
                    propertyId,
                    agentId,
                    sender: "SYSTEM",
                    message: "🚨 UPDATE: This property has been officially SOLD to a verified buyer. Thank you for your interest."
                });
            }

            fetchAppointmentStatus();
        } catch (e) {
            toast.error(e.response?.data || "Failed to confirm");
        }
    };

    if (loading) return <div className="panel-loading">Loading...</div>;

    const renderBuyerView = () => {
        if (!appointment || appointment.status === 'expired') {
            return (
                <div className="panel-ready">
                    {appointment?.status === 'expired' && <span className="status-label expired">Previous timer expired.</span>}
                    <button className="book-btn" onClick={handleBookRequest}>Request Appointment</button>
                </div>
            );
        }

        if (appointment.status === 'pending') {
            return (
                <div className="panel-pending">
                    <span className="status-label info">Request Sent. Waiting for Agent to assign a slot.</span>
                </div>
            );
        }

        if (appointment.status === 'confirmed') {
            return (
                <div className="panel-timer">
                    <span className="status-label active">Appointment at {appointment.appointmentTime}</span>
                </div>
            );
        }

        if (appointment.status === 'awaiting_buyer') {
            return (
                <div className="panel-verify">
                    <span className="status-label warning">Did you buy this?</span>
                    <button className="yes-btn" onClick={() => handleBuyerConfirm('YES')}>Yes</button>
                    <button className="no-btn" onClick={() => handleBuyerConfirm('NO')}>No</button>
                    <span className="expires-txt">Expires: {new Date(appointment.confirmationDeadline).toLocaleDateString()}</span>
                </div>
            );
        }

        if (appointment.status === 'awaiting_agent') {
            return <span className="status-label info">Waiting for Agent confirmation</span>;
        }

        if (appointment.status === 'sold') {
            return <span className="status-label sold">Sale Completed ✓</span>;
        }

        return null;
    };

    const renderAgentView = () => {
        if (!appointment) {
            return (
                <div className="panel-ready">
                    <span className="status-label info">Waiting for Buyer to request</span>
                </div>
            );
        }

        if (appointment.status === 'pending') {
            return (
                <div className="panel-pending">
                    <button
                        className="book-btn"
                        onClick={async () => {
                            try {
                                const res = await slotsApi.get(`/property/${propertyId}`);
                                setAvailableSlots(res.data);
                                setShowSlots(true);
                            } catch (e) {
                                toast.error("No slots available to assign");
                            }
                        }}
                    >
                        Assign Slot
                    </button>
                    {showSlots && (
                        <div className="slots-dropdown">
                            <button className="close-slots" onClick={() => setShowSlots(false)}>×</button>
                            {availableSlots.length > 0 ? availableSlots.map(s => (
                                <div key={s.id} className="slot-option">
                                    <span>{s.slotDate} {s.slotTime}</span>
                                    <button onClick={() => handleAssignSlot(s.id)}>Assign</button>
                                </div>
                            )) : <p>No slots found. Create some in Dashboard.</p>}
                        </div>
                    )}
                </div>
            );
        }

        if (appointment.status === 'confirmed') {
            return (
                <div className="panel-timer">
                    <span className="status-label active">Appt at {appointment.appointmentTime}</span>
                    <button
                        className="verify-btn"
                        onClick={async () => {
                            // Automatically simulate the 5day timer trigger logic for demo
                            try {
                                // Direct update using repo isn't here, normally ScheduledTask does this or Agent clicks "Showed Property"
                                // We simulate passing it to verifying state
                                await appointmentApi.post(`/${appointment.id}/visit`);
                                fetchAppointmentStatus();
                            } catch (e) { }
                        }}
                    >
                        Mark as Shown
                    </button>
                </div>
            );
        }

        if (appointment.status === 'awaiting_buyer') {
            return <span className="status-label info">Waiting for Buyer to respond (5-day timer)</span>;
        }

        if (appointment.status === 'awaiting_agent') {
            return (
                <div className="panel-verify">
                    <span className="status-label warning">Buyer confirmed purchase. Verify?</span>
                    <button className="yes-btn" onClick={() => handleAgentConfirm('YES')}>Approve</button>
                    <button className="no-btn" onClick={() => handleAgentConfirm('NO')}>Deny</button>
                </div>
            );
        }

        if (appointment.status === 'sold') {
            return <span className="status-label sold">Sale Completed ✓</span>;
        }

        return <span className="status-label expired">Expired / Cancelled</span>;
    };

    return (
        <div className={`appointment-action-panel ${isHeader ? 'header-mode' : ''}`}>
            {userRole === 'BUYER' ? renderBuyerView() : renderAgentView()}
        </div>
    );
}




