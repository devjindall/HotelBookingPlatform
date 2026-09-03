import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import { hotelService } from '../services/api';
import { Star, MapPin, Coffee, Users, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import '../styles/details.css';

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Availability inputs
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '1');
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fallbackImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

  useEffect(() => {
    async function loadHotelAndRooms() {
      setLoading(true);
      setError(null);
      try {
        const hotelRes = await hotelService.getHotelById(id);
        if (hotelRes.success) {
          setHotel(hotelRes.data);
        }

        const roomsRes = await hotelService.getHotelRooms(id, {
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
          guests: guests || undefined
        });

        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load hotel information.');
      } finally {
        setLoading(false);
      }
    }

    loadHotelAndRooms();
  }, [id, checkIn, checkOut, guests]);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);

    // If dates are already chosen, proceed directly to booking review
    if (checkIn && checkOut) {
      navigate(`/booking?hotelId=${hotel.id}&roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    } else {
      // Prompt user to select dates on the card
      const dateSection = document.getElementById('date-picker-card');
      if (dateSection) {
        dateSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleProceedToBooking = () => {
    if (!selectedRoom) {
      alert('Please select a room type first.');
      return;
    }
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates.');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      alert('Check-out date must be strictly after check-in date.');
      return;
    }
    navigate(`/booking?hotelId=${hotel.id}&roomId=${selectedRoom.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p>Loading hotel details and live room availability...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="auth-error-alert" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error || 'Hotel not found'}
        </div>
        <div>
          <button onClick={() => navigate('/hotels')} className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Hotel Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-details-page">
      {/* Header Banner */}
      <section className="details-hero">
        <div className="container">
          <button onClick={() => navigate('/hotels')} className="btn btn-secondary btn-sm" style={{ marginBottom: '16px' }}>
            <ArrowLeft size={14} /> Back to Catalog
          </button>

          <div className="details-header-row">
            <div>
              <h1 className="details-hotel-name">{hotel.name}</h1>
              <p className="details-location">
                <MapPin size={16} color="var(--accent-primary)" /> {hotel.address}, {hotel.city}, Japan
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF3C7', padding: '8px 14px', borderRadius: 'var(--radius-md)' }}>
                <Star size={18} fill="#D97706" color="#D97706" />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400E' }}>{Number(hotel.rating).toFixed(1)}</span>
              </div>
              {hotel.breakfast_available && (
                <span className="badge badge-breakfast" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                  <Coffee size={15} /> Breakfast Included
                </span>
              )}
            </div>
          </div>

          {/* Visual Gallery */}
          <div className="details-gallery">
            <img 
              src={hotel.image_url || fallbackImage} 
              alt={hotel.name} 
              className="details-main-img"
              onError={(e) => { e.target.src = fallbackImage; }}
            />
            <div className="details-sub-gallery">
              <img 
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80" 
                alt="Room view" 
                className="details-sub-img" 
              />
              <img 
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80" 
                alt="Property interior" 
                className="details-sub-img" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Room Selection */}
      <div className="container details-content-grid">
        {/* Left Column: Description and Room Types */}
        <div>
          <section style={{ marginBottom: '40px' }}>
            <h2 className="section-heading">About the Property</h2>
            <p className="details-description-text">{hotel.description}</p>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-heading" style={{ marginBottom: 0 }}>Available Room Categories</h2>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {rooms.length} room {rooms.length === 1 ? 'type' : 'types'}
              </span>
            </div>

            <div className="rooms-list">
              {rooms.map(room => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  onSelectRoom={handleSelectRoom}
                  isSelected={selectedRoom?.id === room.id}
                  checkIn={checkIn}
                  checkOut={checkOut}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Date & Reservation Selector */}
        <div>
          <aside className="availability-check-card" id="date-picker-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              Check Stay Dates
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="search-field-label" style={{ marginBottom: '6px' }}>
                  <Calendar size={14} className="field-icon" /> Check-in Date
                </label>
                <input 
                  type="date" 
                  value={checkIn} 
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="search-field-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="search-field-label" style={{ marginBottom: '6px' }}>
                  <Calendar size={14} className="field-icon" /> Check-out Date
                </label>
                <input 
                  type="date" 
                  value={checkOut} 
                  min={checkIn || undefined}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="search-field-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="search-field-label" style={{ marginBottom: '6px' }}>
                  <Users size={14} className="field-icon" /> Number of Guests
                </label>
                <select 
                  value={guests} 
                  onChange={(e) => setGuests(e.target.value)}
                  className="search-field-input select-input"
                  style={{ width: '100%' }}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests</option>
                </select>
              </div>
            </div>

            {selectedRoom && (
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '18px'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                  Selected Room
                </span>
                <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {selectedRoom.room_type}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  ¥{Number(selectedRoom.price_per_night).toLocaleString()} / night
                </p>
              </div>
            )}

            <button 
              onClick={handleProceedToBooking}
              className="btn btn-primary btn-lg" 
              style={{ width: '100%' }}
              disabled={!selectedRoom || !checkIn || !checkOut}
            >
              {selectedRoom ? 'Proceed to Reservation' : 'Select a Room Above'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
