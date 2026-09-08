import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1A2238', color: '#CBD5E1', padding: '48px 0 24px', marginTop: 'auto' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '36px', marginBottom: '36px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>
            <span style={{ backgroundColor: '#C86432', color: '#FFF', width: '28px', height: '28px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>木</span>
            Komorebi Stays
          </div>
          <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
            Boutique stays and heritage accommodations across Tokyo, Kyoto, and Osaka.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '14px', fontWeight: 600 }}>Destinations</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <li><Link to="/hotels?city=Tokyo" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Tokyo Hotels</Link></li>
            <li><Link to="/hotels?city=Kyoto" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Kyoto Stays</Link></li>
            <li><Link to="/hotels?city=Osaka" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Osaka Stays</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '14px', fontWeight: 600 }}>Features</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <li><Link to="/hotels" style={{ color: '#94A3B8' }}>Hotel Search</Link></li>
            <li><Link to="/ai-assistant" style={{ color: '#94A3B8' }}>AI Recommendations</Link></li>
            <li><Link to="/my-bookings" style={{ color: '#94A3B8' }}>My Bookings</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '14px', fontWeight: 600 }}>Built With</h4>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6 }}>
            React • Node.js • Express • MySQL • JWT
          </p>
        </div>
      </div>

      <div className="container" style={{ borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#64748B' }}>
        <p>© {new Date().getFullYear()} Komorebi Stays</p>
        <p>Demo Dataset • Educational Project</p>
      </div>
    </footer>
  );
}
