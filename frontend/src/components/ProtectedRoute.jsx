import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the intended destination in redirect state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
