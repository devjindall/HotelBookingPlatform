import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/hotels');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Create Account</h1>
          <p className="auth-card-subtitle">Register to reserve luxury and boutique stays across Japan</p>
        </div>

        {error && (
          <div className="auth-error-alert" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Taro Yamada"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., taro.yamada@example.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (min 6 characters)</label>
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
            {loading ? <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#FFF' }}></div> : <UserPlus size={16} />}
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '20px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
