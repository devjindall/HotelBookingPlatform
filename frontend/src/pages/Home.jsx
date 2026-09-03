import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import HotelCard from '../components/HotelCard';
import { hotelService } from '../services/api';
import { Sparkles, Shield, Compass, Star, ArrowRight, MapPin, Coffee, CheckCircle2 } from 'lucide-react';
import '../styles/hotels.css';

export default function Home() {
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await hotelService.getHotels({ minRating: 4.6 });
        if (data.success && data.data) {
          setFeaturedHotels(data.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load featured hotels:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(rgba(26, 34, 56, 0.65), rgba(26, 34, 56, 0.75)), url(https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1800&q=80) center/cover no-repeat',
        color: '#FFFFFF',
        padding: '80px 0 100px',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '880px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            color: '#FEF3C7',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '20px'
          }}>
            <Sparkles size={14} /> Curated Stays in Tokyo, Kyoto & Osaka
          </span>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '20px'
          }}>
            Experience Authentic Hospitality Across Japan
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#E2E8F0',
            lineHeight: 1.6,
            marginBottom: '40px',
            maxWidth: '680px',
            margin: '0 auto 40px'
          }}>
            Discover peaceful riverside ryokans, high-rise luxury suites, and boutique city sanctuaries with live room availability.
          </p>

          <SearchBar />
        </div>
      </section>

      {/* Destinations Showcase */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Explore By City
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              Featured Japanese Destinations
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Tokyo */}
            <Link to="/hotels?city=Tokyo" style={{
              position: 'relative',
              height: '240px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '24px',
              color: '#FFFFFF'
            }}>
              <img 
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80" 
                alt="Tokyo"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(transparent 40%, rgba(26, 34, 56, 0.85) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Tokyo</h3>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1' }}>8 Properties • Shinjuku, Shibuya, Ginza & Asakusa</p>
              </div>
            </Link>

            {/* Kyoto */}
            <Link to="/hotels?city=Kyoto" style={{
              position: 'relative',
              height: '240px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '24px',
              color: '#FFFFFF'
            }}>
              <img 
                src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80" 
                alt="Kyoto"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(transparent 40%, rgba(26, 34, 56, 0.85) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Kyoto</h3>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1' }}>6 Properties • Gion, Arashiyama & Kamo River</p>
              </div>
            </Link>

            {/* Osaka */}
            <Link to="/hotels?city=Osaka" style={{
              position: 'relative',
              height: '240px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '24px',
              color: '#FFFFFF'
            }}>
              <img 
                src="https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=800&q=80" 
                alt="Osaka"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(transparent 40%, rgba(26, 34, 56, 0.85) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Osaka</h3>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1' }}>6 Properties • Namba, Umeda & Osaka Castle</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section style={{ padding: '60px 0 80px', backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
            <div>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Handpicked Accommodations
              </span>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                Top Rated Japanese Stays
              </h2>
            </div>
            <Link to="/hotels" className="btn btn-outline">
              View All 20 Hotels <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading curated properties...</p>
            </div>
          ) : (
            <div className="hotel-grid">
              {featuredHotels.map(hotel => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI Assistant Banner Teaser */}
      <section style={{ padding: '70px 0', backgroundColor: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '48px',
          boxShadow: 'var(--shadow-md)',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '14px'
            }}>
              <Sparkles size={14} /> Smart Natural Language Search
            </span>

            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', lineHeight: 1.3 }}>
              Meet your AI Hotel Recommendation Assistant
            </h2>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
              Simply describe your trip in English or Japanese (e.g. <em>"Traditional ryokan in Kyoto for 2 people with breakfast under ¥20,000"</em>). Our backend extracts your exact preferences and queries authentic live properties.
            </p>

            <Link to="/ai-assistant" className="btn btn-primary btn-lg">
              <Sparkles size={18} /> Try AI Assistant Now
            </Link>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px'
          }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Example Natural Language Inputs:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ padding: '10px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                🇬🇧 "Hotel in Tokyo under ¥15,000 for 2 guests with breakfast"
              </div>
              <div style={{ padding: '10px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                🇯🇵 "京都で2人で泊まれる、朝食付きの旅館を探してください"
              </div>
              <div style={{ padding: '10px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                🇬🇧 "Solo stay in Osaka near Dotonbori station"
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
