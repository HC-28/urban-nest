import React from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/hero-bg.png';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f8fafc',
      textAlign: 'center',
      padding: '0 20px'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        padding: '60px 40px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: '800',
          margin: '0',
          background: 'linear-gradient(135deg, #d4a006, #fcd34d)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1'
        }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.8rem', margin: '20px 0', fontWeight: '600' }}>Page Not Found</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px' }}>
          We can't seem to find the page you're looking for. It might have been removed or the link is incorrect.
        </p>
        <button
          onClick={() => navigate('/')}
          className="nav-btn next"
          style={{ padding: '12px 30px', fontSize: '1.1rem', fontWeight: '600', width: '100%' }}
        >
          Return to Homepage
        </button>
      </div>
    </div>
  );
};

export default NotFound;
