import React, { useState } from 'react';
import { Sparkles, Send, Tag } from 'lucide-react';

export default function AIRecommendationBox({ onRecommend, loading }) {
  const [prompt, setPrompt] = useState('');

  const samplePrompts = [
    {
      label: 'Tokyo Couple with Breakfast',
      text: 'I need a hotel in Tokyo for two people, under ¥15,000 per night, near a train station, with breakfast.'
    },
    {
      label: 'Japanese: 東京 朝食付き',
      text: '東京で2人で泊まれる、駅に近くて朝食付き、1泊1万5千円以下のホテルを探してください。'
    },
    {
      label: 'Kyoto Traditional Ryokan',
      text: 'Traditional Japanese ryokan in Kyoto with tatami mats, peaceful garden, and breakfast for 2 people.'
    },
    {
      label: 'Osaka Budget Foodie Stay',
      text: 'Affordable hotel in Osaka near Dotonbori under ¥12,000 for solo traveler.'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onRecommend(prompt.trim());
    }
  };

  const handleChipClick = (text) => {
    setPrompt(text);
    if (!loading) {
      onRecommend(text);
    }
  };

  return (
    <div className="ai-box-container">
      <div className="ai-box-header">
        <div className="ai-badge">
          <Sparkles size={16} /> AI Travel Assistant
        </div>
        <h2 className="ai-box-title">Tell us what you're looking for</h2>
        <p className="ai-box-subtitle">
          Describe your dream trip in plain English or Japanese. Our AI extracts your structured criteria and queries authentic live properties in MySQL.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="ai-form">
        <div className="ai-input-wrapper">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Looking for a quiet hotel in Kyoto with breakfast for 2 guests under ¥20,000 per night..."
            className="ai-textarea"
            rows={3}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!prompt.trim() || loading} 
            className="btn btn-primary ai-submit-btn"
          >
            {loading ? <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#FFF' }}></div> : <Send size={16} />}
            <span>Get Recommendations</span>
          </button>
        </div>
      </form>

      <div className="ai-samples-section">
        <span className="samples-label">Try these sample prompts:</span>
        <div className="samples-chips">
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-chip"
              onClick={() => handleChipClick(s.text)}
              disabled={loading}
            >
              <Tag size={12} /> {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
