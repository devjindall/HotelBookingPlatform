import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCard from '../components/BookingCard';
import { bookingService } from '../services/api';
import { CalendarCheck, AlertCircle, Compass } from 'lucide-react';
import '../styles/booking.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getMyBookings();
      if (data.success && Array.isArray(data.data)) {
        setBookings(data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    await bookingService.cancelBooking(bookingId);
    // Refresh bookings list
    await fetchBookings();
  };

  return (
    <div className="my-bookings-page" style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              My Reservations
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Manage your upcoming stays, view reservation history, or cancel active bookings.
            </p>
          </div>

          <Link to="/hotels" className="btn btn-outline btn-sm">
            <Compass size={14} /> Book Another Stay
          </Link>
        </div>

        {error && (
          <div className="auth-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Retrieving your reservation records...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <CalendarCheck size={48} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              No reservations found
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              You don't have any bookings yet. Explore our curated properties in Tokyo, Kyoto, and Osaka.
            </p>
            <Link to="/hotels" className="btn btn-primary">
              Explore Available Hotels
            </Link>
          </div>
        ) : (
          <div>
            {bookings.map(booking => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
