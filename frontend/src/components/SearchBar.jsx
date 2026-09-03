import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Search } from 'lucide-react';

export default function SearchBar({ initialValues = {}, onSearch, compact = false }) {
  const navigate = useNavigate();

  const [city, setCity] = useState(initialValues.city || '');
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || '');
  const [guests, setGuests] = useState(initialValues.guests || '1');

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryParams = {
      city: city || undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests || undefined
    };

    if (onSearch) {
      onSearch(queryParams);
    } else {
      const searchParams = new URLSearchParams();
      if (city) searchParams.append('city', city);
      if (checkIn) searchParams.append('checkIn', checkIn);
      if (checkOut) searchParams.append('checkOut', checkOut);
      if (guests && guests !== '1') searchParams.append('guests', guests);
      
      navigate(`/hotels?${searchParams.toString()}`);
    }
  };

  return (
    <form className={`search-bar-form ${compact ? 'compact' : ''}`} onSubmit={handleSubmit}>
      {/* Destination Field */}
      <div className="search-field">
        <label className="search-field-label">
          <MapPin size={14} className="field-icon" /> Destination
        </label>
        <select 
          value={city} 
          onChange={(e) => setCity(e.target.value)}
          className="search-field-input select-input"
        >
          <option value="">All Destinations (Japan)</option>
          <option value="Tokyo">Tokyo (8 properties)</option>
          <option value="Kyoto">Kyoto (6 properties)</option>
          <option value="Osaka">Osaka (6 properties)</option>
        </select>
      </div>

      {/* Check-In Date */}
      <div className="search-field">
        <label className="search-field-label">
          <Calendar size={14} className="field-icon" /> Check-in
        </label>
        <input 
          type="date" 
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="search-field-input"
        />
      </div>

      {/* Check-Out Date */}
      <div className="search-field">
        <label className="search-field-label">
          <Calendar size={14} className="field-icon" /> Check-out
        </label>
        <input 
          type="date" 
          value={checkOut}
          min={checkIn || undefined}
          onChange={(e) => setCheckOut(e.target.value)}
          className="search-field-input"
        />
      </div>

      {/* Guests Count */}
      <div className="search-field">
        <label className="search-field-label">
          <Users size={14} className="field-icon" /> Guests
        </label>
        <select 
          value={guests} 
          onChange={(e) => setGuests(e.target.value)}
          className="search-field-input select-input"
        >
          <option value="1">1 Guest</option>
          <option value="2">2 Guests</option>
          <option value="3">3 Guests</option>
          <option value="4">4 Guests</option>
          <option value="5">5+ Guests</option>
        </select>
      </div>

      {/* Search Submit Button */}
      <div className="search-submit-field">
        <button type="submit" className="btn btn-primary search-submit-btn">
          <Search size={18} />
          <span>Find Hotels</span>
        </button>
      </div>
    </form>
  );
}
