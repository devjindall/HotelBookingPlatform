import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { hotelService, bookingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, MapPin, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import '../styles/booking.css';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const hotelId = searchParams.get('hotelId');
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = parseInt(searchParams.get('guests') || '1', 10);

  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));

  useEffect(() => {
    async function loadData() {
      if (!hotelId || !roomId || !checkIn || !checkOut) {
        setError('Missing booking parameters. Please return to hotel selection.');
        setLoading(false);
        return;
      }

      try {
        const hotelRes = await hotelService.getHotelById(hotelId);
        if (hotelRes.success) {
          setHotel(hotelRes.data);
          const foundRoom = hotelRes.data.rooms.find(r => String(r.id) === String(roomId));
          if (foundRoom) {
            setRoom(foundRoom);
          } else {
            setError('Selected room category was not found.');
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load reservation details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [hotelId, roomId, checkIn, checkOut]);

  const pricePerNight = room ? Number(room.price_per_night) : 0;
  const totalPrice = nights * pricePerNight;

  const handleConfirmReservation = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await bookingService.createBooking({
        roomId: parseInt(roomId, 10),
        checkIn,
        checkOut,
        guests
      });

      if (res.success && res.data) {
        setConfirmedBooking(res.data);
      }
    } catch (err) {
      setError(err.message || 'Booking creation failed. The room may have been reserved by another user.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p>Preparing your reservation review...</p>
      </div>
    );
  }

  if (confirmedBooking) {
    return (
      <div className="container booking-page-container">
        <div className="booking-card-wrapper" style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#DCFCE7', color: '#15803D', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <CheckCircle size={36} />
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Reservation Confirmed!
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Booking reference: <strong>#{confirmedBooking.id}</strong> • Confirmed for {user?.name}
          </p>

          <div className="booking-price-breakdown" style={{ textAlign: 'left', maxWidth: '520px', margin: '0 auto 28px' }}>
            <div className="breakdown-row">
              <span>Hotel</span>
              <strong>{confirmedBooking.hotel_name} ({confirmedBooking.hotel_city})</strong>
            </div>
            <div className="breakdown-row">
              <span>Room Category</span>
              <strong>{confirmedBooking.room_type}</strong>
            </div>
            <div className="breakdown-row">
              <span>Dates</span>
              <span>{confirmedBooking.check_in} → {confirmedBooking.check_out} ({confirmedBooking.nights} nights)</span>
            </div>
            <div className="breakdown-row">
              <span>Guests</span>
              <span>{confirmedBooking.guests} guest(s)</span>
            </div>
            <div className="breakdown-row total-row">
              <span>Total price</span>
              <span style={{ color: 'var(--accent-primary)' }}>¥{Number(confirmedBooking.total_price).toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link to="/my-bookings" className="btn btn-primary">
              View In My Bookings
            </Link>
            <Link to="/hotels" className="btn btn-secondary">
              Browse More Hotels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container booking-page-container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '20px' }}>
        <ArrowLeft size={14} /> Back to Details
      </button>

      <div className="booking-card-wrapper">
        <div className="booking-hero-header">
          <h1 className="booking-title">Review & Confirm Your Reservation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Please verify your stay details before confirming your reservation.
          </p>
        </div>

        {error && (
          <div className="auth-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {hotel && room && (
          <>
            <div className="booking-hotel-summary">
              <img
                src={hotel.image_url}
                alt={hotel.name}
                className="booking-hotel-thumb"
              />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {hotel.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <MapPin size={13} style={{ display: 'inline' }} /> {hotel.address}, {hotel.city}
                </p>
              </div>
            </div>

            <div className="booking-stay-grid">
              <div className="stay-meta-item">
                <span className="stay-meta-label">Room Type</span>
                <span className="stay-meta-val">{room.room_type}</span>
              </div>
              <div className="stay-meta-item">
                <span className="stay-meta-label">Check-in</span>
                <span className="stay-meta-val">{checkIn}</span>
              </div>
              <div className="stay-meta-item">
                <span className="stay-meta-label">Check-out</span>
                <span className="stay-meta-val">{checkOut}</span>
              </div>
              <div className="stay-meta-item">
                <span className="stay-meta-label">Guests</span>
                <span className="stay-meta-val">{guests} guest(s)</span>
              </div>
            </div>

            <div className="booking-price-breakdown">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
                Price Breakdown
              </h3>
              <div className="breakdown-row">
                <span>Room rate</span>
                <span>¥{pricePerNight.toLocaleString()} × {nights} night(s)</span>
              </div>
              <div className="breakdown-row">
                <span>Taxes & Service Fees</span>
                <span>Included (¥0)</span>
              </div>
              <div className="breakdown-row total-row">
                <span>Total price</span>
                <span style={{ color: 'var(--accent-primary)' }}>¥{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleConfirmReservation}
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                {submitting ? 'Confirming Reservation...' : 'Confirm Reservation'}
              </button>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
                <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Your booking will be checked for availability before it is confirmed.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
