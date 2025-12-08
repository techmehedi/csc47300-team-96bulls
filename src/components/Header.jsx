import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, admin, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="nav-container">
        <Link to="/" className="brand">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#f093fb', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4facfe', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#00f2fe', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g transform="translate(60, 60)">
                <circle cx="-25" cy="-15" r="6" fill="url(#logoGradient1)" filter="url(#glow)" />
                <circle cx="25" cy="-15" r="6" fill="url(#logoGradient2)" filter="url(#glow)" />
                <circle cx="0" cy="0" r="10" fill="url(#logoGradient1)" filter="url(#glow)" />
                <circle cx="-20" cy="20" r="5" fill="url(#logoGradient2)" filter="url(#glow)" />
                <circle cx="20" cy="20" r="5" fill="url(#logoGradient1)" filter="url(#glow)" />
                <line x1="-25" y1="-15" x2="0" y2="0" stroke="url(#logoGradient1)" strokeWidth="1.5" opacity="0.7" />
                <line x1="25" y1="-15" x2="0" y2="0" stroke="url(#logoGradient2)" strokeWidth="1.5" opacity="0.7" />
                <line x1="0" y1="0" x2="-20" y2="20" stroke="url(#logoGradient1)" strokeWidth="1.5" opacity="0.7" />
                <line x1="0" y1="0" x2="20" y2="20" stroke="url(#logoGradient2)" strokeWidth="1.5" opacity="0.7" />
                <circle cx="0" cy="0" r="4" fill="#ffffff" opacity="0.9" />
                <text x="-30" y="8" fontFamily="Monaco, monospace" fontSize="18" fill="url(#logoGradient1)" fontWeight="bold">{'{'}</text>
                <text x="18" y="8" fontFamily="Monaco, monospace" fontSize="18" fill="url(#logoGradient2)" fontWeight="bold">{'}'}</text>
              </g>
            </svg>
          </div>
          <span>AI Interviewer</span>
        </Link>

        <input type="checkbox" id="nav-toggle" className="nav-toggle" aria-label="Toggle navigation" />
        <label htmlFor="nav-toggle" className="nav-toggle-btn">
          <span></span><span></span><span></span>
        </label>

        <nav className="site-nav">
          {isAdmin ? (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/users">Users</Link>
              <Link to="/admin/sessions">Sessions</Link>
              <Link to="/admin/questions">Questions</Link>
              <button onClick={handleLogout} className="logout-btn">
                <i className="fa-solid fa-sign-out-alt"></i> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/services">Services</Link>
              <Link to="/contact">Contact</Link>
              {isAuthenticated && (
                <>
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/practice">Practice</Link>
                </>
              )}
              {isAuthenticated ? (
                <button onClick={handleLogout} className="logout-btn">
                  <i className="fa-regular fa-user"></i> {user?.firstName || 'Profile'} | Logout
                </button>
              ) : (
                <Link to="/login" className="login-link">
                  <i className="fa-regular fa-user"></i> Login
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
