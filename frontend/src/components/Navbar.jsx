import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Sparkles, CalendarCheck, User, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">木</span>
          <span className="brand-text">
            Komorebi <span className="brand-sub">Stays</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links desktop-only">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/hotels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Compass size={16} /> Explore Hotels
          </NavLink>
          <NavLink to="/ai-assistant" className={({ isActive }) => `nav-link ai-nav-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={16} /> AI Travel Assistant
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/my-bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <CalendarCheck size={16} /> My Bookings
            </NavLink>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="nav-auth desktop-only">
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-avatar-badge">
                <User size={15} />
                <span className="user-name">{user?.name}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log out">
                <LogOut size={15} /> Logout
              </button>
            </div>
          ) : (
            <div className="auth-actions">
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} /> Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} /> Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          className="mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <NavLink to="/" className="mobile-nav-link" onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/hotels" className="mobile-nav-link" onClick={closeMenu}>
            <Compass size={18} /> Explore Hotels
          </NavLink>
          <NavLink to="/ai-assistant" className="mobile-nav-link" onClick={closeMenu}>
            <Sparkles size={18} /> AI Travel Assistant
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/my-bookings" className="mobile-nav-link" onClick={closeMenu}>
                <CalendarCheck size={18} /> My Bookings
              </NavLink>
              <div className="mobile-auth-section">
                <p className="mobile-user-greeting">Signed in as <strong>{user?.name}</strong></p>
                <button onClick={() => { handleLogout(); closeMenu(); }} className="btn btn-secondary btn-sm full-width">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          ) : (
            <div className="mobile-auth-section">
              <Link to="/login" className="btn btn-secondary btn-sm full-width" onClick={closeMenu}>
                <LogIn size={16} /> Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm full-width" onClick={closeMenu}>
                <UserPlus size={16} /> Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
