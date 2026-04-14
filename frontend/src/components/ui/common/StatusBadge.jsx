import React from "react";

export const StatusBadge = ({ status, type = "property", style = {} }) => {
    let finalClass = "inactive";
    let displayText = status || "Unknown";

    const s = (status || "").toLowerCase();

    if (type === "property") {
        if (s === "sold") {
            finalClass = "sold";
            displayText = "Sold";
        } else if (status === true || s === "true" || s === "listed") {
            finalClass = "active";
            displayText = "Listed";
        } else {
            displayText = "Unlisted";
        }
    } else if (type === "appointment") {
        if (s === "sold") {
            finalClass = "sold";
        } else if (s === "booked" || s === "confirmed") {
            finalClass = "active";
        }
        else if (s === "pending") {
            finalClass = "inactive";
        }
    } else if (type === "user") {
        if (status === true || s === "true" || s === "active") {
            finalClass = "active";
            displayText = "Active";
        } else {
            finalClass = "inactive";
            displayText = "Banned";
        }
    } else if (type === "review") {
        if (s === "positive") {
            finalClass = "active";
            style = { ...style, background: "rgba(16, 185, 129, 0.1)", color: "var(--success)" };
        } else {
            finalClass = "inactive";
            style = { ...style, background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)" };
        }
    }

    return (
        <span className={`status-badge ${finalClass}`} style={style}>
            {displayText}
        </span>
    );
};


