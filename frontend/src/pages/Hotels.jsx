import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import HotelCard from '../components/HotelCard';
import { hotelService } from '../services/api';
import { Compass, AlertCircle, Building2 } from 'lucide-react';
import '../styles/hotels.css';

export default function Hotels() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract filter parameters from URL query string
  const city = searchParams.get('city') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const breakfast = searchParams.get('breakfast') || '';
  const guests = searchParams.get('guests') || '';
  const search = searchParams.get('search') || '';

  const filters = { city, maxPrice, minRating, breakfast, guests, search };

  useEffect(() => {
    async function fetchHotelList() {
      setLoading(true);
      setError(null);
      try {
        const data = await hotelService.getHotels(filters);
        if (data.success && Array.isArray(data.data)) {
          setHotels(data.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve hotel list.');
      } finally {
        setLoading(false);
      }
    }

    fetchHotelList();
  }, [city, maxPrice, minRating, breakfast, guests, search]);

  const handleFilterChange = (newFilters) => {
    const nextParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) {
        nextParams.set(k, v);
      }
    });
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="hotels-page" style={{ padding: '36px 0 80px' }}>
      <div className="container">
        {/* Header and Quick Search */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Discover Hotels & Ryokans in Japan
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Showing curated properties with transparent pricing and live room inventory.
          </p>
          <SearchBar initialValues={filters} onSearch={handleFilterChange} compact />
        </div>

        {/* Main 2-Column Layout (Filters + Cards) */}
        <div className="hotels-page-layout">
          <FilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onResetFilters={handleResetFilters} 
          />

          <main className="hotels-results-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                Found <strong>{hotels.length}</strong> {hotels.length === 1 ? 'hotel' : 'hotels'}
                {city ? ` in ${city}` : ''}
              </p>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Searching verified properties in MySQL database...</p>
              </div>
            ) : error ? (
              <div className="auth-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} /> {error}
              </div>
            ) : hotels.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '60px 20px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Building2 size={48} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  No matching hotels found
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Try adjusting your price range, guest count, or destination filters to view more available accommodations.
                </p>
                <button onClick={handleResetFilters} className="btn btn-secondary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="hotel-grid">
                {hotels.map(hotel => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
