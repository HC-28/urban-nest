import React from "react";
import { useNavigate } from "react-router-dom";

export const EntityLink = ({ id, type, name, style = {}, onClickOverride }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClickOverride) {
            onClickOverride();
            return;
        }

        if (!id) return;

        if (type === "property") {
            navigate(`/property/${id}`);
        } else if (type === "agent") {
            navigate(`/agent/${id}`);
        }
    };

    const baseStyle = { 
        cursor: id ? "pointer" : "default", 
        color: id ? "var(--secondary-color)" : "inherit", 
        fontWeight: type === "property" ? 600 : "normal",
        ...style 
    };

    return (
        <span
            style={baseStyle}
            onClick={handleClick}
            title={id ? `View ${type === "agent" ? "agent profile" : "property"}` : ""}
            className="entity-link hoverable"
        >
            {name}
        </span>
    );
};


