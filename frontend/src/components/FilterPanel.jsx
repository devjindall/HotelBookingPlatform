import React from 'react';
import { Filter, Star, Coffee, RotateCcw } from 'lucide-react';

export default function FilterPanel({ filters, onFilterChange, onResetFilters }) {
  const handlePriceChange = (e) => {
    onFilterChange({ ...filters, maxPrice: e.target.value });
  };

  const handleRatingChange = (rating) => {
    onFilterChange({ ...filters, minRating: filters.minRating === rating ? '' : rating });
  };

  const handleBreakfastToggle = (e) => {
    onFilterChange({ ...filters, breakfast: e.target.checked ? 'true' : '' });
  };

  const handleCityClick = (city) => {
    onFilterChange({ ...filters, city: filters.city === city ? '' : city });
  };

  return (
    <aside className="filter-panel-card">
      <div className="filter-header">
        <h3 className="filter-title">
          <Filter size={16} /> Filters
        </h3>
        <button onClick={onResetFilters} className="filter-reset-btn" title="Clear all filters">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Destination Cities */}
      <div className="filter-group">
        <label className="filter-group-label">Popular Destinations</label>
        <div className="city-pill-group">
          {['Tokyo', 'Kyoto', 'Osaka'].map(city => (
            <button
              key={city}
              type="button"
              className={`city-pill ${filters.city === city ? 'active' : ''}`}
              onClick={() => handleCityClick(city)}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Maximum Price Range Slider */}
      <div className="filter-group">
        <div className="filter-label-row">
          <label className="filter-group-label">Max Price / Night</label>
          <span className="filter-value-display">
            {filters.maxPrice ? `¥${Number(filters.maxPrice).toLocaleString()}` : 'Any Price'}
          </span>
        </div>
        <input 
          type="range" 
          min="5000" 
          max="45000" 
          step="2500"
          value={filters.maxPrice || 45000}
          onChange={handlePriceChange}
          className="price-slider"
        />
        <div className="slider-limits">
          <span>¥5,000</span>
          <span>¥45,000+</span>
        </div>
      </div>

      {/* Minimum Star Rating */}
      <div className="filter-group">
        <label className="filter-group-label">Minimum Rating</label>
        <div className="rating-options">
          {[4.5, 4.0, 3.5].map((rating) => (
            <button
              key={rating}
              type="button"
              className={`rating-pill ${filters.minRating === String(rating) ? 'active' : ''}`}
              onClick={() => handleRatingChange(String(rating))}
            >
              <Star size={13} fill="#D97706" color="#D97706" /> {rating}+ Stars
            </button>
          ))}
        </div>
      </div>

      {/* Breakfast Included Checkbox */}
      <div className="filter-group">
        <label className="checkbox-container">
          <input 
            type="checkbox" 
            checked={filters.breakfast === 'true' || filters.breakfast === true}
            onChange={handleBreakfastToggle}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-text">
            <Coffee size={14} className="inline-icon" /> Breakfast Included Only
          </span>
        </label>
      </div>
    </aside>
  );
}
