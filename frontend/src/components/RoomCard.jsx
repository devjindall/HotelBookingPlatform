import React from 'react';
import { Users, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function RoomCard({ room, onSelectRoom, isSelected, checkIn, checkOut }) {
  const isAvailable = room.is_available !== false && (room.available_rooms === undefined || room.available_rooms > 0);

  return (
    <div className={`room-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}>
      <div className="room-card-main">
        <div className="room-card-header">
          <h4 className="room-type-title">{room.room_type}</h4>
          <span className="room-capacity-badge">
            <Users size={14} /> Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''}
          </span>
        </div>

        {room.description && (
          <p className="room-description">{room.description}</p>
        )}

        <div className="room-meta-tags">
          {isAvailable ? (
            <span className="badge badge-confirmed">
              <CheckCircle size={12} />
              {room.available_rooms !== undefined 
                ? `${room.available_rooms} room${room.available_rooms > 1 ? 's' : ''} available`
                : 'Available'}
            </span>
          ) : (
            <span className="badge badge-cancelled">
              <AlertCircle size={12} /> Sold Out for Dates
            </span>
          )}

          <span className="room-inventory-note">
            Total property units: {room.total_rooms}
          </span>
        </div>
      </div>

      <div className="room-card-sidebar">
        <div className="room-price-display">
          <span className="room-price-amount">¥{Number(room.price_per_night).toLocaleString()}</span>
          <span className="room-price-period">/ night</span>
        </div>

        <button 
          onClick={() => onSelectRoom(room)} 
          disabled={!isAvailable}
          className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'} ${!isAvailable ? 'disabled' : ''}`}
        >
          {isSelected ? 'Selected' : (isAvailable ? 'Reserve' : 'Unavailable')}
        </button>
      </div>
    </div>
  );
}
