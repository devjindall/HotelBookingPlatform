import React, { useState } from 'react';
import { Calendar, Users, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function BookingCard({ booking, onCancel }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  const isCancelled = booking.status === 'CANCELLED';

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    try {
      await onCancel(booking.id);
      setShowConfirmModal(false);
    } catch (err) {
      alert(err.message || 'Failed to cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={`booking-history-card ${isCancelled ? 'cancelled-card' : ''}`}>
      <div className="booking-card-media">
        <img 
          src={booking.hotel_image || fallbackImage} 
          alt={booking.hotel_name} 
          className="booking-image"
          onError={(e) => { e.target.src = fallbackImage; }}
        />
      </div>

      <div className="booking-card-details">
        <div className="booking-card-top">
          <span className="booking-ref">Booking #{booking.id}</span>
          {isCancelled ? (
            <span className="badge badge-cancelled">
              <XCircle size={13} /> Cancelled
            </span>
          ) : (
            <span className="badge badge-confirmed">
              <CheckCircle size={13} /> Confirmed
            </span>
          )}
        </div>

        <h3 className="booking-hotel-name">{booking.hotel_name}</h3>
        <p className="booking-hotel-city">
          <MapPin size={13} /> {booking.hotel_city} • {booking.hotel_address}
        </p>

        <div className="booking-stay-grid">
          <div className="stay-meta-item">
            <span className="stay-meta-label">Room Type</span>
            <span className="stay-meta-val">{booking.room_type}</span>
          </div>
          <div className="stay-meta-item">
            <span className="stay-meta-label">Check-in</span>
            <span className="stay-meta-val">{booking.check_in}</span>
          </div>
          <div className="stay-meta-item">
            <span className="stay-meta-label">Check-out</span>
            <span className="stay-meta-val">{booking.check_out}</span>
          </div>
          <div className="stay-meta-item">
            <span className="stay-meta-label">Duration & Guests</span>
            <span className="stay-meta-val">{booking.nights} night(s) • {booking.guests} guest(s)</span>
          </div>
        </div>

        <div className="booking-card-bottom">
          <div className="booking-price-block">
            <span className="total-price-label">Total price</span>
            <span className="total-price-amount">¥{Number(booking.total_price).toLocaleString()}</span>
          </div>

          {!isCancelled && (
            <button 
              onClick={() => setShowConfirmModal(true)} 
              className="btn btn-danger btn-sm"
            >
              Cancel Reservation
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <AlertTriangle size={24} color="#B91C1C" />
              <h3>Cancel Reservation #{booking.id}?</h3>
            </div>
            <p className="modal-body">
              Are you sure you want to cancel your stay at <strong>{booking.hotel_name}</strong> from <strong>{booking.check_in}</strong> to <strong>{booking.check_out}</strong>? The room inventory will be instantly released for other guests.
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="btn btn-secondary" 
                disabled={isCancelling}
              >
                Keep Booking
              </button>
              <button 
                onClick={handleCancelConfirm} 
                className="btn btn-danger" 
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
