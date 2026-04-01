import { useState, useEffect } from "react";
import { FiArrowUp } from "react-icons/fi"; // Importing the Feather icon

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="back-to-top-btn"
      aria-label="Back to top"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 9999,
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
        transition: 'transform 0.2s, opacity 0.3s',
        animation: 'fadeIn 0.3s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Using the Fi icon here! You can adjust size and strokeWidth easily */}
      <FiArrowUp
        size={26}
        color="#ffffff"
        strokeWidth="3"
        style={{ display: 'block', flexShrink: 0, width: '26px', height: '26px' }}
      />
    </button>
  );
}

export default BackToTop;