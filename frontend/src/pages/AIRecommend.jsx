import React, { useState } from 'react';
import AIRecommendationBox from '../components/AIRecommendationBox';
import HotelCard from '../components/HotelCard';
import { aiService } from '../services/api';
import { Sparkles, MapPin, Users, DollarSign, Coffee, AlertCircle } from 'lucide-react';
import '../styles/ai.css';
import '../styles/hotels.css';

export default function AIRecommend() {
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRecommend = async (prompt) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await aiService.getRecommendations(prompt);
      if (data.success) {
        setPreferences(data.preferences);
        setRecommendations(data.data || []);
      }
    } catch (err) {
      setError(err.message || 'AI recommendation service error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-recommend-page" style={{ paddingBottom: '80px' }}>
      <section className="ai-page-hero">
        <div className="container" style={{ maxWidth: '900px' }}>
          <AIRecommendationBox onRecommend={handleRecommend} loading={loading} />
        </div>
      </section>

      <div className="container" style={{ maxWidth: '1000px' }}>
        {error && (
          <div className="auth-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Extracted Structured Preferences Banner */}
        {preferences && (
          <div className="ai-extracted-banner">
            <span className="ai-extracted-title">Extracted Criteria & Intent</span>
            <p className="ai-summary-text">{preferences.summary}</p>
            
            <div className="ai-criteria-tags">
              {preferences.city && (
                <span className="badge badge-city">
                  <MapPin size={12} /> City: {preferences.city}
                </span>
              )}
              {preferences.guests && (
                <span className="badge badge-rating">
                  <Users size={12} /> Capacity: {preferences.guests} Guest(s)
                </span>
              )}
              {preferences.maxPrice && (
                <span className="badge badge-confirmed">
                  <DollarSign size={12} /> Max: ¥{Number(preferences.maxPrice).toLocaleString()}/night
                </span>
              )}
              {preferences.breakfast && (
                <span className="badge badge-breakfast">
                  <Coffee size={12} /> Breakfast: Required
                </span>
              )}
              {preferences.search && (
                <span className="badge badge-city">
                  Keyword: {preferences.search}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Results List */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing natural language and querying matching database records...</p>
          </div>
        ) : hasSearched && (
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px' }}>
              Recommended Properties ({recommendations.length})
            </h3>

            {recommendations.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 20px',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  No exact match found in our Japan database. Try broadening your criteria or budget.
                </p>
              </div>
            ) : (
              <div className="hotel-grid">
                {recommendations.map(hotel => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
