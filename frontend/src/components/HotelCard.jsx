import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Coffee, Users, ArrowRight } from 'lucide-react';

export default function HotelCard({ hotel }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="hotel-card">
      <div className="hotel-card-image-wrapper">
        <img 
          src={hotel.image_url || fallbackImage} 
          alt={hotel.name} 
          className="hotel-card-image"
          onError={(e) => { e.target.src = fallbackImage; }}
          loading="lazy"
        />
        <span className="hotel-card-city-badge">
          <MapPin size={12} /> {hotel.city}
        </span>
      </div>

      <div className="hotel-card-content">
        <div className="hotel-card-header">
          <div className="hotel-card-rating">
            <Star size={14} className="star-icon" fill="#D97706" color="#D97706" />
            <span className="rating-val">{Number(hotel.rating).toFixed(1)}</span>
          </div>
          {hotel.breakfast_available && (
            <span className="badge badge-breakfast">
              <Coffee size={12} /> Breakfast Included
            </span>
          )}
        </div>

        <h3 className="hotel-card-title">{hotel.name}</h3>
        <p className="hotel-card-address">{hotel.address}</p>

        <p className="hotel-card-description">
          {hotel.description.length > 110 ? `${hotel.description.substring(0, 110)}...` : hotel.description}
        </p>

        <div className="hotel-card-footer">
          <div className="hotel-card-price-block">
            <span className="price-label">Starting from</span>
            <div className="price-val">
              ¥{Number(hotel.min_price).toLocaleString()}
              <span className="price-unit"> / night</span>
            </div>
          </div>

          <Link to={`/hotels/${hotel.id}`} className="btn btn-primary btn-sm">
            View Rooms <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
