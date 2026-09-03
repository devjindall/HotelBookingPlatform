import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Sparkles } from 'lucide-react';
import '../styles/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/hotels';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Welcome Back</h1>
          <p className="auth-card-subtitle">Sign in to manage your bookings and explore curated stays</p>
        </div>

        {error && (
          <div className="auth-error-alert" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., kenji.sato@example.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }}>
            {loading ? <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#FFF' }}></div> : <LogIn size={16} />}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '20px' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Create an account</Link>
        </p>

        {/* Demo Fast Fill Credentials for Placement Demos */}
        <div className="demo-credentials-box">
          <span className="demo-title">Quick Demo Login (Password: password123)</span>
          <div className="demo-users-list">
            <button 
              type="button" 
              className="demo-user-btn"
              onClick={() => handleQuickFill('kenji.sato@example.com')}
            >
              <span><strong>Kenji Sato</strong> (3 bookings)</span>
              <span>kenji.sato@example.com</span>
            </button>
            <button 
              type="button" 
              className="demo-user-btn"
              onClick={() => handleQuickFill('aoi.tanaka@example.com')}
            >
              <span><strong>Aoi Tanaka</strong> (Active & cancelled)</span>
              <span>aoi.tanaka@example.com</span>
            </button>
            <button 
              type="button" 
              className="demo-user-btn"
              onClick={() => handleQuickFill('alex.morgan@example.com')}
            >
              <span><strong>Alex Morgan</strong> (Kyoto traveler)</span>
              <span>alex.morgan@example.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
