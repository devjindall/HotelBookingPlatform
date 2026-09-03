import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, MapPin } from 'lucide-react';

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
            Curated boutique stays and heritage accommodations across Tokyo, Kyoto, and Osaka. Built with modern full-stack engineering standards.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '14px', fontWeight: 600 }}>Destinations</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <li><Link to="/hotels?city=Tokyo" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Tokyo Hotels (8 properties)</Link></li>
            <li><Link to="/hotels?city=Kyoto" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Kyoto Ryokans & Machiya (6 properties)</Link></li>
            <li><Link to="/hotels?city=Osaka" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Osaka Skyline & Urban Stays (6 properties)</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '14px', fontWeight: 600 }}>Core Features</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <li><Link to="/hotels" style={{ color: '#94A3B8' }}>Dynamic Multi-Filter Hotel Search</Link></li>
            <li><Link to="/ai-assistant" style={{ color: '#94A3B8' }}>Multilingual AI Assistant (EN / JA)</Link></li>
            <li><Link to="/my-bookings" style={{ color: '#94A3B8' }}>Atomic Reservation Management</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '14px', fontWeight: 600 }}>Architecture & Tech</h4>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6 }}>
            React (Vite) • Node.js Express • MySQL • JWT Authentication • Zero-Trust Pricing Logic.
          </p>
        </div>
      </div>

      <div className="container" style={{ borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#64748B' }}>
        <p>© {new Date().getFullYear()} Komorebi Stays - Placement-Ready Hotel Booking Platform.</p>
        <p>Demo Dataset • Educational & Portfolio Project</p>
      </div>
    </footer>
  );
}
